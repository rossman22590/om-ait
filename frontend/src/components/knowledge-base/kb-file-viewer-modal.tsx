'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Download, X, Loader2, FileText, Image as ImageIcon, FileVideo, FileAudio, File as FileIcon } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface KBFileViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: {
        entry_id: string;
        filename: string;
        file_size: number;
    };
}

export function KBFileViewerModal({ isOpen, onClose, file }: KBFileViewerModalProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [fileType, setFileType] = useState<'image' | 'pdf' | 'video' | 'audio' | 'text' | 'other'>('other');
    const [isDownloading, setIsDownloading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Loading file...');

    const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    const fileDownloadUrl = `${API_URL}/knowledge-base/entries/${file.entry_id}/download`;

    const loadingMessages = [
        '🔍 Locating your file...',
        '🚀 Downloading...',
        '🎨 Reconstructing pixels...',
        '✨ Materializing content...',
        '🤖 Grabbing from the cloud...',
        '📦 Unpacking bytes...',
        '🔮 Conjuring your document...',
        '⚡ Energizing data stream...',
        '🎯 Teleporting file...',
        '🌟 Almost there...',
        '🧙 Casting file spell...',
        '🎪 Performing digital magic...',
        '🔧 Assembling bits...',
        '🎵 Harmonizing data...',
        '🌈 Painting your file...',
        '🎁 Unwrapping content...',
        '🚁 Airlifting bytes...',
        '🎬 Loading scene...',
        '🍕 Cooking up your file...',
        '🎸 Tuning frequencies...',
    ];

    useEffect(() => {
        console.log('Viewer modal useEffect triggered - isOpen:', isOpen, 'entry_id:', file.entry_id);
        
        if (isOpen) {
            loadFile();
            // Cycle through fun loading messages
            let messageIndex = 0;
            const messageInterval = setInterval(() => {
                messageIndex = (messageIndex + 1) % loadingMessages.length;
                setLoadingMessage(loadingMessages[messageIndex]);
            }, 800);

            return () => {
                clearInterval(messageInterval);
            };
        }
        
        return () => {
            // Cleanup on unmount or when modal closes
            console.log('Cleanup: revoking blob URL');
            if (fileUrl) {
                URL.revokeObjectURL(fileUrl);
            }
        };
    }, [isOpen, file.entry_id]);

    // Reset state when modal closes
    useEffect(() => {
        console.log('Reset effect - isOpen:', isOpen);
        if (!isOpen) {
            setFileUrl(null);
            setIsLoading(true);
            setLoadingMessage(loadingMessages[0]);
        }
    }, [isOpen]);

    const getFileType = (filename: string): typeof fileType => {
        const ext = filename.toLowerCase().split('.').pop();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '')) return 'image';
        if (ext === 'pdf') return 'pdf';
        if (['mp4', 'webm', 'ogg', 'mov'].includes(ext || '')) return 'video';
        if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext || '')) return 'audio';
        if (['txt', 'md', 'json', 'xml', 'csv'].includes(ext || '')) return 'text';
        return 'other';
    };

    const loadFile = async () => {
        setIsLoading(true);
        console.log('Loading file:', file.filename, 'entry_id:', file.entry_id);
        
        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            
            console.log('Session:', session ? 'Found' : 'Not found');
            
            if (!session?.access_token) {
                toast.error('Authentication required');
                setIsLoading(false);
                return;
            }

            console.log('Fetching from:', fileDownloadUrl);
            
            const response = await fetch(fileDownloadUrl, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });

            console.log('Response status:', response.status, response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error:', errorText);
                throw new Error('Failed to load file');
            }

            const blob = await response.blob();
            console.log('Blob received:', blob.size, 'bytes, type:', blob.type);
            
            const url = URL.createObjectURL(blob);
            console.log('Created blob URL:', url);
            
            setFileUrl(url);
            setFileType(getFileType(file.filename));
            console.log('File type detected:', getFileType(file.filename));
        } catch (error) {
            console.error('Load error:', error);
            toast.error('Failed to load file');
            onClose();
        } finally {
            setIsLoading(false);
            console.log('Loading complete');
        }
    };

    const handleDownload = async () => {
        if (!fileUrl) return;
        
        setIsDownloading(true);
        try {
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = file.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast.success('Download started');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download file');
        } finally {
            setIsDownloading(false);
        }
    };

    const getFileIcon = () => {
        switch (fileType) {
            case 'image': return <ImageIcon className="h-5 w-5" />;
            case 'pdf': return <FileText className="h-5 w-5" />;
            case 'video': return <FileVideo className="h-5 w-5" />;
            case 'audio': return <FileAudio className="h-5 w-5" />;
            default: return <FileIcon className="h-5 w-5" />;
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] h-[90vh] p-0 gap-0 flex flex-col">
                {/* Header */}
                <DialogHeader className="p-6 pb-4 border-b">
                    <VisuallyHidden>
                        <DialogTitle>File Viewer - {file.filename}</DialogTitle>
                    </VisuallyHidden>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500 shrink-0">
                                {getFileIcon()}
                            </div>
                            <div className="overflow-hidden" style={{ maxWidth: '500px' }}>
                                <h2 className="text-lg font-semibold whitespace-nowrap overflow-hidden text-ellipsis" title={file.filename}>
                                    {file.filename}
                                </h2>
                                <p className="text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                                    {formatFileSize(file.file_size)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownload}
                                disabled={isLoading || isDownloading}
                                className="gap-2 w-32 flex items-center justify-center"
                            >
                                {isDownloading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="inline-block w-20 text-center">Downloading</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4" />
                                        <span className="inline-block w-20 text-center">Download</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 bg-muted/20">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                                <p className="text-sm text-muted-foreground animate-pulse w-80 text-center">
                                    {loadingMessage}
                                </p>
                            </div>
                        </div>
                    ) : fileUrl ? (
                        <div className="h-full flex items-center justify-center">
                            {fileType === 'image' && (
                                <img
                                    src={fileUrl}
                                    alt={file.filename}
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                                />
                            )}
                            {fileType === 'pdf' && (
                                <iframe
                                    src={fileUrl}
                                    className="w-full h-full rounded-lg shadow-lg bg-white"
                                    title={file.filename}
                                />
                            )}
                            {fileType === 'video' && (
                                <video
                                    src={fileUrl}
                                    controls
                                    className="max-w-full max-h-full rounded-lg shadow-lg"
                                >
                                    Your browser does not support the video tag.
                                </video>
                            )}
                            {fileType === 'audio' && (
                                <div className="w-full max-w-2xl">
                                    <audio
                                        src={fileUrl}
                                        controls
                                        className="w-full rounded-lg shadow-lg"
                                    >
                                        Your browser does not support the audio tag.
                                    </audio>
                                </div>
                            )}
                            {fileType === 'text' && (
                                <iframe
                                    src={fileUrl}
                                    className="w-full h-full rounded-lg shadow-lg bg-white"
                                    title={file.filename}
                                />
                            )}
                            {fileType === 'other' && (
                                <div className="flex flex-col items-center gap-6 p-12 bg-card rounded-lg shadow-lg border">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-500/10 text-purple-500">
                                        <FileIcon className="h-10 w-10" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-lg font-semibold mb-2">
                                            Preview Not Available
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-6">
                                            This file type cannot be previewed in the browser.
                                            <br />
                                            Please download the file to view it.
                                        </p>
                                        <Button
                                            onClick={handleDownload}
                                            disabled={isDownloading}
                                            className="gap-2 bg-purple-500 hover:bg-purple-600"
                                        >
                                            {isDownloading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Download className="h-4 w-4" />
                                            )}
                                            Download File
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}
