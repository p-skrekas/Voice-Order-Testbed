import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/card";
import { useNavigate } from "react-router-dom";
import { MicVocal, BotMessageSquare, Wrench, Videotape  } from 'lucide-react';

export default function Index() {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center justify-start md:flex-row md:items-start md:justify-start md:flex-wrap w-full p-3 gap-3">

            <Card className="flex flex-col w-[300px] h-[300px] justify-between">
                <CardHeader className="flex flex-col items-center">
                    <CardTitle>
                        <div className="flex flex-col items-center gap-6 mb-3">
                            <MicVocal size={32} />
                            Synthetic Voice Orders
                        </div>
                    </CardTitle>
                    <CardDescription>
                        <span>
                            Create and manage synthetic voice orders.
                        </span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="items-center">
                    <Button className="w-full" onClick={() => {
                        navigate('/synthetic-voice-orders');
                    }}>
                        Generate synthetic voice orders
                    </Button>
                </CardContent>
            </Card>

            
            <Card className="flex flex-col w-[300px] h-[300px] justify-between">
                <CardHeader className="flex flex-col items-center">
                    <CardTitle>
                        <div className="flex flex-col items-center gap-6 mb-3">
                            <Videotape size={32} />
                            View recorded voices
                        </div>
                    </CardTitle>
                    <CardDescription>
                        <span>
                            View and manage recorded voices.
                        </span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="items-center">
                    <Button className="w-full" onClick={() => {
                        navigate('/recorded-voices');
                    }}>
                        View recorded voices
                    </Button>
                </CardContent>
            </Card>
            
            <Card className="flex flex-col w-[300px] h-[300px] justify-between">
                <CardHeader className="flex flex-col items-center">
                    <CardTitle>
                        <div className="flex flex-col items-center gap-6 mb-3">
                            <BotMessageSquare  size={32} />
                            Chat with AI
                        </div>
                    </CardTitle>
                    <CardDescription>
                        <span>
                            Test Sonent and Haiku models to test their capabilities.
                        </span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="items-center">
                    <Button className="w-full" onClick={() => {
                        navigate('/chat');
                    }}>
                        Chat with AI
                    </Button>
                </CardContent>
            </Card>

            <Card className="flex flex-col w-[300px] h-[300px] justify-between">
                <CardHeader className="flex flex-col items-center">
                    <CardTitle>
                        <div className="flex flex-col items-center gap-6 mb-3">
                            <Wrench  size={32} />
                            Prompt Optimizer
                        </div>
                    </CardTitle>
                    <CardDescription>
                        <span>
                            Modify the prompts for Sonnet and Haiku model and optimize the size of vector search.
                        </span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="items-center">
                    <Button className="w-full" onClick={() => {
                        navigate('/settings');
                    }}>
                        Modify prompts
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}