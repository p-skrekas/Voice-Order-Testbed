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
    order?: {
        id: number;
        name: string;
        quantity: number;
        unit: string;
    }[];
    modelName?: string;
    orderStatus?: string;
    error?: boolean;
}


let BACKEND_URL: string;
if (process.env.NODE_ENV !== 'production') {
    BACKEND_URL = 'http://localhost:5000';
} else {
    BACKEND_URL = process.env.REACT_APP_API_ADDRESS || '';
}


export default function Chat() {
    const [messagesAnthropicLarge, setMessagesAnthropicLarge] = useState<Message[]>([]);
    const [messagesAnthropicMini, setMessagesAnthropicMini] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [currentModel, setCurrentModel] = useState<string>("");

    

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

    const parseAIResponse = (xmlString: string) => {
        console.log('xmlString: ', xmlString)

        // Extract content between tags using regex
        const getTagContent = (tag: string, content: string) => {
            const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 's');
            const match = content.match(regex);
            return match ? match[1].trim() : '';
        };

        // Parse order items if they exist
        const parseOrder = () => {
            const orderContent = getTagContent('order', xmlString);
            if (!orderContent) return [];
            
            // Extract all product tags
            const products = orderContent.match(/<product>[\s\S]*?<\/product>/g) || [];
            
            return products.map(product => ({
                id: Number(getTagContent('id', product)),
                name: getTagContent('name', product),
                quantity: Number(getTagContent('quantity', product)),
                unit: 'pieces' // default unit if not specified
            }));
        };

        return {
            response: getTagContent('ai_response', xmlString),
            order_status: getTagContent('order_status', xmlString),
            order: parseOrder()
        };
    };

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

        setMessagesAnthropicLarge([...messagesAnthropicLarge, userMessage]);
        setMessagesAnthropicMini([...messagesAnthropicMini, userMessage]);
        setInputMessage('');

        try {
            // Update status for Anthropic large model
            setCurrentModel("Getting response from Claude 3.5 Sonnet");
            const [responseAnthropicLarge, responseAnthropicMini] = await Promise.allSettled([
                getAnthropicResponseLarge(inputMessage.trim(), [...messagesAnthropicLarge, userMessage]),
                getAnthropicResponseMini(inputMessage.trim(), [...messagesAnthropicMini, userMessage])
            ]);

            let sonnetResponse = null;
            let haikuResponse = null;

            // Handle Sonnet response
            if (responseAnthropicLarge.status === 'fulfilled' && responseAnthropicLarge.value.ok) {
                const dataAnthropicLarge = await responseAnthropicLarge.value.json();
                sonnetResponse = {
                    role: "assistant",
                    content: parseAIResponse(dataAnthropicLarge.aiResponse).response,
                    promptTokens: dataAnthropicLarge.promptTokens,
                    completionTokens: dataAnthropicLarge.completionTokens,
                    totalTokens: dataAnthropicLarge.totalTokens,
                    cost: dataAnthropicLarge.cost,
                    responseTime: dataAnthropicLarge.responseTime,
                    order: parseAIResponse(dataAnthropicLarge.aiResponse).order,
                    orderStatus: parseAIResponse(dataAnthropicLarge.aiResponse).order_status,
                    modelName: "Claude 3.5 Sonnet"
                };
            } else {
                const errorData = responseAnthropicLarge.status === 'fulfilled' 
                    ? await responseAnthropicLarge.value.json() 
                    : responseAnthropicLarge.reason;
                sonnetResponse = {
                    role: "assistant",
                    content: `Error: ${errorData.message || errorData.details || 'Failed to get response'}`,
                    promptTokens: 0,
                    completionTokens: 0,
                    totalTokens: 0,
                    cost: 0,
                    modelName: "Claude 3.5 Sonnet",
                    error: true
                };
            }

            // Handle Haiku response
            if (responseAnthropicMini.status === 'fulfilled' && responseAnthropicMini.value.ok) {
                const dataAnthropicMini = await responseAnthropicMini.value.json();
                haikuResponse = {
                    role: "assistant",
                    content: parseAIResponse(dataAnthropicMini.aiResponse).response,
                    promptTokens: dataAnthropicMini.promptTokens,
                    completionTokens: dataAnthropicMini.completionTokens,
                    totalTokens: dataAnthropicMini.totalTokens,
                    cost: dataAnthropicMini.cost,
                    responseTime: dataAnthropicMini.responseTime,
                    order: parseAIResponse(dataAnthropicMini.aiResponse).order,
                    orderStatus: parseAIResponse(dataAnthropicMini.aiResponse).order_status,
                    modelName: "Claude 3.5 Haiku"
                };
            } else {
                const errorData = responseAnthropicMini.status === 'fulfilled' 
                    ? await responseAnthropicMini.value.json() 
                    : responseAnthropicMini.reason;
                haikuResponse = {
                    role: "assistant",
                    content: `Error: ${errorData.message || errorData.details || 'Failed to get response'}`,
                    promptTokens: 0,
                    completionTokens: 0,
                    totalTokens: 0,
                    cost: 0,
                    modelName: "Claude 3.5 Haiku",
                    error: true
                };
            }

            setMessagesAnthropicLarge([...messagesAnthropicLarge, userMessage, sonnetResponse]);
            setMessagesAnthropicMini([...messagesAnthropicMini, userMessage, haikuResponse]);

        } catch (error) {
            console.error("Error in handleSendMessage:", error);
        } finally {
            setIsTyping(false);
            setCurrentModel("");
        }
    };

    const renderMessage = (message: Message) => (
        <div className={`rounded-lg p-3 ${message.error ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-800'}`}>
            <div className="flex-1">{message.content}</div>
        </div>
    );

    return (
        <div className="flex flex-col h-screen">

            <div className="flex h-full flex-row gap-1 overflow-y-auto p-4 ">    
                {/* Chat messages container */}
                <div className="flex h-full bg-gray-50 justify-between w-full flex-col rounded-lg border">
                    {/* Messages container - add padding except bottom */}
                    <div className="flex flex-col gap-4 overflow-y-auto p-3 pb-0">
                        {messagesAnthropicLarge.map((message, index) => {
                            const miniMessage = messagesAnthropicMini[index];
                            
                            return (
                                <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {message.role === 'user' ? (
                                        // User message layout remains the same
                                        <div className="flex flex-col text-sm w-full items-end">
                                            User
                                            <div className="flex w-[70%] rounded-lg p-3 bg-gray-600 text-white">
                                                <div className="flex-1">{message.content}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        // Assistant messages side by side
                                        <div className="flex flex-col text-sm w-full">
                                            <Card className="border-gray-200">
                                                <CardContent className="p-3">
                                                    <div className="flex gap-6">
                                                        {/* Sonnet Response */}
                                                        <div className="flex-1 p-3">
                                                            <div className="font-semibold mb-2 flex justify-between items-center">
                                                                <span>Sonnet</span>
                                                                {message.responseTime && (
                                                                    <span className="flex flex-row gap-1 text-xs text-gray-500">
                                                                        <Timer size={16} />{message.responseTime}ms
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="rounded-lg p-3 bg-gray-200 text-gray-800">
                                                                {renderMessage(message)}
                                                            </div>
                                                            <div className="mt-1 flex flex-col gap-1">
                                                                <div className="flex justify-between items-center text-xs text-gray-500">
                                                                    <div className="flex gap-2 items-center">
                                                                        {message.cost !== null && (
                                                                            <span className="flex flex-row gap-1 text-xs text-gray-500">
                                                                                <Banknote size={16} /> ${message.cost.toFixed(6)}
                                                                            </span>
                                                                        )}
                                                                        {message.orderStatus && (
                                                                            <span className="flex flex-row gap-1 text-xs text-gray-500 ml-2">
                                                                                <ShoppingCart size={16} /> {message.orderStatus}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {/* Order dialog for Sonnet */}
                                                                    {message.order && message.order.length > 0 && (
                                                                        <Dialog>
                                                                            <DialogTrigger asChild>
                                                                                <Button variant="outline" size="sm">
                                                                                    <ShoppingCart size={16} />
                                                                                </Button>
                                                                            </DialogTrigger>
                                                                            <DialogContent className="max-h-[80vh] flex flex-col gap-4">
                                                                                <DialogHeader>
                                                                                    <DialogTitle>Order Details ({message.modelName})</DialogTitle>
                                                                                    <DialogDescription>
                                                                                        Items identified in your order
                                                                                    </DialogDescription>
                                                                                </DialogHeader>
                                                                                <div className="grid gap-4 overflow-y-auto max-h-[60vh] pr-2">
                                                                                    {message.order.map((item, idx) => (
                                                                                        <div key={idx} className="p-2 border rounded">
                                                                                            <div className="font-medium">{item.name}</div>
                                                                                            <div className="text-sm text-gray-500">
                                                                                                ID: {item.id}
                                                                                                <br />
                                                                                                Quantity: {item.quantity} {item.unit}
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
                                                                <div className="text-xs text-gray-500">
                                                                    Total tokens: {message.totalTokens?.toLocaleString()} ({message.promptTokens?.toLocaleString()} prompt + {message.completionTokens?.toLocaleString()} completion)
                                                                </div>
                                                                {/* Add cost comparison */}
                                                                {message.cost > 0 && miniMessage?.cost > 0 && (
                                                                    <div className="text-xs text-blue-600 font-medium mt-1">
                                                                        {(message.cost / miniMessage.cost).toFixed(2)}x more expensive than Haiku
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Haiku Response */}
                                                        <div className="flex-1 p-3">
                                                            <div className="font-semibold mb-2 flex justify-between items-center">
                                                                <span>Haiku</span>
                                                                {miniMessage?.responseTime && (
                                                                    <span className="flex flex-row gap-1 text-xs text-gray-500">
                                                                        <Timer size={16} />{miniMessage.responseTime}ms
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="rounded-lg p-3 bg-gray-200 text-gray-800">
                                                                {renderMessage(miniMessage)}
                                                            </div>
                                                            <div className="mt-1 flex flex-col gap-1">
                                                                <div className="flex justify-between items-center text-xs text-gray-500">
                                                                    <div className="flex gap-2 items-center">
                                                                        {miniMessage?.cost !== null && (
                                                                            <span className="flex flex-row gap-1 text-xs text-gray-500">
                                                                                <Banknote size={16} /> ${miniMessage.cost.toFixed(6)}
                                                                            </span>
                                                                        )}
                                                                        {miniMessage?.orderStatus && (
                                                                            <span className="flex flex-row gap-1 text-xs text-gray-500 ml-2">
                                                                                <ShoppingCart size={16} /> {miniMessage.orderStatus}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {/* Order dialog for Haiku */}
                                                                    {miniMessage?.order && miniMessage.order.length > 0 && (
                                                                        <Dialog>
                                                                            <DialogTrigger asChild>
                                                                                <Button variant="outline" size="sm">
                                                                                    <ShoppingCart size={16} />
                                                                                </Button>
                                                                            </DialogTrigger>
                                                                            <DialogContent className="max-h-[80vh] flex flex-col gap-4">
                                                                                <DialogHeader>
                                                                                    <DialogTitle>Order Details ({miniMessage?.modelName})</DialogTitle>
                                                                                    <DialogDescription>
                                                                                        Items identified in your order
                                                                                    </DialogDescription>
                                                                                </DialogHeader>
                                                                                <div className="grid gap-4 overflow-y-auto max-h-[60vh] pr-2">
                                                                                    {miniMessage.order.map((item, idx) => (
                                                                                        <div key={idx} className="p-2 border rounded">
                                                                                            <div className="font-medium">{item.name}</div>
                                                                                            <div className="text-sm text-gray-500">
                                                                                                ID: {item.id}
                                                                                                <br />
                                                                                                Quantity: {item.quantity} {item.unit}
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
                                                                <div className="text-xs text-gray-500">
                                                                    Total tokens: {miniMessage?.totalTokens?.toLocaleString()} ({miniMessage?.promptTokens?.toLocaleString()} prompt + {miniMessage?.completionTokens?.toLocaleString()} completion)
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
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
