import express, { Router, Response, Request, NextFunction, RequestHandler } from "express";
import SettingsModel from "../models/settings/settings.schema";

const router = Router();


type GetOpenAIResponseRequest = Request & {
    messages: { role: string, content: string }[];
    llm: string;
    query: string;
}
const getOpenAIResponse = async (req: GetOpenAIResponseRequest, res: Response, next: NextFunction) => {
    try {
        const { messages,llm, query } = req.body as GetOpenAIResponseRequest;

        console.log(llm, query);

        const settings = await SettingsModel.findOne();
        if (!settings) {
            return res.status(400).json({ error: 'Settings not found' });
        }

        const systemPrompt = settings?.systemPrompt || "You are a helpful assistant";
        
        // Add system message if not present
        if (messages.length === 0 || messages[0].role !== "system") {
            messages.push({
                role: "system",
                content: systemPrompt
            });
        } 


        messages.push({
            role: "user",
            content: query
        });

       
        
        // Make sure message exists
        if (!messages) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log(messages);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: llm,
                messages: messages
            })
        });

        console.log(response);

        const data = await response.json();


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


        let cost:number = 0;
        if (llm === 'gpt-4o-2024-08-06') {
            const input_tokens_cost = 2.5 / 1000000;
            const output_tokens_cost = 10 / 1000000;
            cost = (data.usage.prompt_tokens * input_tokens_cost) + (data.usage.completion_tokens * output_tokens_cost);
        } 
        res.status(200).json({ 
            aiResponse: responseMessage,
             messages: messages,
             promptTokens: data.usage.prompt_tokens,
             completionTokens: data.usage.completion_tokens,
             totalTokens: data.usage.total_tokens,
             cost: cost
            });
    } catch (error) {
        next(error);
    }
};

router.post("/getOpenAIResponse", getOpenAIResponse as express.RequestHandler);


export default router;