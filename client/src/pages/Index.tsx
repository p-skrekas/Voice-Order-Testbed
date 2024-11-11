import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/card";
import { useNavigate } from "react-router-dom";
import { MicVocal } from 'lucide-react';

export default function Index() {
    const navigate = useNavigate();
    return (
        <div className="flex w-full h-full p-3">

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
        </div>
    )
}