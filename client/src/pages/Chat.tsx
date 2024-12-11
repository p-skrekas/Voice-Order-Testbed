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
        quantity: number;
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
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [currentModel, setCurrentModel] = useState<string>("");
    const [totalCostSonnet, setTotalCostSonnet] = useState<number>(0);
    const [totalTokensSonnet, setTotalTokensSonnet] = useState<number>(0);

    const [currentCart, setCurrentCart] = useState<any[]>([{id: 3, quantity: 10}, {id: 17, quantity: 90}]);

    

    const getAnthropicResponseLarge = async (query: string, messages: Message[]) => {
        const responseAnthropic = await fetch(`${BACKEND_URL}/api/chat/getAnthropicResponse`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                llm: "claude-3-5-sonnet-20241022",
                query: query,
                messages: messages,
                currentCart: currentCart
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
                quantity: Number(getTagContent('quantity', product))
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
        setInputMessage('');

        try {
            setCurrentModel("Getting response from Claude 3.5 Sonnet");
            const responseAnthropicLarge = await getAnthropicResponseLarge(inputMessage.trim(), [...messagesAnthropicLarge, userMessage]);

            let sonnetResponse: Message | null = null;

            if (responseAnthropicLarge.ok) {
                const dataAnthropicLarge = await responseAnthropicLarge.json();
                const parsedResponse = parseAIResponse(dataAnthropicLarge.aiResponse);
                
                // Update the cart when new orders are received
                if (parsedResponse.order && parsedResponse.order.length > 0) {
                    // Create a new cart from the parsed response
                    const newCart = parsedResponse.order.map(item => ({
                        id: item.id,
                        quantity: item.quantity
                    }));
                    
                    setCurrentCart(newCart);
                }

                sonnetResponse = {
                    role: "assistant",
                    content: parsedResponse.response,
                    promptTokens: dataAnthropicLarge.promptTokens,
                    completionTokens: dataAnthropicLarge.completionTokens,
                    totalTokens: dataAnthropicLarge.totalTokens,
                    cost: dataAnthropicLarge.cost,
                    responseTime: dataAnthropicLarge.responseTime,
                    order: parsedResponse.order,
                    orderStatus: parsedResponse.order_status,
                    modelName: "Claude 3.5 Sonnet"
                };
            } else {
                const errorData = await responseAnthropicLarge.json();
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

            setMessagesAnthropicLarge([...messagesAnthropicLarge, userMessage, sonnetResponse]);

            if (sonnetResponse && !sonnetResponse.error) {
                setTotalCostSonnet(prev => prev + sonnetResponse!.cost);
                setTotalTokensSonnet(prev => prev + sonnetResponse!.totalTokens);
            }

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
            {/* Add Cart Summary */}
            {currentCart.length > 0 && (
                <div className="bg-white border-b p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Current Cart ({currentCart.length} items)</h3>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                    View Cart
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Shopping Cart</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4">
                                    {currentCart.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center p-2 border rounded">
                                            <div className="text-sm text-gray-500">ID: {item.id}</div>
                                            <div className="text-sm">
                                                Qty: {item.quantity}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <DialogFooter>
                                    <Button 
                                        variant="destructive" 
                                        onClick={() => setCurrentCart([])}
                                    >
                                        Clear Cart
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            )}

            <div className="flex h-full flex-row gap-1 overflow-y-auto p-4 ">    
                {/* Chat messages container */}
                <div className="flex h-full bg-gray-50 justify-between w-full flex-col rounded-lg border">
                    {/* Messages container - add padding except bottom */}
                    <div className="flex flex-col gap-4 overflow-y-auto p-3 pb-0">
                        {messagesAnthropicLarge.map((message, index) => {
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

                                                                                        <div className="flex justify-between text-sm text-gray-500">
                                                                                            <span>ID: {item.id}</span>
                                                                                            <span>Qty: {item.quantity}</span>
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
                                disabled={isTyping || !inputMessage.trim()}
                                className={`px-4 py-2 rounded-lg text-white ${
                                    isTyping || !inputMessage.trim()
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
