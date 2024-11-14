import { useState } from "react";
import { Mic, Barcode, ShoppingCart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "../components/ui/dialog";
import { Button } from "../components/ui/button";


interface Message {
    role: string;
    content: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
    products?: any[];
    order?: {
        productId: string;
        productName: string;
        quantity: number;
    }[];
}

let BACKEND_URL: string;
if (process.env.NODE_ENV !== 'production') {
    BACKEND_URL = 'http://localhost:5000';
} else {
    BACKEND_URL = process.env.REACT_APP_API_ADDRESS || '';
}

//gpt-4o-mini-2024-07-18
//gpt-4o-2024-08-06
export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [llm, setLlm] = useState("gpt-4o-mini-2024-07-18");
    const [isListening, setIsListening] = useState(false);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        const newMessages = [...messages, { 
            role: "user", 
            content: inputMessage.trim(), 
            promptTokens: 0, 
            completionTokens: 0, 
            totalTokens: 0, 
            cost: 0 
        }];
        
        setMessages(newMessages);
        setInputMessage('');

        try {
            const response = await fetch(`${BACKEND_URL}/api/chat/getOpenAIResponse`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    llm: llm,
                    query: inputMessage.trim(),
                    messages: newMessages
                }),
            });

            const data = await response.json();
            console.log(data);
            
            const aiResponseMatch = data.aiResponse.match(/<AiResponse>([^]*?)<\/AiResponse>/);
            const parsedResponse = aiResponseMatch ? aiResponseMatch[1] : data.aiResponse;
            
            let order = [];
            const orderMatch = data.aiResponse.match(/<Order>([^]*?)<\/Order>/);
            if (orderMatch) {
                const productMatches = orderMatch[1].matchAll(/<product>[^]*?<productId>\s*([^]*?)\s*<\/productId>[^]*?<productName>\s*([^]*?)\s*<\/productName>[^]*?<quantity>\s*([^]*?)\s*<\/quantity>[^]*?<\/product>/g);
                for (const match of productMatches) {
                    const productName = match[2].trim();
                    const products = typeof data.products === 'string' ? JSON.parse(data.products) : data.products;
                    const product = products.find((p:any) => p.name === productName);
                    
                    order.push({
                        productId: product?.id.toString() || '',
                        productName: match[2].trim(),
                        quantity: parseInt(match[3].trim())
                    });
                }
            }

            console.log('Order:', order);
            
            let products = [];
            if (data.products) {
                try {
                    products = typeof data.products === 'string' ? JSON.parse(data.products) : data.products;
                } catch (e) {
                    console.error("Error parsing products:", e);
                    products = [];
                }
            }

            console.log(products);
            
            setMessages([...newMessages, { 
                role: "assistant", 
                content: parsedResponse, 
                promptTokens: 0, 
                completionTokens: 0, 
                totalTokens: 0, 
                cost: data.cost,
                products: products,
                order: order
            }]);

        } catch (error) {
            console.error("Error fetching OpenAI response:", error);
        }
    };

    const handleVoiceCommand = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Speech recognition is not supported in this browser.');
            return;
        }

        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInputMessage(transcript);
        };

        recognition.start();
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
                                <div className={`flex flex-col text-sm w-full ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    {message.role === 'user' ? 'User' : `${llm}`}
                                    <div
                                        className={`flex w-[70%] rounded-lg p-3 ${message.role === 'user'
                                            ? 'bg-gray-600 text-white'
                                            : 'bg-gray-200 text-gray-800'
                                            }`}
                                    >
                                        <div className="flex-1">{message.content}</div>
                                    </div>
                                    {message.role === 'assistant' && (
                                        <div className="flex justify-between items-center w-[70%] mt-1 text-xs text-gray-500">
                                            <span>
                                                {message.cost !== null && message.cost !== undefined && 
                                                    `Cost: $${message.cost.toFixed(6)}`
                                                }
                                            </span>
                                            <div className="flex gap-2">
                                                {message.products && message.products.length > 0 && (
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="outline" size="sm">
                                                                <Barcode size={20} />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-h-[80vh] flex flex-col gap-4">
                                                            <DialogHeader>
                                                                <DialogTitle>Fetched Products (MongoDB)</DialogTitle>
                                                                <DialogDescription>
                                                                    List of products found in the database matching your query.
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="grid gap-4 overflow-y-auto max-h-[60vh] pr-2">
                                                                {message.products.map((product, idx) => (
                                                                    <div key={idx} className="p-2 border rounded">
                                                                        <div className="font-medium">{product.name}</div>
                                                                        <div className="text-sm text-gray-500">
                                                                            Unit: {product.unit2_desc} ({product.units_per_package} {product.main_unit_desc})
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
                                                {message.order && message.order.length > 0 && (
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="outline" size="sm">
                                                                <ShoppingCart size={20} />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-h-[80vh] flex flex-col gap-4">
                                                            <DialogHeader>
                                                                <DialogTitle>Order Details</DialogTitle>
                                                                <DialogDescription>
                                                                    Products selected for your current order.
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="grid gap-4 overflow-y-auto max-h-[60vh] pr-2">
                                                                {message.order.map((item, idx) => (
                                                                    <div key={idx} className="p-2 border rounded">
                                                                        <div className="font-medium">{item.productName}</div>
                                                                        <div className="text-sm text-gray-500">
                                                                            Product ID: {item.productId}
                                                                            <br />
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
                                    )}
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
                                type="button"
                                onClick={handleVoiceCommand}
                                className={`px-4 py-2 rounded-lg border ${
                                    isListening 
                                        ? 'bg-red-500 hover:bg-red-600' 
                                        : ' hover:text-red-500'
                                }`}
                            >
                                {isListening ? 'Listening...' : <Mic size={20} />}
                            </button>
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
