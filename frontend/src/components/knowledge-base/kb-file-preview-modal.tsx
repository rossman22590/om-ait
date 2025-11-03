'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileIcon, Edit, Loader2, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { KBFileViewerModal } from './kb-file-viewer-modal';

interface KBFilePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: {
        entry_id: string;
        filename: string;
        summary: string;
        file_size: number;
        created_at: string;
    };
    onEditSummary: (fileId: string, fileName: string, summary: string) => void;
}

export function KBFilePreviewModal({ isOpen, onClose, file, onEditSummary }: KBFilePreviewModalProps) {
    const [summary, setSummary] = useState(file.summary);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showViewer, setShowViewer] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadMessage, setDownloadMessage] = useState('Download');

    // Generate file download URL - backend will fetch from Supabase Storage dynamically
    const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    const fileDownloadUrl = `${API_URL}/knowledge-base/entries/${file.entry_id}/download`;

    const downloadMessages = [
        '📥 Downloading...',
        '🚀 Grabbing file...',
        '✨ Materializing...',
        '🎯 Fetching...',
        '⚡ Almost there...',
        '🔮 Summoning file...',
        '🎁 Unwrapping...',
        '🌟 Retrieving...',
        '📦 Packing up...',
        '🎪 Processing...',
    ];

    // Reset state when file changes or modal opens
    React.useEffect(() => {
        if (isOpen) {
            setSummary(file.summary);
            setIsEditing(true); // Auto-start editing when modal opens
        }
    }, [isOpen, file.entry_id, file.summary]);

    const handleSave = async () => {
        if (!summary.trim()) {
            toast.error('Summary cannot be empty');
            return;
        }

        setIsSaving(true);
        try {
            // Call the parent's edit summary handler directly
            onEditSummary(file.entry_id, file.filename, summary);
            onClose();
        } catch (error) {
            console.error('Error saving summary:', error);
            toast.error('Failed to save summary');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setSummary(file.summary); // Reset to original
        onClose();
    };

    const handleDownload = async () => {
        if (isDownloading) return; // Prevent multiple clicks
        
        setIsDownloading(true);
        
        // Cycle through fun download messages
        let messageIndex = 0;
        const messageInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % downloadMessages.length;
            setDownloadMessage(downloadMessages[messageIndex]);
        }, 600);
        
        try {
            // Get auth token
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session?.access_token) {
                toast.error('Authentication required');
                clearInterval(messageInterval);
                setDownloadMessage('Download');
                return;
            }

            // Fetch file with auth header
            const response = await fetch(fileDownloadUrl, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Download failed');
            }

            // Create blob and download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            toast.success('Download started');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download file');
        } finally {
            clearInterval(messageInterval);
            setIsDownloading(false);
            setDownloadMessage('Download');
        }
    };

    const handleViewOriginal = () => {
        console.log('View button clicked, opening viewer modal');
        setShowViewer(true);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                            <FileIcon className="h-5 w-5" />
                        </div>
                        <div className="overflow-hidden flex-1 min-w-0">
                            <DialogTitle>Edit File Summary</DialogTitle>
                            <p className="text-sm text-muted-foreground mt-1 whitespace-nowrap overflow-hidden text-ellipsis" title={`${file.filename} • ${formatFileSize(file.file_size)}`}>
                                {file.filename} • {formatFileSize(file.file_size)}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleViewOriginal}
                                className="gap-2"
                                title="View original file"
                            >
                                <Eye className="h-4 w-4" />
                                View
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className="gap-2 min-w-[140px]"
                                title="Download original file"
                            >
                                {isDownloading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="animate-pulse">{downloadMessage}</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4" />
                                        Download
                                    </>
                                )}
                            </Button>
                        </div>
                </DialogHeader>

                <div className="flex-1 flex flex-col space-y-4">
                    <div className="flex-1 flex flex-col space-y-2">
                        <Label htmlFor="summary">Summary</Label>
                        <Textarea
                            id="summary"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="Enter a description of this file's content..."
                            rows={12}
                            className="resize-none flex-1 min-h-[250px] max-h-[250px]"
                        />
                        <p className="text-xs text-muted-foreground">
                            This summary helps AI agents understand and search for relevant content in this file.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!summary.trim() || isSaving}
                            className="gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Edit className="h-4 w-4" />
                                    Save Summary
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        {/* File Viewer Modal - Outside main dialog to prevent nesting issues */}
        <KBFileViewerModal
            isOpen={showViewer}
            onClose={() => {
                console.log('Closing viewer modal');
                setShowViewer(false);
            }}
            file={{
                entry_id: file.entry_id,
                filename: file.filename,
                file_size: file.file_size,
            }}
        />
        </>
    );
}