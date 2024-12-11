import express, { Router, Response, Request, NextFunction, RequestHandler } from "express";
import SettingsModel from "../models/settings/settings.schema";
import { toolsOpenAI, toolsAnthropic } from "../utils/ai/tools";
import { performVectorSearch } from "../utils/ai/search";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const router = Router();


const bedrockClient = new BedrockRuntimeClient({
    region: process.env.AWS_REGION
});

// Function to compute the cost of the response for all models
const computeCost = (llm: string, data: any) => {
    let input_tokens_cost = 0;
    let output_tokens_cost = 0;

    if (llm === "claude-3-5-sonnet-20241022") {
        input_tokens_cost = 3.0 / 1000000;
        output_tokens_cost = 15 / 1000000;
    } else if (llm === "claude-3-5-haiku-20241022") {
        input_tokens_cost = 1 / 1000000;
        output_tokens_cost = 5 / 1000000;
    }

    return (data.usage.prompt_tokens * input_tokens_cost) + (data.usage.completion_tokens * output_tokens_cost);
}


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
    currentCart: any[];
}

// Function to create a message for Anthropic
const createAnthropicAPIMessage = async (
    llm: string,
    systemPrompt: string,
    messages: AnthropicMessage[],
    tools: any[],

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
    const { messages, llm, query, currentCart } = req.body as GetAnthropicResponseRequest;
    const settings = await SettingsModel.findOne();
    if (!settings) {
        return res.status(400).json({ error: 'Settings not found' });
    }

    console.log('Current cart: ', currentCart);


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
            content: `The current customer's cart is:
                <current_cart>
                ${JSON.stringify(currentCart)}
                </current_cart>
            `
        });

        console.log('Current messages (added current cart): ', currentMessages);

        currentMessages.push({
            role: "user",
            content: userPromptTemplate.replace("{{user_query}}", query)
        });

        console.log('Current messages: ', currentMessages);


        let response = await createAnthropicAPIMessage(llm, systemPrompt, currentMessages, toolsAnthropic);
        let data = await response.json();

        currentMessages.push({
            role: "assistant",
            content: data.content
        });


        while (data.stop_reason === "tool_use") {
            const toolResults: toolContentanthropic[] = [];
            const processedProductIds = new Set<number>();

            for (const contentBlock of data.content) {
                if (contentBlock.type === "tool_use") {
                    console.log('Tool use found: ', contentBlock);
                    const toolUseId = contentBlock.id;

                    let result;
                    switch (contentBlock.name) {
                        case "searchProducts":
                            result = await performVectorSearch("products", "default", contentBlock.input['query'], 20);
                            const uniqueResults = result.filter((product: any) => {
                                if (processedProductIds.has(product.id)) {
                                    return false;
                                }
                                processedProductIds.add(product.id);
                                return true;
                            });
                            
                            toolResults.push({
                                type: "tool_result",
                                tool_use_id: toolUseId,
                                content: JSON.stringify(uniqueResults)
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

        return res.status(200).json({
            aiResponse: responseMessage,
            messages: currentMessages,
            responseTime,
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: data.usage.input_tokens + data.usage.output_tokens,
            cost: cost,
            orderStatus: 'unknown',
            sku: '',
            products: '[]'
        });
    } catch (error) {
        handleAnthropicError(error, res, next);
    }
}

// Routes
router.post("/getAnthropicResponse", getResponseAnthropic as express.RequestHandler);


export default router;