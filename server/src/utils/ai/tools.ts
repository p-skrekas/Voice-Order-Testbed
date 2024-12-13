export const toolsOpenAI = [
    {
        type: "function",
        function: {
            name: "searchProducts",
            description: "Search for products in the database",
            parameters: {
                type: "object",
                properties: {
                    text: { type: "string" },
                    limit: { type: "number" }
                },
                required: ["text", "limit"]
            }
        }
    }
]



export const toolsAnthropic = [
    {
        name: "searchProducts",
        description: "Search for new products in the database that you don't have in your context.",
        input_schema: {
            type: "object",
            properties: {
                query: { 
                    type: "string",
                    description: "The query to search for"
                },
            },
            required: ["query"]
        }
    }

]

