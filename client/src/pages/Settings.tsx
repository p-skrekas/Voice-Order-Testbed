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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";




let BACKEND_URL: string;
if (process.env.NODE_ENV !== 'production') {
    BACKEND_URL = 'http://localhost:5000';
} else {
    BACKEND_URL = process.env.REACT_APP_API_ADDRESS || '';
}

const sonnetSchema = z.object({
    systemPromptSonnet: z.string().min(1, { message: "System prompt is required." })
});

const haikuSchema = z.object({
    systemPromptHaiku: z.string().min(1, { message: "System prompt is required." })
});

const vectorSearchSchema = z.object({
    numProducts: z.string()
});

export default function Settings() {

    const [settings, setSettings] = useState<TSettings | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const toast = useCustomToast();

    const sonnetForm = useForm<z.infer<typeof sonnetSchema>>({
        resolver: zodResolver(sonnetSchema),
        defaultValues: {
            systemPromptSonnet: ''
        }
    });

    const haikuForm = useForm<z.infer<typeof haikuSchema>>({
        resolver: zodResolver(haikuSchema),
        defaultValues: {
            systemPromptHaiku: ''
        }
    });

    const vectorSearchForm = useForm<z.infer<typeof vectorSearchSchema>>({
        resolver: zodResolver(vectorSearchSchema),
        defaultValues: {
            numProducts: settings?.numResultsForVectorSearch?.toString() || "20"
        }
    });

    useEffect(() => {
        if (settings) {

            sonnetForm.reset({
                systemPromptSonnet: settings.systemPromptSonnet || ''
            });
            haikuForm.reset({
                systemPromptHaiku: settings.systemPromptHaiku || ''
            });
        }
    }, [settings]);

    useEffect(() => {
        if (settings?.numResultsForVectorSearch) {
            vectorSearchForm.setValue('numProducts', settings.numResultsForVectorSearch.toString());
        }
    }, [settings]);


    async function onUpdateSystemPromptSonnet(values: z.infer<typeof sonnetSchema>) {
        try {
            setIsUpdating(true);
            const formattedValues = {
                systemPromptSonnet: values.systemPromptSonnet.replace(/\n/g, '\n')
            };

            const response = await fetch(`${BACKEND_URL}/api/settings/system-prompt-sonnet`, {
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


    async function onUpdateSystemPromptHaiku(values: z.infer<typeof haikuSchema>) {
        try {
            setIsUpdating(true);
            const formattedValues = {
                systemPromptHaiku: values.systemPromptHaiku.replace(/\n/g, '\n')
            };

            const response = await fetch(`${BACKEND_URL}/api/settings/system-prompt-haiku`, {
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

    async function onUpdateVectorSearch(values: z.infer<typeof vectorSearchSchema>) {
        try {
            setIsUpdating(true);
            const response = await fetch(`${BACKEND_URL}/api/settings/vector-search`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ numProducts: values.numProducts })
            });

            if (!response.ok) {
                throw new Error(`Failed to update vector search settings: ${response.statusText}`);
            }

            const data = await response.json();
            setSettings(data);
            toast.success('Vector search settings updated successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update vector search settings');
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



    const loadCurrentPromptSonnet = () => {
        if (settings?.systemPromptSonnet) {
            sonnetForm.setValue('systemPromptSonnet', settings.systemPromptSonnet);
        }
    };

    const loadCurrentPromptHaiku = () => {
        if (settings?.systemPromptHaiku) {
            haikuForm.setValue('systemPromptHaiku', settings.systemPromptHaiku);
        }
    };

    return (
        <div className="flex flex-col h-full w-full p-3">
            <Tabs defaultValue="system-prompt-sonnet">
                <TabsList>
                    <TabsTrigger value="system-prompt-sonnet">System prompt - Sonnet</TabsTrigger>
                    <TabsTrigger value="system-prompt-haiku">System prompt - Haiku</TabsTrigger>
                    <TabsTrigger value="vector-search">Vector search</TabsTrigger>
                </TabsList>

                <TabsContent value="system-prompt-sonnet">
                    <div className="flex flex-col gap-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>Chatbot System Prompt Settings - Sonnet</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-3">
                                <Form {...sonnetForm}>
                                    <div className="flex flex-col gap-3">
                                        <span className="text-sm font-bold">
                                            Current system prompt - Sonnet:
                                        </span>
                                        <span className="text-sm whitespace-pre-wrap max-h-[320px] bg-slate-100 overflow-y-auto border rounded p-2">
                                            {settings?.systemPromptSonnet}
                                        </span>
                                    </div>
                                    <form
                                        className="flex flex-col gap-3"
                                        onSubmit={sonnetForm.handleSubmit(onUpdateSystemPromptSonnet)}>
                                        <FormField
                                            control={sonnetForm.control}
                                            name="systemPromptSonnet"
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
                                            <Button type="button" variant="outline" onClick={loadCurrentPromptSonnet}>
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
                <TabsContent value="system-prompt-haiku">
                    <div className="flex flex-col gap-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>Chatbot System Prompt Settings - Haiku</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-3">

                                <Form {...haikuForm}>
                                    <div className="flex flex-col gap-3">
                                        <span className="text-sm font-bold">
                                            Current system prompt - Haiku:
                                        </span>
                                        <span className="text-sm whitespace-pre-wrap max-h-[320px] bg-slate-100 overflow-y-auto border rounded p-2">
                                            {settings?.systemPromptHaiku}
                                        </span>
                                    </div>
                                    <form
                                        className="flex flex-col gap-3"
                                        onSubmit={haikuForm.handleSubmit(onUpdateSystemPromptHaiku)}>
                                        <FormField
                                            control={haikuForm.control}
                                            name="systemPromptHaiku"
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
                                            <Button type="button" variant="outline" onClick={loadCurrentPromptHaiku}>
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
                <TabsContent value="vector-search"> 
                    <div className="flex flex-col gap-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>Vector search</CardTitle>
                                <CardDescription>Configure how many similar products to fetch when performing vector search</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...vectorSearchForm}>
                                    <form onSubmit={vectorSearchForm.handleSubmit(onUpdateVectorSearch)} className="flex flex-col gap-4">
                                        <FormField
                                            control={vectorSearchForm.control}
                                            name="numProducts"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Number of products</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="w-[180px]">
                                                                <SelectValue placeholder="Select number of products" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="10">10 products</SelectItem>
                                                            <SelectItem value="20">20 products</SelectItem>
                                                            <SelectItem value="30">30 products</SelectItem>
                                                            <SelectItem value="40">40 products</SelectItem>
                                                            <SelectItem value="50">50 products</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormDescription>
                                                        Select how many similar products should be returned when performing a vector search
                                                    </FormDescription>
                                                </FormItem>
                                            )}
                                        />
                                        <div className="flex justify-between gap-2">
                                            <Button type="submit" disabled={isUpdating}>
                                                {isUpdating ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Updating...
                                                    </>
                                                ) : (
                                                    "Update vector search settings"
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
