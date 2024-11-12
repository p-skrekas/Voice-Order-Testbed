import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Trash2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "../components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";
import { Play, Pause, Download, Loader2 } from "lucide-react";
import { useCustomToast } from "../components/custom/CustomToaster";

let BACKEND_URL: string;
if (process.env.NODE_ENV !== 'production') {
	BACKEND_URL = 'http://localhost:5000';
} else {
	BACKEND_URL = process.env.REACT_APP_API_ADDRESS || '';
}

console.log(BACKEND_URL);


type AudioRecording = {
    _id: string;
    title: string;
    filename: string;
    mimeType: string;
    createdAt: string;
    duration: number;
    userEmail: string;
    orderText: string;
}

type SortDirection = 'asc' | 'desc' | null;

export default function RecordedVoices() {
    const [audioRecordings, setAudioRecordings] = useState<AudioRecording[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [playbackErrors, setPlaybackErrors] = useState<Record<string, string>>({});
    const [recordingToDelete, setRecordingToDelete] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({});
    const itemsPerPage = 10;
    const [totalDuration, setTotalDuration] = useState(0);
    const [sortConfig, setSortConfig] = useState<{
        key: 'userEmail' | 'duration' | 'createdAt' | 'orderText';
        direction: SortDirection;
    }>({
        key: 'createdAt',
        direction: 'desc'
    });
    const toast = useCustomToast();
    const [isDownloadingAll, setIsDownloadingAll] = useState(false);

    // Format duration helper function
    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        return `${minutes}m ${remainingSeconds}s`;
    };

    // Calculate total duration when recordings are fetched
    useEffect(() => {
        const total = audioRecordings.reduce((acc, recording) => 
            acc + (recording.duration || 0), 0
        );
        setTotalDuration(total);
    }, [audioRecordings]);

    useEffect(() => {
        fetchAudioRecordings();
    }, []);

    async function fetchAudioRecordings() {
        try {
            setIsLoading(true);
            const response = await fetch(`${BACKEND_URL}/api/audio`);
            if (!response.ok) {
                throw new Error('Failed to fetch recordings');
            }
            const data = await response.json();
            setAudioRecordings(data.recordings);
        } catch (error) {
            console.error("Error fetching audio recordings:", error);
            setError('Failed to load recordings');
        } finally {
            setIsLoading(false);
        }
    }

    const handlePlaybackError = (recordingId: string, error: any) => {
        console.error(`Playback error for recording ${recordingId}:`, error);
        setPlaybackErrors(prev => ({
            ...prev,
            [recordingId]: 'Failed to play audio'
        }));
    };

    const handleDeleteClick = (recordingId: string) => {
        setRecordingToDelete(recordingId);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!recordingToDelete) return;

        try {
            const response = await fetch(`${BACKEND_URL}/api/audio/${recordingToDelete}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete recording');
            }

            setAudioRecordings(prev => 
                prev.filter(recording => recording._id !== recordingToDelete)
            );
            
            setIsDeleteDialogOpen(false);
            setRecordingToDelete(null);
            toast.success('Recording deleted successfully');
        } catch (error) {
            console.error("Error deleting recording:", error);
            toast.error('Failed to delete recording');
        }
    };

    const handlePlayPause = (recordingId: string) => {
        const audioElement = document.getElementById(`audio-${recordingId}`) as HTMLAudioElement;
        if (audioElement) {
            if (isPlaying[recordingId]) {
                audioElement.pause();
            } else {
                audioElement.play();
            }
            setIsPlaying(prev => ({
                ...prev,
                [recordingId]: !prev[recordingId]
            }));
        }
    };

    // Calculate pagination
    const totalPages = Math.ceil(audioRecordings.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    // Add sorting function
    const sortData = (data: AudioRecording[]) => {
        if (!sortConfig.direction) {
            return data;
        }

        return [...data].sort((a, b) => {
            if (sortConfig.key === 'userEmail') {
                return sortConfig.direction === 'asc' 
                    ? a.userEmail.localeCompare(b.userEmail)
                    : b.userEmail.localeCompare(a.userEmail);
            }
            if (sortConfig.key === 'duration') {
                return sortConfig.direction === 'asc'
                    ? a.duration - b.duration
                    : b.duration - a.duration;
            }
            if (sortConfig.key === 'orderText') {
                return sortConfig.direction === 'asc'
                    ? a.orderText.localeCompare(b.orderText)
                    : b.orderText.localeCompare(a.orderText);
            }
            // Default sort by createdAt
            return sortConfig.direction === 'asc'
                ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    };

    const handleSort = (key: typeof sortConfig.key) => {
        setSortConfig(current => ({
            key,
            direction: 
                current.key === key 
                    ? current.direction === 'asc' 
                        ? 'desc' 
                        : current.direction === 'desc' 
                            ? null 
                            : 'asc'
                    : 'asc'
        }));
    };

    // Get sorted and paginated data
    const sortedData = sortData(audioRecordings);
    const currentRecordings = sortedData.slice(startIndex, endIndex);

    const handleDownload = async (recordingId: string, filename: string) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/audio/${recordingId}`);
            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Error downloading recording:", error);
            toast.error('Failed to download recording');
        }
    };

    const handleDownloadAll = async () => {
        setIsDownloadingAll(true);
        try {
            // Create a delay between downloads to prevent overwhelming the browser
            for (const recording of audioRecordings) {
                await handleDownload(recording._id, recording.filename);
                // Add a small delay between downloads
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            toast.success('All recordings downloaded successfully');
        } catch (error) {
            console.error("Error downloading all recordings:", error);
            toast.error('Failed to download all recordings');
        } finally {
            setIsDownloadingAll(false);
        }
    };

    if (isLoading) {
        return <div className="p-8">Loading recordings...</div>;
    }

    if (error) {
        return <div className="p-8 text-red-500">{error}</div>;
    }

    return (
        <div className="flex w-full flex-col gap-3 p-8">
            <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col items-center gap-4">
                    <h1 className="text-2xl font-bold">Recorded Voices</h1>
                    <Button 
                        variant="outline"
                        onClick={handleDownloadAll}
                        disabled={isDownloadingAll || audioRecordings.length === 0}
                    >
                        {isDownloadingAll ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Downloading...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4 mr-2" />
                                Download All ({audioRecordings.length})
                            </>
                        )}
                    </Button>
                </div>
                <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-md">
                    Total Duration: {formatDuration(totalDuration)}
                </div>
            </div>
            
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead 
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => handleSort('userEmail')}
                            >
                                <div className="flex items-center gap-2">
                                    User
                                    {sortConfig.key === 'userEmail' && (
                                        <span className="text-xs">
                                            {sortConfig.direction === 'asc' ? '↑' : sortConfig.direction === 'desc' ? '↓' : ''}
                                        </span>
                                    )}
                                </div>
                            </TableHead>
                            <TableHead 
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => handleSort('duration')}
                            >
                                <div className="flex items-center gap-2">
                                    Transcription
                                    {sortConfig.key === 'orderText' && (
                                        <span className="text-xs">
                                            {sortConfig.direction === 'asc' ? '↑' : sortConfig.direction === 'desc' ? '↓' : ''}
                                        </span>
                                    )}
                                </div>
                            </TableHead>
                            <TableHead 
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => handleSort('createdAt')}
                            >
                                <div className="flex items-center gap-2">
                                    Duration
                                    {sortConfig.key === 'duration' && (
                                        <span className="text-xs">
                                            {sortConfig.direction === 'asc' ? '↑' : sortConfig.direction === 'desc' ? '↓' : ''}
                                        </span>
                                    )}
                                </div>
                            </TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentRecordings.map((recording) => (
                            <TableRow key={recording._id}>
                                <TableCell>{recording.userEmail}</TableCell>
                                <TableCell className="whitespace-normal break-words max-w-[300px]">
                                    {recording.orderText}
                                </TableCell>
                                <TableCell>{recording.duration} seconds</TableCell>
                                <TableCell>
                                    {new Date(recording.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handlePlayPause(recording._id)}
                                        >
                                            {isPlaying[recording._id] ? (
                                                <Pause className="h-4 w-4" />
                                            ) : (
                                                <Play className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDownload(recording._id, recording.filename)}
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDeleteClick(recording._id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <audio
                                            id={`audio-${recording._id}`}
                                            className="hidden"
                                            onError={(e) => handlePlaybackError(recording._id, e)}
                                            src={`${BACKEND_URL}/api/audio/${recording._id}`}
                                            onEnded={() => setIsPlaying(prev => ({
                                                ...prev,
                                                [recording._id]: false
                                            }))}
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    Previous
                </Button>
                <span className="flex items-center px-4">
                    Page {currentPage} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    Next
                </Button>
            </div>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this recording? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-start">
                        <div className="flex gap-3 justify-end w-full">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setIsDeleteDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleConfirmDelete}
                            >
                                Delete
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
