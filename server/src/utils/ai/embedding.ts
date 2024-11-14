import { OpenAI } from "openai";
import { HttpError } from "../../models/http-error/http-error";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not defined in the environment variables");
}

const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});


export async function getEmbedding(text: string): Promise<number[]> {
    try {
        const response = await openaiClient.embeddings.create({
            model: process.env.OPENAI_MODEL_NAME || "text-embedding-3-large",
            input: text,
        });
        return response.data[0].embedding;
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw new HttpError("Failed to generate embedding", 500);
    }
}
