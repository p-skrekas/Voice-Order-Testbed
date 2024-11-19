import express, { Router, Response, Request, NextFunction, RequestHandler } from "express";
import SettingsModel from "../models/settings/settings.schema";
import { toolsOpenAI, toolsAnthropic } from "../utils/ai/tools";
import { performVectorSearch } from "../utils/ai/search";

const router = Router();

type GetOpenAIResponseRequest = Request & {
    messages: { role: string, content: string, tool_call_id?: string, name?: string }[];
    llm: string;
    query: string;
}



const computeCost = (llm: string, data: any) => {
    let input_tokens_cost = 0;
    let output_tokens_cost = 0;

    if (llm === "gpt-4o-mini-2024-07-18") {
        input_tokens_cost = 0.15 / 1000000;
        output_tokens_cost = 0.6 / 1000000;
    } else if (llm === "gpt-4o-2024-08-06") {
        input_tokens_cost = 2.5 / 1000000;
        output_tokens_cost = 10 / 1000000;
    }

    return (data.usage.prompt_tokens * input_tokens_cost) + (data.usage.completion_tokens * output_tokens_cost);
}



const responseSchema = {
    type: "json_schema",
    json_schema: {
        name: "Response",
        schema: {
            type: "object",
            properties: {
                steps: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            explanation: { type: "string" },
                            output: { type: "string" }
                        },
                        required: ["explanation", "output"],
                        additionalProperties: false
                    }
                },
                final_answer: { type: "string" },
                order_status: {
                    type: "object",
                    properties: {
                        status: { type: "string" },
                        details: { type: "string" }
                    },
                    required: ["status", "details"],
                    additionalProperties: false
                }
            },
            required: ["steps", "final_answer", "order_status"],
            additionalProperties: false
        },
        strict: true
    }
};

const getOpenAIResponse = async (req: GetOpenAIResponseRequest, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    try {
        let cleanedProducts: any[] = [];

        const { messages, llm, query } = req.body as GetOpenAIResponseRequest;

        // Add model name to response
        const modelName = llm === "gpt-4o-mini-2024-07-18" ? "GPT-4o Mini" :
            llm === "gpt-4o-2024-08-06" ? "GPT-4o" :
                llm === "gpt-4o-sonnet" ? "GPT-4o Sonnet" :
                    "GPT-4o Haiku";


        const settings = await SettingsModel.findOne();

        console.log('--- SETTINGS: ', settings);
        if (!settings) {
            return res.status(400).json({ error: 'Settings not found' });
        }

        if (!settings.systemPromptOpenAILarge) {
            return res.status(400).json({ error: 'System prompt not found' });
        }

        let systemPrompt = "";
        if (llm === "gpt-4o-mini-2024-07-18") {
            systemPrompt = settings.systemPromptOpenAIMini;
        } else if (llm === "gpt-4o-2024-08-06") {
            systemPrompt = settings.systemPromptOpenAILarge;
        }

        // Add system message if not present
        if (messages.length === 0 || messages[0].role !== "system") {
            messages.unshift({
                role: "system",
                content: systemPrompt
            });
        }

        // Add user message
        messages.push({
            role: "user",
            content: query
        });


        // Get response from OpenAI
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: llm,
                messages: messages,
                tools: toolsOpenAI,
                temperature: 0,
                response_format: responseSchema
            })
        });


        const data = await response.json();

        // If the response is a tool call
        if (data.choices[0].finish_reason === "tool_calls") {
            const toolCall = data.choices[0].message.tool_calls[0];

            if (toolCall.function.name === "searchProducts") {
                const products = await performVectorSearch("products", "default", query, 20);
                cleanedProducts = products.map(product => {
                    const { score, published, ...rest } = product;
                    return rest;
                });

                // Add the tool's message with the correct tool_call_id from the assistant's message
                messages.push({
                    role: "function",
                    name: toolCall.function.name,
                    content: JSON.stringify(cleanedProducts),
                    tool_call_id: toolCall.id
                });
            }

            const responsewithTools = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: llm,
                    messages: messages,
                    tools: toolsOpenAI
                })
            });

            const dataWithTools = await responsewithTools.json();
            const responseMessage = dataWithTools.choices[0].message.content;

            messages.push({
                role: "assistant",
                content: responseMessage
            });

            const responseTime = Date.now() - startTime;
            const cost = computeCost(llm, dataWithTools);
            return res.status(200).json({
                aiResponse: responseMessage,
                messages: messages,
                promptTokens: dataWithTools.usage.prompt_tokens,
                completionTokens: dataWithTools.usage.completion_tokens,
                totalTokens: dataWithTools.usage.total_tokens,
                cost: cost,
                products: JSON.stringify(cleanedProducts),
                responseTime,
                modelName,
                orderStatus: dataWithTools.choices[0].message.content.order_status
            });
        }

        // If we get here, it means it wasn't a tool call
        if (!data.choices || data.choices.length === 0) {
            return res.status(400).json({ error: 'No response from OpenAI' });
        }

        const responseMessage = data.choices[0].message.content;

        if (!responseMessage) {
            return res.status(400).json({ error: 'No response from OpenAI' });
        }

        messages.push({
            role: "assistant",
            content: responseMessage
        });

        const cost = computeCost(llm, data);
        const responseTime = Date.now() - startTime;
        return res.status(200).json({
            aiResponse: responseMessage,
            messages: messages,
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
            cost: cost,
            products: JSON.stringify(cleanedProducts),
            responseTime,
            modelName,
            orderStatus: data.choices[0].message.content.order_status
        });
    } catch (error) {
        next(error);
    }
};

const handleAnthropicError = (error: any, res: Response, next: NextFunction) => {

    console.error("Anthropic API Error:", error);
    if (error.response) {
        return res.status(error.response.status).json({
            message: "Anthropic API Error",
            details: error.response.data
        });
    } else {
        return res.status(500).json({
            message: "Internal Server Error",
            details: error.message
        });
    }
};


type toolContentanthropic = {
    type: string;
    tool_use_id: string;
    content: string;
}

interface AnthropicMessage {
    role: string;
    content: string | toolContentanthropic[];
    name?: string;
    tool_call_id?: string;
}

type GetAnthropicResponseRequest = Request & {
    messages: AnthropicMessage[];
    llm: string;
    query: string;
}

const createAnthropicAPIMessage = async (
    llm: string, 
    systemPrompt: string, 
    messages: AnthropicMessage[], 
    tools: any[]
) => {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
            'x-api-key': `${process.env.ANTHROPIC_API_KEY}`
        },
        body: JSON.stringify({
            model: llm,
            system: systemPrompt,
            messages: messages,
            tools: tools,
            max_tokens: 4096,
            temperature: 0
        })
    });
    console.log('Anthropic response: \n', response);
    return response;
}


const getResponseAnthropic = async (req: Request, res: Response, next: NextFunction) => {
    const { messages, llm, query } = req.body as GetAnthropicResponseRequest;
    const settings = await SettingsModel.findOne();
    if (!settings) {
        return res.status(400).json({ error: 'Settings not found' });
    }

    let systemPrompt = "";
    if (llm === "claude-3-5-sonnet-20241022") {
        systemPrompt = settings.systemPromptSonnet;
    } else if (llm === "claude-3-5-haiku-20241022") {
        systemPrompt = settings.systemPromptHaiku;
    }

    try {
        let currentMessages: AnthropicMessage[] = [...messages];

        currentMessages.push({
            role: "user",
            content: query
        });

        const startTime = Date.now();
        let response = await createAnthropicAPIMessage(llm, systemPrompt, currentMessages, toolsAnthropic);
        let data = await response.json();

        console.log('Anthropic response: \n', data);

        currentMessages.push({
            role: "assistant",
            content: data.content
        });

        while (data.stop_reason === "tool_use") {
            const toolResults: toolContentanthropic[] = [];

            for (const contentBlock of data.content) {
                if (contentBlock.type === "tool_use") {
                    const toolUseId = contentBlock.id;
                    let result;
                    
                    switch (contentBlock.name) {
                        case "searchProducts":
                            result = await performVectorSearch("products", "default", query, 20);
                            console.log("Search results:", result);
                            toolResults.push({
                                type: "tool_result",
                                tool_use_id: toolUseId,
                                content: JSON.stringify(result)
                            });
                            break;
                        default:
                            throw new Error(`Tool ${contentBlock.name} not found`);
                    }
                }
            }

            if (toolResults.length > 0) {
                currentMessages.push({
                    role: "user",
                    content: toolResults
                });
            }

            response = await createAnthropicAPIMessage(llm, systemPrompt, currentMessages, toolsAnthropic);
            const newData = await response.json();
            
            if (newData.content) {
                currentMessages.push({
                    role: "assistant",
                    content: newData.content
                });
            }

            data = newData;
        }

        const responseTime = Date.now() - startTime;

        let responseMessage = "";
        if (data.content && Array.isArray(data.content)) {
            for (const content of data.content) {
                if (content.type === "text") {
                    responseMessage += content.text;
                }
            }
        } else {
            responseMessage = JSON.parse(data.content);
        }


        console.log('Response message: \n', responseMessage);

        return res.status(200).json({
            aiResponse: data.content,
            messages: currentMessages,
            responseTime
        });
    } catch (error) {
        handleAnthropicError(error, res, next);
    }
}



router.post("/getOpenAIResponse", getOpenAIResponse as express.RequestHandler);
router.post("/getAnthropicResponse", getResponseAnthropic as express.RequestHandler);


export default router;