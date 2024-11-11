import { useState } from "react";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from "../components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { AudioRecorder } from "react-audio-voice-recorder";


let BACKEND_URL = "http://localhost:5000";

export default function TestCatalog() {
    const [isCreatingFakeOrder, setIsCreatingFakeOrder] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [currentProducts, setCurrentProducts] = useState([]);
    const [isSavingAudio, setIsSavingAudio] = useState(false);

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
            console.log('Audio duration:', duration); // Debug log

            const formData = new FormData();
            formData.append('audio', blob, 'recording.webm');
            formData.append('title', `Recording ${new Date().toISOString()}`);
            formData.append('duration', duration.toString());

            const response = await fetch(`${BACKEND_URL}/api/audio`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to save audio');
            }

            const result = await response.json();
            console.log('Save result:', result); // Debug log

        } catch (error) {
            console.error('Error saving audio:', error);
        } finally {
            setIsSavingAudio(false);
        }
    };

    return (
        <div className="flex flex-col gap-3 items-center h-screen p-3 max-w-[600px] mx-auto">
            <div className="flex w-full flex-col items-start justify-start gap-3">
                <span className="text-2xl font-bold">Generate synthetic orders</span>

                <span>Instructions</span>
                <ul className="flex flex-col gap-1 text-[0.85rem]">
                    <li>- Click on the button to generate a fake order.</li>
                    <li>- The order will be displayed in the textarea below with a random number of products from 1 to 10.</li>
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