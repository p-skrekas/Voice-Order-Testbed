import { useState, useEffect } from "react";

import { Button } from "../components/ui/button";

import { Loader2 } from "lucide-react";
import { useCustomToast } from "../components/custom/CustomToaster";

import { AudioRecorder } from "react-audio-voice-recorder";


let BACKEND_URL: string;
if (process.env.NODE_ENV !== 'production') {
	BACKEND_URL = 'http://localhost:5000';
} else {
	BACKEND_URL = process.env.REACT_APP_API_ADDRESS || '';
}

console.log(BACKEND_URL);


export default function TestCatalog() {
    const [isCreatingFakeOrder, setIsCreatingFakeOrder] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [currentProducts, setCurrentProducts] = useState([]);
    const [isSavingAudio, setIsSavingAudio] = useState(false);
    const [totalDuration, setTotalDuration] = useState(0);
    const toast = useCustomToast();

    useEffect(() => {
        fetchTotalDuration();
    }, []);

    const fetchTotalDuration = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/audio`);
            if (!response.ok) {
                throw new Error('Failed to fetch recordings');
            }
            const data = await response.json();
            const total = data.recordings.reduce((acc: number, recording: { duration: number }) => 
                acc + (recording.duration || 0), 0
            );
            setTotalDuration(total);
        } catch (error) {
            console.error("Error fetching total duration:", error);
        }
    };

    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        return `${minutes}m ${remainingSeconds}s`;
    };

    async function generateFakeOrder() {
        setCurrentOrder(null);
        setIsCreatingFakeOrder(true);
        const response = await fetch(`${BACKEND_URL}/api/products/generate-order`, {
            method: "POST",
            body: JSON.stringify({ productList: ["Malboro", "ASOS 30s"], numberOfItems: 10 }),
        });

        const data = await response.json();
        setCurrentOrder(data.order);
        setCurrentProducts(data.products);
        setIsCreatingFakeOrder(false);
    }

    const handleRecordingComplete = async (blob: Blob) => {
        try {
            setIsSavingAudio(true);

            // Get user email from localStorage
            const userEmail = localStorage.getItem('userEmail');
            if (!userEmail) {
                toast.error('User email not found');
                throw new Error('User email not found');
            }

            // Get duration from the blob
            const getDuration = () => new Promise<number>((resolve) => {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const reader = new FileReader();

                reader.onload = async (e) => {
                    const arrayBuffer = e.target?.result as ArrayBuffer;
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    resolve(audioBuffer.duration);
                    audioContext.close();
                };

                reader.readAsArrayBuffer(blob);
            });

            const duration = await getDuration();
            console.log('Audio duration:', duration);

            const formData = new FormData();
            formData.append('audio', blob, 'recording.webm');
            formData.append('title', `Recording ${new Date().toISOString()}`);
            formData.append('duration', duration.toString());
            formData.append('userEmail', userEmail);
            formData.append('orderText', currentOrder || 'No order text provided');

            const response = await fetch(`${BACKEND_URL}/api/audio`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                toast.error('Failed to save recording');
                throw new Error('Failed to save audio');
            }

            const result = await response.json();
            console.log('Save result:', result);

            // After successful save, update total duration
            await fetchTotalDuration();
            
            // Show success toast
            toast.success('Recording saved successfully');

        } catch (error) {
            console.error('Error saving audio:', error);
        } finally {
            setIsSavingAudio(false);
        }
    };

    return (
        <div className="flex flex-col gap-3 items-center h-screen p-3 max-w-[600px] mx-auto">
            <div className="flex w-full flex-col items-start justify-start gap-3">
                <div className="flex w-full justify-between items-center">
                    <span className="text-2xl font-bold">Generate synthetic orders</span>
                    <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-md">
                        Total Duration: {formatDuration(totalDuration)}
                    </div>
                </div>

                <span>Instructions</span>
                <ul className="flex flex-col gap-1 text-[0.85rem]">
                    <li>- Click on the button to generate a fake order.</li>
                    <li>- The order will be displayed in the textarea below with a random number of products from 1 to 5.</li>
                    <li>- The products used in the order will be displayed in the list below.</li>
                    <li>- Click on tthe record button to record the order with your voice.</li>
                </ul>
            </div>
            <div className="flex  w-full flex-col gap-4">
                <div className="flex flex-col gap-4">
                    {currentOrder && (
                        <div className="flex flex-col gap-2">
                            <span className="flex w-full justify-start text-md font-bold">Generated order</span>
                            <div className="flex w-full justify-start text-[0.85rem] bg-gray-100 p-3 rounded-md">
                                {currentOrder}
                            </div>
                        </div>
                    )}
                    <div className="flex flex-row items-center justify-between">

                        <Button
                            variant="outline"
                            onClick={generateFakeOrder}
                            disabled={isCreatingFakeOrder}
                        >
                            {isCreatingFakeOrder ?
                                <>
                                    <Loader2 className="animate-spin" />
                                    <span>Generating, please wait</span>
                                </>
                                : "Generate Fake Order"}
                        </Button>
                        {currentOrder && (
                            <>
                                <AudioRecorder
                                    onRecordingComplete={handleRecordingComplete}
                                    audioTrackConstraints={{
                                        noiseSuppression: true,
                                        echoCancellation: true,
                                    }}
                                    downloadOnSavePress={false}
                                    downloadFileExtension="webm"
                                />
                                {isSavingAudio && (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="animate-spin" />
                                        <span>Saving recording...</span>
                                    </div>
                                )}
                            </>

                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        {currentProducts.length > 0 && (
                            <>
                                <span>Products used in the order ({currentProducts.length}):</span>
                                <ul className="flex flex-col text-[0.8rem] list-none pl-6">
                                    {currentProducts.map((product, index) => (
                                        <li key={index}>{index + 1}. {product}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                </div>
            </div>

        </div>
    )
}