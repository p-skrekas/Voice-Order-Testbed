import express, { Router, Response, Request, NextFunction, RequestHandler } from "express";
import SettingsModel from "../models/settings/settings.schema";
import { toolsOpenAI, toolsAnthropic } from "../utils/ai/tools";
import { performVectorSearch } from "../utils/ai/search";

const router = Router();



// Function to compute the cost of the response for all models
const computeCost = (llm: string, data: any) => {
    let input_tokens_cost = 0;
    let output_tokens_cost = 0;

    if (llm === "gpt-4o-mini-2024-07-18") {
        input_tokens_cost = 0.15 / 1000000;
        output_tokens_cost = 0.6 / 1000000;
    } else if (llm === "gpt-4o-2024-08-06") {
        input_tokens_cost = 2.5 / 1000000;
        output_tokens_cost = 10 / 1000000;
    } else if (llm === "claude-3-5-sonnet-20241022") {
        input_tokens_cost = 3.0 / 1000000;
        output_tokens_cost = 15 / 1000000;
    } else if (llm === "claude-3-5-haiku-20241022") {
        input_tokens_cost = 1 / 1000000;
        output_tokens_cost = 5 / 1000000;
    }

    return (data.usage.prompt_tokens * input_tokens_cost) + (data.usage.completion_tokens * output_tokens_cost);
}


// ------------------------------------------
// ---               OPENAI               ---
// ------------------------------------------

// Request type for OpenAI
type GetOpenAIResponseRequest = Request & {
    messages: { role: string, content: string, tool_call_id?: string, name?: string }[];
    llm: string;
    query: string;
}


// Response schema for OpenAI
const responseSchema = {
    type: "json_schema",
    json_schema: {
        name: "Response",
        schema: {
            type: "object",
            properties: {
                response: {
                    type: "string",
                    description: "The final response from the assistant"
                },
                order: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            productId: { 
                                type: "string",
                                description: "The id of the product"
                            },
                            productName: {
                                type: "string",
                                description: "The name of the product"
                            },
                            productDescription: {
                                type: "string",
                                description: "The description of the product"
                            },
                            productPrice: { type: "number" }
                        },
                        required: ["productId", "productName", "productDescription", "productPrice"],
                        additionalProperties: false
                    }
                }
            },
            required: ["response", "order"],
            additionalProperties: false
        },
        strict: true
    }
};

// Function to get the response from OpenAI
// const getOpenAIResponse = async (req: GetOpenAIResponseRequest, res: Response, next: NextFunction) => {
//     const startTime = Date.now();
//     try {
//         let cleanedProducts: any[] = [];

//         const { llm, query, messages } = req.body as GetOpenAIResponseRequest;


//         if (messages.length === 0) {
//             return res.status(400).json({ error: 'No messages provided' });
//         }

//         const settings = await SettingsModel.findOne();

//         if (!settings) {
//             return res.status(400).json({ error: 'Settings not found' });
//         }

//         if (!settings.systemPromptOpenAILarge) {
//             return res.status(400).json({ error: 'System prompt not found' });
//         }

//         let systemPrompt = "";
//         if (llm === "gpt-4o-mini-2024-07-18") {
//             systemPrompt = settings.systemPromptOpenAIMini;
//         } else if (llm === "gpt-4o-2024-08-06") {
//             systemPrompt = settings.systemPromptOpenAILarge;
//         }

//         // Add system message if not present
//         if (messages.length === 0 || messages[0].role !== "system") {
//             messages.unshift({
//                 role: "system",
//                 content: systemPrompt
//             });
//         }

//         // Get response from OpenAI
//         const response = await fetch('https://api.openai.com/v1/chat/completions', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
//             },
//             body: JSON.stringify({
//                 model: llm,
//                 messages: messages,
//                 tools: toolsOpenAI,
//                 temperature: 0,
//                 response_format: responseSchema
//             })
//         });

//         const data = await response.json();

//         // If the response is a tool call
//         if (data.choices[0].finish_reason === "tool_calls") {
//             const toolCall = data.choices[0].message.tool_calls[0];

//             if (toolCall.function.name === "searchProducts") {
//                 const products = await performVectorSearch("products", "default", query, 20);
//                 cleanedProducts = products.map(product => {
//                     const { score, published, ...rest } = product;
//                     return rest;
//                 });

//                 // Add the tool's message with the correct tool_call_id from the assistant's message
//                 messages.push({
//                     role: "function",
//                     name: toolCall.function.name,
//                     content: JSON.stringify(cleanedProducts),
//                     tool_call_id: toolCall.id
//                 });
//             }

//             const responsewithTools = await fetch('https://api.openai.com/v1/chat/completions', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
//                 },
//                 body: JSON.stringify({
//                     model: llm,
//                     messages: messages,
//                     tools: toolsOpenAI
//                 })
//             });

//             const dataWithTools = await responsewithTools.json();
//             const responseMessage = dataWithTools.choices[0].message.content;

//             messages.push({
//                 role: "assistant",
//                 content: responseMessage
//             });

//             const cost = computeCost(llm, dataWithTools);
//             const responseTime = Date.now() - startTime;
//             return res.status(200).json({
//                 aiResponse: responseMessage,
//                 messages: messages,
//                 promptTokens: dataWithTools.usage.prompt_tokens,
//                 completionTokens: dataWithTools.usage.completion_tokens,
//                 totalTokens: dataWithTools.usage.total_tokens,
//                 cost: cost,
//                 products: JSON.stringify(cleanedProducts),
//                 responseTime,
//                 llm,
//                 orderStatus: dataWithTools.choices[0].message.content.order_status
//             });
//         }

//         // If we get here, it means it wasn't a tool call
//         if (!data.choices || data.choices.length === 0) {
//             return res.status(400).json({ error: 'No response from OpenAI' });
//         }

//         const responseMessage = data.choices[0].message.content;

//         console.log('Response message: \n', responseMessage);

//         if (!responseMessage) {
//             return res.status(400).json({ error: 'No response from OpenAI' });
//         }

//         messages.push({
//             role: "assistant",
//             content: responseMessage
//         });

//         const cost = computeCost(llm, data);
//         console.log(`Cost for (${llm}): ${cost}`);

//         const responseTime = Date.now() - startTime;
//         return res.status(200).json({
//             aiResponse: responseMessage,
//             messages: messages,
//             promptTokens: data.usage.prompt_tokens,
//             completionTokens: data.usage.completion_tokens,
//             totalTokens: data.usage.total_tokens,
//             cost: cost,
//             products: JSON.stringify(cleanedProducts),
//             responseTime,
//             llm,
//             orderStatus: data.choices[0].message.content.order_status
//         });
//     } catch (error) {
//         next(error);
//     }
// };


// ------------------------------------------
// ---             ANTHROPIC              ---
// ------------------------------------------

// Function to handle errors from Anthropic
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


// Type for tool content in Anthropic
type toolContentanthropic = {
    type: string;
    tool_use_id: string;
    content: string;
}

// Type for messages in Anthropic
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

// Function to create a message for Anthropic
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
            // system: systemPrompt,
            messages: messages.map(msg => ({
                role: msg.role,
                content: typeof msg.content === 'string' ? msg.content : msg.content
            })),
            tools: tools,
            max_tokens: 4096,
            temperature: 0
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }

    return response;
}

// Function to get the response from Anthropic
const getResponseAnthropic = async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const { messages, llm, query } = req.body as GetAnthropicResponseRequest;
    const settings = await SettingsModel.findOne();
    if (!settings) {
        return res.status(400).json({ error: 'Settings not found' });
    }

    console.log('Received messages: ', messages);

    let systemPrompt = "";
    let userPromptTemplate = "";
    let assistantPrefill = "";
    if (llm.includes("sonnet")) {
        systemPrompt = settings.systemPromptSonnet;
        userPromptTemplate = settings.userPromptTemplateSonnet;
        assistantPrefill = settings.assistantPrefillSonnet;
    } else if (llm.includes("haiku")) {
        systemPrompt = settings.systemPromptHaiku;
        userPromptTemplate = settings.userPromptTemplateHaiku;
        assistantPrefill = settings.assistantPrefillHaiku;
    }

    try {
        let currentMessages: AnthropicMessage[] = [...messages];
        
        currentMessages.push({
            role: "user",
            content: userPromptTemplate.replace("${query}", query)
        });

        if (currentMessages.length === 1) {
            currentMessages.push({
                role: "assistant",
                content: assistantPrefill
            });
        }


        let response = await createAnthropicAPIMessage(llm, systemPrompt, currentMessages, toolsAnthropic);
        let data = await response.json();

        console.log('Pushing assistant message', {
            role: "assistant",
            content: data.content
        })


        currentMessages.push({
            role: "assistant",
            content: data.content
        });


        while (data.stop_reason === "tool_use") {
            const toolResults: toolContentanthropic[] = [];

            for (const contentBlock of data.content) {
                if (contentBlock.type === "tool_use") {
                    console.log('Tool use found: ', contentBlock);
                    const toolUseId = contentBlock.id;

                    let result;

                    switch (contentBlock.name) {
                        case "searchProducts":
                
                            result = await performVectorSearch("products", "default", contentBlock.input['query'], 20);
                        
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

        const cost = computeCost(llm, {
            usage: {
                prompt_tokens: data.usage.input_tokens,
                completion_tokens: data.usage.output_tokens
            }
        });

        let parsedResponse;
        try {
            // Parse the response message if it's a string
            parsedResponse = typeof responseMessage === 'string' ? JSON.parse(responseMessage) : responseMessage;
        } catch (error) {
            console.error('Error parsing response:', error);
            parsedResponse = { response: responseMessage, order: [], order_status: 'unknown' };
        }

        return res.status(200).json({
            aiResponse: responseMessage,
            messages: currentMessages,
            responseTime,
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: data.usage.input_tokens + data.usage.output_tokens,
            cost: cost,
            orderStatus: parsedResponse.order_status,
            products: '[]'
        });
    } catch (error) {
        handleAnthropicError(error, res, next);
    }
}

// Routes
// router.post("/getOpenAIResponse", getOpenAIResponse as express.RequestHandler);
router.post("/getAnthropicResponse", getResponseAnthropic as express.RequestHandler);


export default router;