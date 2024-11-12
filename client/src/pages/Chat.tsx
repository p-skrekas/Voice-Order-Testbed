import { useState } from "react";

interface Message {
    role: string;
    content: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
}

let BACKEND_URL: string;
if (process.env.NODE_ENV !== 'production') {
    BACKEND_URL = 'http://localhost:5000';
} else {
    BACKEND_URL = process.env.REACT_APP_API_ADDRESS || '';
}


export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [llm, setLlm] = useState("gpt-4o-2024-08-06");

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        setMessages([...messages, { role: "user", content: inputMessage.trim(), promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0 }]);
        setInputMessage('');

        messages.push({ role: "user", content: inputMessage.trim(), promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0 });

        
        try {
            const response = await fetch(`${BACKEND_URL}/api/chat/getOpenAIResponse`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    llm: llm,
                    query: inputMessage.trim(),
                    messages: messages
                }),
            });

            const data = await response.json();
            console.log(data);
            setMessages([...messages, { role: "assistant", content: data.aiResponse, promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: data.cost }]);

        } catch (error) {
            console.error("Error fetching OpenAI response:", error);
        }
    };

    return (
        <div className="flex flex-col h-screen">

            <div className="flex h-full flex-row gap-1 overflow-y-auto p-4 ">
                {/* Chat messages container */}
                <div className="flex h-full  bg-gray-50 justify-between w-full flex-col rounded-lg border">
                    {/* Messages container - add padding except bottom */}
                    <div className="flex flex-col gap-4 overflow-y-auto p-3 pb-0">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex flex-col w-full ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    {message.role === 'user' ? 'User' : `Assistant (${llm})`}
                                    <div
                                        className={`flex w-[70%] rounded-lg p-3 ${message.role === 'user'
                                            ? 'bg-gray-600 text-white'
                                            : 'bg-gray-200 text-gray-800'
                                            }`}
                                    >
                                        {message.content}

                                    </div>
                                    <div>
                                        {message.role === 'assistant' && <span className="text-xs text-gray-500">Cost: ${message.cost.toFixed(6)}</span>}                                      
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Message input form - separate from messages container */}
                    <form onSubmit={handleSendMessage} className="border-t p-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 rounded-lg border p-2 focus:outline-none focus:border-blue-500"
                            />
                            <button
                                type="submit"
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                            >
                                Send
                            </button>
                        </div>
                    </form>
                </div>
                <div className="flex flex-col w-[300px] bg-gray-50 rounded-lg border p-3">
                    <span className="text-sm text-gray-500">
                        AI
                    </span>
                </div>
            </div>


        </div>
    );
}
