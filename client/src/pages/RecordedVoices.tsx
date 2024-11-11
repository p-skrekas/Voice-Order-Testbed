import { useState, useEffect } from "react";
import AudioPlayer from 'react-modern-audio-player';
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

const BACKEND_URL = "http://localhost:5000";

type AudioRecording = {
    _id: string;
    title: string;
    filename: string;
    mimeType: string;
    createdAt: string;
    duration: number;
}

interface AudioData {
    id: number;
    name: string;
    src: string;
    writer?: string;
    duration: number;
}

export default function RecordedVoices() {
    const [audioRecordings, setAudioRecordings] = useState<AudioRecording[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [playbackErrors, setPlaybackErrors] = useState<Record<string, string>>({});
    const [recordingToDelete, setRecordingToDelete] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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

    const playList: AudioData[] = audioRecordings.map((recording, index) => {
        return {
            id: index + 1,
            name: recording.title,
            src: `${BACKEND_URL}/api/audio/${recording._id}`,
            writer: new Date(recording.createdAt).toLocaleDateString(),
            duration: typeof recording.duration === 'number' && isFinite(recording.duration) 
                ? recording.duration 
                : 0
        };
    });

    console.log('Playlist:', playList);

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

            // Remove the deleted recording from the state
            setAudioRecordings(prev => 
                prev.filter(recording => recording._id !== recordingToDelete)
            );
            
            // Close the dialog
            setIsDeleteDialogOpen(false);
            setRecordingToDelete(null);
        } catch (error) {
            console.error("Error deleting recording:", error);
            setPlaybackErrors(prev => ({
                ...prev,
                [recordingToDelete]: 'Failed to delete recording'
            }));
        }
    };

    if (isLoading) {
        return <div className="p-8">Loading recordings...</div>;
    }

    if (error) {
        return <div className="p-8 text-red-500">{error}</div>;
    }

    return (
        <div className="flex w-full flex-col gap-3 items-center p-8">
            <h1 className="text-2xl font-bold mb-6">Recorded Voices</h1>
            <div className="space-y-4">
                {audioRecordings.length === 0 ? (
                    <p className="text-gray-500">No recordings found</p>
                ) : (
                    audioRecordings.map((recording, index) => (
                        <Card key={recording._id} className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-sm text-gray-500">
                                    Duration: {recording.duration} seconds
                                </div>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteClick(recording._id)}
                                    className="ml-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            {playbackErrors[recording._id] && (
                                <div className="text-red-500 text-sm mb-2">
                                    {playbackErrors[recording._id]}
                                </div>
                            )}
                            <AudioPlayer
                                playList={[playList[index]]}
                                audioInitialState={{
                                    muted: false,
                                    volume: 1,
                                    curPlayId: index + 1,
                                }}
                                activeUI={{
                                    all: false,
                                    playButton: true,
                                    playList: false,
                                    prevNnext: false,
                                    volume: true,
                                    volumeSlider: true,
                                    repeatType: false,
                                    trackTime: true,
                                    trackInfo: true,
                                    artwork: false,
                                    progress: "waveform"
                                }}
                            />
                        </Card>
                    ))
                )}
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
