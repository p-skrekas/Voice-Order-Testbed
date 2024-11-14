export const tools = [
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