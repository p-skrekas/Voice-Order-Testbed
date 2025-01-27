import { Request, Response, NextFunction } from "express";
import { getEmbedding } from "./embedding";
import mongoose from "mongoose";
import { HttpError } from "../../models/http-error/http-error";
import { StatusCodes } from "http-status-codes";

export async function performVectorSearch(
    collectionName: string,
    indexName: string,
    queryText: string, 
    limit: number,
): Promise<any[]> {
    try {
        let queryVector: number[] = [];

        try {
            queryVector = await getEmbedding(queryText);
        } catch (error) {
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
                    _id: 0,
                    name: 1,
                    id: 1,
                    units_per_package: 1,
                    main_unit_desc: 1,
                    unit2_desc: 1,
                    sku: 1,
                    category_name: 1,
                    brand_name: 1,
                    published: 1,
                    score: { $meta: "vectorSearchScore" }
                }
            }
        ]).toArray();

        console.log('Results: ', results);
        return results;

    } catch (error) {
        console.error("Error performing vector search:", error);
        throw new HttpError("Could not perform search", StatusCodes.INTERNAL_SERVER_ERROR);
    }
}


type SearchRequest = {
    text: string;
    limit: number;
    productIds: string[];
}


export async function searchProducts(req: Request, res: Response, next: NextFunction) {
    try {

        // Validate request body
        if (!req.body || typeof req.body !== 'object') {
            throw new HttpError("Invalid request body", 400);
        }

        const { text, limit, productIds } = req.body as SearchRequest;
        
        if (!text || typeof text !== 'string') {
            throw new HttpError("Invalid search query. Please provide a text string.", 400);
        }
        
        if (!Array.isArray(productIds)) {
            throw new HttpError("Product IDs must be provided as an array", 400);
        }
        
        const searchResults = await performVectorSearch("products", "default", text, limit,);


        res.status(StatusCodes.OK).json(searchResults);

    } catch (error) {
        next(new HttpError("Failed to search products", StatusCodes.INTERNAL_SERVER_ERROR));
    }
}
