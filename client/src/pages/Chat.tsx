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
    const [displayMessages, setDisplayMessages] = useState<Message[]>([]);
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
        setDisplayMessages([...displayMessages, userMessage]);
        setInputMessage('');

        try {
            // Update status for Anthropic large model
            setCurrentModel("Getting response from Claude 3.5 Sonnet");
            const responseAnthropicLarge = await getAnthropicResponseLarge(inputMessage.trim(), [...messagesAnthropicLarge, userMessage]);
    
            // Update status for Anthropic mini model
            setCurrentModel("Getting response from Claude 3.5 Haiku");
            const responseAnthropicMini = await getAnthropicResponseMini(inputMessage.trim(), [...messagesAnthropicMini, userMessage]);
                

            const dataAnthropicLarge = await responseAnthropicLarge.json();
            const dataAnthropicMini = await responseAnthropicMini.json();

            const aiResponseAnthropicLarge = JSON.parse(dataAnthropicLarge.aiResponse)
            const aiResponseAnthropicMini = JSON.parse(dataAnthropicMini.aiResponse)

          
            console.log('aiResponseAnthropicMiniOrderStatus: ', aiResponseAnthropicMini.order_status)


            // Update messages states for Anthropic Large
            setMessagesAnthropicLarge([...messagesAnthropicLarge, userMessage, { 
                role: "assistant", 
                content: aiResponseAnthropicLarge.response, 
                promptTokens: dataAnthropicLarge.promptTokens, 
                completionTokens: dataAnthropicLarge.completionTokens, 
                totalTokens: dataAnthropicLarge.totalTokens, 
                cost: dataAnthropicLarge.cost,
                responseTime: dataAnthropicLarge.responseTime,
                order: aiResponseAnthropicLarge.order,
                orderStatus: aiResponseAnthropicLarge.order_status,
    
            }]);

            // Update messages states for Anthropic Mini
            setMessagesAnthropicMini([...messagesAnthropicMini, userMessage, { 
                role: "assistant", 
                content: aiResponseAnthropicMini.response, 
                promptTokens: dataAnthropicMini.promptTokens, 
                completionTokens: dataAnthropicMini.completionTokens, 
                totalTokens: dataAnthropicMini.totalTokens, 
                cost: dataAnthropicMini.cost,
                responseTime: aiResponseAnthropicMini.responseTime,
                order: aiResponseAnthropicMini.order,
                orderStatus: aiResponseAnthropicMini.order_status,
    
            }]);

            // Update display messages
            setDisplayMessages([...displayMessages, userMessage, 
                {
                    role: "assistant",
                    content: aiResponseAnthropicLarge.response,
                    promptTokens: dataAnthropicLarge.promptTokens,
                    completionTokens: dataAnthropicLarge.completionTokens,
                    totalTokens: dataAnthropicLarge.totalTokens,
                    cost: dataAnthropicLarge.cost,
                    responseTime: dataAnthropicLarge.responseTime,
                    modelName: "Claude 3.5 Sonnet",
                    order: aiResponseAnthropicLarge.order,
                    orderStatus: aiResponseAnthropicLarge.order_status,
                },
                {
                    role: "assistant",
                    content: aiResponseAnthropicMini.response,
                    promptTokens: dataAnthropicMini.promptTokens,
                    completionTokens: dataAnthropicMini.completionTokens,
                    totalTokens: dataAnthropicMini.totalTokens,
                    cost: dataAnthropicMini.cost,
                    responseTime: dataAnthropicMini.responseTime,
                    modelName: "Claude 3.5 Haiku",
                    order: aiResponseAnthropicMini.order,
                    orderStatus: aiResponseAnthropicMini.order_status
                }
            ]);



        } catch (error) {
            console.error("Error fetching Anthropic response:", error);
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
                        
                                                    <div className="flex gap-6">
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
                                                                <div className="flex-1">{message.content}</div>
                                                            </div>
                       
                                                            <div className="mt-1 flex flex-col gap-1">
                                                                <div className="flex justify-between items-center text-xs text-gray-500">
                                                                    <div className="flex gap-2 items-center">
                                                                        {message.cost !== null && 
                                                                            <span className="flex flex-row gap-1 text-xs text-gray-500">
                                                                                {message.cost && <><Banknote size={16} /> ${message.cost.toFixed(6)}</>}
                                                                            </span>
                                                                        }
                                                                        {message.orderStatus && 
                                                                            <span className="flex flex-row gap-1 text-xs text-gray-500 ml-2">
                                                                                <ShoppingCart size={16} /> {message.orderStatus}
                                                                            </span>
                                                                        }
                                                                    </div>
                                                                    <div>
                                                                        {(() => {
                                                                            const order = message.order;
                                                                            return order && Array.isArray(order) && order.length > 0 && (
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
                                                                                            {order.map((item, idx) => (
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
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    Total tokens: {message.totalTokens?.toLocaleString()} ({message.promptTokens?.toLocaleString()} prompt + {message.completionTokens?.toLocaleString()} completion)
                                                                </div>
                                                                {index + 1 < displayMessages.length && 
                                                                 displayMessages[index + 1].role === 'assistant' && 
                                                                 message.cost && 
                                                                 displayMessages[index + 1].cost && (
                                                                    <div className="text-xs text-gray-500">
                                                                        ({(message.cost / displayMessages[index + 1].cost).toFixed(1)}x more expensive than Haiku)
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {index + 1 < displayMessages.length && 
                                                         displayMessages[index + 1].role === 'assistant' && (
                                                            <div className="flex-1 p-3">
                                                                <div className="font-semibold mb-2 flex justify-between items-center">
                                                                    <span>Haiku</span>
                                                                    {displayMessages[index + 1].responseTime && (
                                                                        <span className="flex flex-row gap-1 text-xs text-gray-500">
                                                                            <Timer size={16} /> {displayMessages[index + 1].responseTime}ms
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="rounded-lg p-3 bg-gray-200 text-gray-800">
                                                                    <div className="flex-1">{displayMessages[index + 1].content}</div>
                                                                </div>
                                                                <div className="mt-1 flex flex-col gap-1">
                                                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                                                        <div className="flex gap-2 items-center">
                                                                            {displayMessages[index + 1].cost !== null && (
                                                                                <span className="flex flex-row gap-1 text-xs text-gray-500">
                                                                                    <Banknote size={16} /> ${displayMessages[index + 1].cost?.toFixed(6)}
                                                                                </span>
                                                                            )}
                                                                            {displayMessages[index + 1].orderStatus && (
                                                                                <span className="flex flex-row gap-1 text-xs text-gray-500 ml-2">
                                                                                    <ShoppingCart size={16} /> {displayMessages[index + 1].orderStatus}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            {(() => {
                                                                                const order = displayMessages[index + 1]?.order;
                                                                                return order && Array.isArray(order) && order.length > 0 && (
                                                                                    <Dialog>
                                                                                        <DialogTrigger asChild>
                                                                                            <Button variant="outline" size="sm">
                                                                                                <ShoppingCart size={16} />
                                                                                            </Button>
                                                                                        </DialogTrigger>
                                                                                        <DialogContent className="max-h-[80vh] flex flex-col gap-4">
                                                                                            <DialogHeader>
                                                                                                <DialogTitle>Order Details ({displayMessages[index + 1]?.modelName})</DialogTitle>
                                                                                                <DialogDescription>
                                                                                                    Items identified in your order
                                                                                                </DialogDescription>
                                                                                            </DialogHeader>
                                                                                            <div className="grid gap-4 overflow-y-auto max-h-[60vh] pr-2">
                                                                                                {order.map((item, idx) => (
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
                                                                                );
                                                                            })()}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        Total tokens: {displayMessages[index + 1].totalTokens?.toLocaleString()} ({displayMessages[index + 1].promptTokens?.toLocaleString()} prompt + {displayMessages[index + 1].completionTokens?.toLocaleString()} completion)
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
                                                                    {displayMessages[index + 2]?.orderStatus && (
                                                                        <span className="flex flex-row gap-1 text-xs text-gray-500 ml-2">
                                                                            <ShoppingCart size={16} /> {displayMessages[index + 2].orderStatus}
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
                                                                    {displayMessages[index + 3]?.orderStatus && (
                                                                        <span className="flex flex-row gap-1 text-xs text-gray-500 ml-2">
                                                                            <ShoppingCart size={16} /> {displayMessages[index + 3].orderStatus}
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
