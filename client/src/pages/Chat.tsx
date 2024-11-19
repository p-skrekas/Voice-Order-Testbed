import { useState } from "react";
import { Mic, Barcode, ShoppingCart, Timer, Banknote } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";


interface Message {
    role: string;
    content: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
    responseTime?: number;
    products?: any[];
    order?: {
        productId: string;
        productName: string;
        quantity: number;
    }[];
    modelName?: string;
}


let BACKEND_URL: string;
if (process.env.NODE_ENV !== 'production') {
    BACKEND_URL = 'http://localhost:5000';
} else {
    BACKEND_URL = process.env.REACT_APP_API_ADDRESS || '';
}


export default function Chat() {
    const [messagesOpenAILarge, setMessagesOpenAILarge] = useState<Message[]>([]);
    const [messagesOpenAIMini, setMessagesOpenAIMini] = useState<Message[]>([]);
    const [messagesAnthropicLarge, setMessagesAnthropicLarge] = useState<Message[]>([]);
    const [messagesAnthropicMini, setMessagesAnthropicMini] = useState<Message[]>([]);

    const [displayMessages, setDisplayMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [currentModel, setCurrentModel] = useState<string>("");

    const getOpenAIResponseLarge = async (query: string, messages: Message[]) => {
        const responseOpenAILarge = await fetch(`${BACKEND_URL}/api/chat/getOpenAIResponse`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                llm: "gpt-4o-2024-08-06",
                query: query,
                messages: messages
            }),
        });

        return responseOpenAILarge;
    }

    const getOpenAIResponseMini = async (query: string, messages: Message[]) => {
        const responseOpenAIMini = await fetch(`${BACKEND_URL}/api/chat/getOpenAIResponse`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                llm: "gpt-4o-mini-2024-07-18",
                query: query,
                messages: messages
            }),
        });

        return responseOpenAIMini;
    }


    const getAnthropicResponseLarge = async (query: string, messages: Message[]) => {
        const responseAnthropic = await fetch(`${BACKEND_URL}/api/chat/getAnthropicResponse`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                llm: "claude-3-5-sonnet-20241022",
                query: query,
                messages: messages
            }),
        });

        return responseAnthropic;
    }

    const getAnthropicResponseMini = async (query: string, messages: Message[]) => {
        const responseAnthropic = await fetch(`${BACKEND_URL}/api/chat/getAnthropicResponse`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                llm: "claude-3-5-haiku-20241022",
                query: query,
                messages: messages
            }),
        });

        return responseAnthropic;
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        setIsTyping(true);
        e.preventDefault();
        if (!inputMessage.trim()) return;

        const userMessage = { 
            role: "user", 
            content: inputMessage.trim(), 
            promptTokens: 0, 
            completionTokens: 0, 
            totalTokens: 0, 
            cost: 0 
        };
        
        setMessagesOpenAILarge([...messagesOpenAILarge, userMessage]);
        setMessagesOpenAIMini([...messagesOpenAIMini, userMessage]);
        setMessagesAnthropicLarge([...messagesAnthropicLarge, userMessage]);
        setMessagesAnthropicMini([...messagesAnthropicMini, userMessage]);
        setDisplayMessages([...displayMessages, userMessage]);
        setInputMessage('');



        try {
            // Update status for large model
            setCurrentModel("Getting response from GPT-4o");
            const responseOpenAILarge = await getOpenAIResponseLarge(inputMessage.trim(), [...messagesOpenAILarge, userMessage]);

            // Update status for mini model
            setCurrentModel("Getting response from GPT-4o Mini");
            const responseOpenAIMini = await getOpenAIResponseMini(inputMessage.trim(), [...messagesOpenAIMini, userMessage]);

            // Update status for Anthropic large model
            setCurrentModel("Getting response from Claude 3.5 Sonnet");
            const responseAnthropic = await getAnthropicResponseLarge(inputMessage.trim(), [...messagesAnthropicLarge, userMessage]);

            // Update status for Anthropic mini model
            setCurrentModel("Getting response from Claude 3.5 Haiku");
            const responseAnthropicMini = await getAnthropicResponseMini(inputMessage.trim(), [...messagesAnthropicMini, userMessage]);

            // Parse responses
            const dataOpenAILarge = await responseOpenAILarge.json();
            const dataOpenAIMini = await responseOpenAIMini.json();
            const dataAnthropic = await responseAnthropic.json();
            const dataAnthropicMini = await responseAnthropicMini.json();

            // Extract the response content - handle both JSON string and parsed object cases
            const aiResponseMatchOpenAILarge = typeof dataOpenAILarge.aiResponse === 'string' 
                ? JSON.parse(dataOpenAILarge.aiResponse).response 
                : dataOpenAILarge.aiResponse.response;

            const aiResponseMatchOpenAIMini = typeof dataOpenAIMini.aiResponse === 'string' 
                ? JSON.parse(dataOpenAIMini.aiResponse).response 
                : dataOpenAIMini.aiResponse.response;

            const aiResponseAnthropicLarge = dataAnthropic.response;
            const aiResponseAnthropicMini = dataAnthropicMini.response;

            // Update messages states
            setMessagesAnthropicLarge([...messagesAnthropicLarge, userMessage, { 
                role: "assistant", 
                content: aiResponseAnthropicLarge, 
                promptTokens: dataAnthropic.promptTokens, 
                completionTokens: dataAnthropic.completionTokens, 
                totalTokens: dataAnthropic.totalTokens, 
                cost: dataAnthropic.cost,
                responseTime: dataAnthropic.responseTime,
            }]);

            setMessagesAnthropicMini([...messagesAnthropicMini, userMessage, { 
                role: "assistant", 
                content: aiResponseAnthropicMini, 
                promptTokens: dataAnthropicMini.promptTokens, 
                completionTokens: dataAnthropicMini.completionTokens, 
                totalTokens: dataAnthropicMini.totalTokens, 
                cost: dataAnthropicMini.cost,
                responseTime: dataAnthropicMini.responseTime,
            }]);

            // Update display messages with both responses
            setDisplayMessages([...displayMessages, userMessage, 
                { 
                    role: "assistant", 
                    content: aiResponseMatchOpenAILarge,
                    promptTokens: dataOpenAILarge.promptTokens, 
                    completionTokens: dataOpenAILarge.completionTokens, 
                    totalTokens: dataOpenAILarge.totalTokens, 
                    cost: dataOpenAILarge.cost,
                    responseTime: dataOpenAILarge.responseTime,
                    // products: productsOpenAILarge,
                    // order: orderOpenAILarge,
                    modelName: "GPT-4"
                },
                { 
                    role: "assistant", 
                    content: aiResponseMatchOpenAIMini,
                    promptTokens: dataOpenAIMini.promptTokens, 
                    completionTokens: dataOpenAIMini.completionTokens, 
                    totalTokens: dataOpenAIMini.totalTokens, 
                    cost: dataOpenAIMini.cost,
                    responseTime: dataOpenAIMini.responseTime,
                    // products: productsOpenAIMini,
                    // order: orderOpenAIMini,
                    modelName: "GPT-4 Mini"
                },
                {
                    role: "assistant",
                    content: aiResponseAnthropicLarge,
                    promptTokens: dataAnthropic.promptTokens,
                    completionTokens: dataAnthropic.completionTokens,
                    totalTokens: dataAnthropic.totalTokens,
                    cost: dataAnthropic.cost,
                    responseTime: dataAnthropic.responseTime,
                    modelName: "Claude 3.5 Sonnet"
                },
                {
                    role: "assistant",
                    content: aiResponseAnthropicMini,
                    promptTokens: dataAnthropicMini.promptTokens,
                    completionTokens: dataAnthropicMini.completionTokens,
                    totalTokens: dataAnthropicMini.totalTokens,
                    cost: dataAnthropicMini.cost,
                    responseTime: dataAnthropicMini.responseTime,
                    modelName: "Claude 3.5 Haiku"
                }
            ]);

        } catch (error) {
            console.error("Error fetching OpenAI response:", error);
        } finally {
            setIsTyping(false);
            setCurrentModel("");
        }
    };

    return (
        <div className="flex flex-col h-screen">

            <div className="flex h-full flex-row gap-1 overflow-y-auto p-4 ">    
                {/* Chat messages container */}
                <div className="flex h-full bg-gray-50 justify-between w-full flex-col rounded-lg border">
                    {/* Messages container - add padding except bottom */}
                    <div className="flex flex-col gap-4 overflow-y-auto p-3 pb-0">
                        {displayMessages.map((message, index) => {
                            // Skip the Mini response as it's shown next to the Large response
                            if (message.role === 'assistant' && index > 0 && displayMessages[index - 1].role === 'assistant') {
                                return null;
                            }

                            return (
                                <div
                                    key={index}
                                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {message.role === 'user' ? (
                                        // User message layout remains the same
                                        <div className="flex flex-col text-sm w-full items-end">
                                            User
                                            <div className="flex w-[70%] rounded-lg p-3 bg-gray-600 text-white">
                                                <div className="flex-1">{message.content}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        // Assistant messages in a Card with proper padding
                                        <div className="flex flex-col text-sm w-full">
                                            <Card className="border-gray-200">
                                                <CardContent className="p-3">
                                                    {/* First row: OpenAI responses */}
                                                    <div className="flex gap-6">
                                                        <div className="flex-1 p-3">
                                                            <div className="font-semibold mb-2 flex justify-between items-center">
                                                                <span>GPT-4</span>
                                                                {message.responseTime && (
                                                                    <span className="flex flex-row gap-1 text-xs text-gray-500">
                                                                        <Timer size={16} />{message.responseTime}ms
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="rounded-lg p-3 bg-gray-200 text-gray-800">
                                                                <div className="flex-1">{message.content}</div>
                                                            </div>
                                                            <div className="mt-1 flex justify-between items-center text-xs text-gray-500">
                                                                <div className="flex gap-2 items-center">
                                                                    {message.cost !== null && 
                                                                        <span className="flex flex-row gap-1 text-xs text-gray-500">
                                                                            <Banknote size={16} /> ${message.cost.toFixed(6)}
                                                                        </span>
                                                                    }
                                                                </div>
                                                                <div>
                                                                    {message.order && message.order.length > 0 && (
                                                                        <Dialog>
                                                                            <DialogTrigger asChild>
                                                                                <Button variant="outline" size="sm">
                                                                                    <ShoppingCart size={16} />
                                                                                </Button>
                                                                            </DialogTrigger>
                                                                            <DialogContent className="max-h-[80vh] flex flex-col gap-4">
                                                                                <DialogHeader>
                                                                                    <DialogTitle>Order Details (GPT-4)</DialogTitle>
                                                                                    <DialogDescription>
                                                                                        Items identified in your order
                                                                                    </DialogDescription>
                                                                                </DialogHeader>
                                                                                <div className="grid gap-4 overflow-y-auto max-h-[60vh] pr-2">
                                                                                    {message.order.map((item, idx) => (
                                                                                        <div key={idx} className="p-2 border rounded">
                                                                                            <div className="font-medium">{item.productName}</div>
                                                                                            <div className="text-sm text-gray-500">
                                                                                                Quantity: {item.quantity}
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                                <DialogFooter className="mt-4">
                                                                                    <DialogTrigger asChild>
                                                                                        <Button variant="destructive">Close</Button>
                                                                                    </DialogTrigger>
                                                                                </DialogFooter>
                                                                            </DialogContent>
                                                                        </Dialog>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {index + 1 < displayMessages.length && 
                                                         displayMessages[index + 1].role === 'assistant' && (
                                                            <div className="flex-1 p-3">
                                                                <div className="font-semibold mb-2 flex justify-between items-center">
                                                                    <span>GPT-4 Mini</span>
                                                                    {displayMessages[index + 1].responseTime && (
                                                                        <span className="flex flex-row gap-1 text-xs text-gray-500">
                                                                            <Timer size={16} /> {displayMessages[index + 1].responseTime}ms
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="rounded-lg p-3 bg-gray-200 text-gray-800">
                                                                    <div className="flex-1">{displayMessages[index + 1].content}</div>
                                                                </div>
                                                                <div className="mt-1 flex justify-between items-center text-xs text-gray-500">
                                                                    <div className="flex gap-2 items-center">
                                                                        {displayMessages[index + 1].cost !== null && (
                                                                            <span className="flex flex-row gap-1 text-xs text-gray-500">
                                                                                <Banknote size={16} /> ${displayMessages[index + 1].cost.toFixed(6)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        {(() => {
                                                                            const nextMessage = displayMessages[index + 1];
                                                                            if (nextMessage?.order && nextMessage.order.length > 0) {
                                                                                return (
                                                                                    <Dialog>
                                                                                        <DialogTrigger asChild>
                                                                                            <Button variant="outline" size="sm">
                                                                                                <ShoppingCart size={16} />
                                                                                            </Button>
                                                                                        </DialogTrigger>
                                                                                        <DialogContent className="max-h-[80vh] flex flex-col gap-4">
                                                                                            <DialogHeader>
                                                                                                <DialogTitle>Order Details (GPT-4 Mini)</DialogTitle>
                                                                                                <DialogDescription>
                                                                                                    Items identified in your order
                                                                                                </DialogDescription>
                                                                                            </DialogHeader>
                                                                                            <div className="grid gap-4 overflow-y-auto max-h-[60vh] pr-2">
                                                                                                {nextMessage.order.map((item, idx) => (
                                                                                                    <div key={idx} className="p-2 border rounded">
                                                                                                        <div className="font-medium">{item.productName}</div>
                                                                                                        <div className="text-sm text-gray-500">
                                                                                                            Quantity: {item.quantity}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                ))}
                                                                                            </div>
                                                                                            <DialogFooter className="mt-4">
                                                                                                <DialogTrigger asChild>
                                                                                                    <Button variant="destructive">Close</Button>
                                                                                                </DialogTrigger>
                                                                                            </DialogFooter>
                                                                                        </DialogContent>
                                                                                    </Dialog>
                                                                                );
                                                                            }
                                                                            return null;
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Second row: Anthropic responses */}
                                                    {index + 3 < displayMessages.length && 
                                                     displayMessages[index + 2]?.role === 'assistant' && 
                                                     displayMessages[index + 3]?.role === 'assistant' && (
                                                        <div className="flex gap-6 mt-6 pt-6 border-t">
                                                            {/* Anthropic Sonnet */}
                                                            <div className="flex-1 p-3">
                                                                <div className="font-semibold mb-2 flex justify-between items-center">
                                                                    <span>Claude 3.5 Sonnet</span>
                                                                    {displayMessages[index + 2]?.responseTime && (
                                                                        <span className="flex flex-row gap-1 text-xs text-gray-500">
                                                                            <Timer size={16} /> {displayMessages[index + 2].responseTime}ms
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="rounded-lg p-3 bg-gray-200 text-gray-800">
                                                                    <div className="flex-1">{displayMessages[index + 2]?.content}</div>
                                                                </div>
                                                                {/* Cost display with null check */}
                                                                <div className="mt-1 flex justify-between items-center text-xs text-gray-500">
                                                                    {displayMessages[index + 2]?.cost != null && (
                                                                        <span className="flex flex-row gap-1 text-xs text-gray-500">
                                                                            <Banknote size={16} /> ${Number(displayMessages[index + 2].cost).toFixed(6)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Anthropic Haiku */}
                                                            <div className="flex-1 p-3">
                                                                <div className="font-semibold mb-2 flex justify-between items-center">
                                                                    <span>Claude 3.5 Haiku</span>
                                                                    {displayMessages[index + 3]?.responseTime && (
                                                                        <span className="flex flex-row gap-1 text-xs text-gray-500">
                                                                            <Timer size={16} /> {displayMessages[index + 3].responseTime}ms
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="rounded-lg p-3 bg-gray-200 text-gray-800">
                                                                    <div className="flex-1">{displayMessages[index + 3]?.content}</div>
                                                                </div>
                                                                {/* Cost display with null check */}
                                                                <div className="mt-1 flex justify-between items-center text-xs text-gray-500">
                                                                    {displayMessages[index + 3]?.cost != null && (
                                                                        <span className="flex flex-row gap-1 text-xs text-gray-500">
                                                                            <Banknote size={16} /> ${Number(displayMessages[index + 3].cost).toFixed(6)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        
                        {/* Add typing indicator */}
                        {isTyping && (
                            <div className="flex gap-3 justify-start">
                                <div className="flex flex-col text-sm w-full items-start">
                                    <div className="flex w-[70%] rounded-lg p-3 text-gray-800">
                                        <div className="flex flex-col gap-2">
                                            <span className="text-sm text-gray-600">{currentModel}</span>
                                            <div className="flex gap-1 items-center">
                                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Message input form - separate from messages container */}
                    <form onSubmit={handleSendMessage} className="border-t p-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 text-sm rounded-lg border p-2 focus:outline-none focus:border-blue-500"
                                disabled={isTyping}
                            />
                            <button
                                type="submit"
                                disabled={isTyping}
                                className={`px-4 py-2 rounded-lg text-white ${
                                    isTyping 
                                    ? 'bg-blue-300 cursor-not-allowed' 
                                    : 'bg-blue-500 hover:bg-blue-600'
                                }`}
                            >
                                Send
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
