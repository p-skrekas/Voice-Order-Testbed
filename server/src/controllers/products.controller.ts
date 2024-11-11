import { Request, Response, NextFunction, text } from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import { HttpError } from "../models/http-error/http-error";
import mongoose from 'mongoose';
import { StatusCodes } from "http-status-codes";
import { Db } from 'mongodb';


dotenv.config();

// Validate OpenAI API key
if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not defined in the environment variables");
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});


// Interface for search response
interface SearchResponse {
    results: string;
    count: number;
    query: string;
    success: boolean;
}



async function getEmbedding(text: string): Promise<number[]> {
    try {
        const response = await openai.embeddings.create({
            model: process.env.OPENAI_MODEL_NAME || "text-embedding-3-large",
            input: text,
        });
        return response.data[0].embedding;
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw new HttpError("Failed to generate embedding", 500);
    }
}

export async function performVectorSearch(
    collectionName: string,
    indexName: string,
    queryText: string, 
    limit: number 
): Promise<any[]> {
    try {
        let queryVector: number[] = [];

        try {
            queryVector = await getEmbedding(queryText);
            console.log("Generated query vector:", queryVector);
        } catch (error) {
            console.error("Error generating embedding:", error);
            throw error;
        }

        if (!mongoose.connection.db) {
            throw new HttpError("Database connection is not established", 500);
        }

        const results = await mongoose.connection.db.collection(collectionName).aggregate([
            {
                $vectorSearch: {
                    index: indexName,
                    queryVector: queryVector,
                    path: "embedding",
                    numCandidates: 10000,
                    limit: limit
                }
            },
            {
                $project: {
                    name: 1,
                    id: 1,
                    units_per_package: 1,
                    main_unit_desc: 1,
                    unit2_desc: 1,
                    category_name: 1,
                    brand_name: 1,
                    published: 1,
                    score: { $meta: "vectorSearchScore" }
                }
            }
        ]).toArray();
        return results;

    } catch (error) {
        console.error("Error performing vector search:", error);
        throw new HttpError("Could not perform search", StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

const getRandomProducts = async (db: Db): Promise<string[]> => {
    try {
        const products = await db.collection('products').aggregate([
            { $project: { name: 1, _id: 0 } },
            { $sample: { size:    Math.floor(Math.random() * 10) + 1 } }
        ]).toArray();

        return products.map(product => product.name);
        
    } catch (error) {
        console.error('Error fetching random products:', error);
        throw error;
    }
};


type SearchRequest = {
    text: string;
    limit: number;
}


export async function searchProducts(req: Request, res: Response, next: NextFunction) {
    try {

        // Validate request body
        if (!req.body || typeof req.body !== 'object') {
            throw new HttpError("Invalid request body", 400);
        }

        const { text, limit }= req.body as SearchRequest;
        
        if (!text || typeof text !== 'string') {
            throw new HttpError("Invalid search query. Please provide a text string.", 400);
        }
        
        const searchResults = await performVectorSearch("products", "default", text, limit);
        console.log("Found ", searchResults.length, " results");


        res.status(StatusCodes.OK).json(searchResults);

    } catch (error) {
        console.error('Search products error:', error);
        next(error instanceof HttpError 
            ? error 
            : new HttpError(
                error instanceof Error ? error.message : "Failed to search products",
                500
              )
        );
    }
}





export async function createFakeOrder(req: Request, res: Response, next: NextFunction) {

    console.log("Creating fake order");
    try{ 
        const { productList, numberOfItems } = req.body;

     

        if(!mongoose.connection.db) {
            throw new HttpError("Database connection is not established", 500);
        }
        const randomProducts = await getRandomProducts(mongoose.connection.db);

  


        if (!randomProducts || randomProducts.length === 0) {
            throw new HttpError("No products found in database", 404);
        }
        



        const order = await openai.chat.completions.create({
            model: "gpt-4o-2024-08-06",
            messages: [
                { 
                    role: "system", 
                    content: `
                    You are a helpful assistant that generates orders based on a list of products.
                    You have the role of an employee that works in a sales point and you are
                    making order to restock the store.
                    `
                }, 
                { 
                    role: "user", 
                    content: `
                    Generate τηε order for the following products in Greek: ${randomProducts.join(', ')}
                    Use the bare minimum information of the product name to formulate the order.

                    Examples:
                    3 τεμάχια IQOS BAGS LARGE και 4 κούτερ MALBORO RED ΣΚΛΗΡΟ.
                    Πέντε HEETS RUSSET, τρία HEETS AMBER και 10 ASSOS SLIM ΧΡΥΣΟ


                    Respond only with the order, no other text or comments.

                    ` 
                }
            ],
        });


        res.status(200).json({ order: order.choices[0].message.content, products: randomProducts });

    } catch (error) {
        console.error("Error creating fake order:", error);
        return next(new HttpError("Failed to create fake order", 500));
    }

}