import express, { Router, Response, Request, NextFunction, RequestHandler } from "express";
import SettingsModel from "../models/settings/settings.schema";
import { tools } from "../utils/ai/tools";
import { performVectorSearch } from "../utils/ai/search";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const router = Router();

type GetOpenAIResponseRequest = Request & {
    messages: { role: string, content: string, tool_call_id?: string, name?: string }[];
    llm: string;
    query: string;
}

const computeCost = (llm: string, data:any) => {
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
        } else if (llm === "gpt-4o-sonnet") {
            systemPrompt = settings.systemPromptSonnet;
        } else if (llm === "gpt-4o-haiku") {
            systemPrompt = settings.systemPromptHaiku;
        }

        // Add system message if not present
        if (messages.length === 0 || messages[0].role !== "system") {
            console.log('---Adding system prompt');
            messages.unshift({
                role: "system",
                content: systemPrompt
            });
        }

        // Add user message
        console.log('---Adding user message');
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
                tools: tools,
                temperature: 0,
                response_format: responseSchema
            })
        });

        console.log(response);

        const data = await response.json();

        console.log(data);

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
                    tools: tools
                })
            });

            const dataWithTools = await responsewithTools.json();

            console.log(dataWithTools);

            const responseMessage = dataWithTools.choices[0].message.content;

            console.log(responseMessage);

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

        const cost = computeCost(llm,data);
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

router.post("/getOpenAIResponse", getOpenAIResponse as express.RequestHandler);


export default router;