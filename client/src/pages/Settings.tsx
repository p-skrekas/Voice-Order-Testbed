import React, { useState, useEffect } from "react";
import { TSettings } from "../types/settings";
import { Card, CardContent, CardDescription, CardTitle, CardFooter, CardHeader } from "../components/ui/card";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "../components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { Button } from "../components/ui/button";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useCustomToast } from "../components/custom/CustomToaster";




let BACKEND_URL: string;
if (process.env.NODE_ENV !== 'production') {
    BACKEND_URL = 'http://localhost:5000';
} else {
    BACKEND_URL = process.env.REACT_APP_API_ADDRESS || '';
}

const systemPromptSchema = z.object({
    systemPrompt: z.string().min(1, { message: "System prompt is required." })
});

export default function Settings() {

    const [settings, setSettings] = useState<TSettings | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const toast = useCustomToast();

    const systemPromptForm = useForm<z.infer<typeof systemPromptSchema>>({
        resolver: zodResolver(systemPromptSchema),
        defaultValues: {
            systemPrompt: settings?.systemPrompt || ''
        }
    });

    async function onUpdateSystemPrompt(values: z.infer<typeof systemPromptSchema>) {
        try {
            setIsUpdating(true);
            const formattedValues = {
                systemPrompt: values.systemPrompt.replace(/\n/g, '\n')
            };

            const response = await fetch(`${BACKEND_URL}/api/settings/system-prompt`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formattedValues)
            });

            if (!response.ok) {
                throw new Error(`Failed to update system prompt: ${response.statusText}`);
            }

            const data = await response.json();
            setSettings(data);
            toast.success('System prompt updated successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update system prompt');
        } finally {
            setIsUpdating(false);
        }
    }

    useEffect(() => {
        const fetchSettings = async () => {
            const response = await fetch(`${BACKEND_URL}/api/settings`);
            const data = await response.json();
            setSettings(data);
        }
        fetchSettings();
    }, []);

    const loadCurrentPrompt = () => {
        if (settings?.systemPrompt) {
            systemPromptForm.setValue('systemPrompt', settings.systemPrompt);
        }
    };

    return (
        <div className="flex flex-col h-full w-full p-3">
            <Tabs defaultValue="system-prompt">
                <TabsList>
                    <TabsTrigger value="system-prompt">System prompt</TabsTrigger>
                </TabsList>
                <TabsContent value="system-prompt">
                    <div className="flex flex-col gap-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>Chatbot Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-3">

                                <Form {...systemPromptForm}>
                                    <div className="flex flex-col gap-3">
                                        <span className="text-sm font-bold">
                                            Current system prompt:
                                        </span>
                                        <span className="text-sm whitespace-pre-wrap max-h-[320px] overflow-y-auto border rounded p-2">
                                            {settings?.systemPrompt}
                                        </span>
                                    </div>
                                    <form
                                        className="flex flex-col gap-3"
                                        onSubmit={systemPromptForm.handleSubmit(onUpdateSystemPrompt)}>
                                        <FormField
                                            control={systemPromptForm.control}
                                            name="systemPrompt"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Update system prompt</FormLabel>
                                                    <FormControl>
                                                        <Textarea {...field} rows={20}/>
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <div className="flex justify-between gap-2">
                                            <Button type="button" variant="outline" onClick={loadCurrentPrompt}>
                                                Load current prompt
                                            </Button>
                                            <Button type="submit" disabled={isUpdating}>
                                                {isUpdating ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Updating...
                                                    </>
                                                ) : (
                                                    "Update system prompt"
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

        </div>
    )
}
