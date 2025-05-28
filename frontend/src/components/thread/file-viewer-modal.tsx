'use client';

import { useState, useEffect, useRef, Fragment, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  File,
  Folder,
  FolderOpen,
  Upload,
  Download,
  ChevronRight,
  Home,
  ChevronLeft,
  Loader,
  AlertTriangle,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileRenderer,
  getFileTypeFromExtension,
} from '@/components/file-renderers';
import {
  listSandboxFiles,
  getSandboxFileContent,
  type FileInfo,
  Project,
} from '@/lib/api';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  useDirectoryQuery,
  useFileContentQuery,
  useFileUpload,
  FileCache,
  getCachedFile
} from '@/hooks/react-query/files';
import JSZip from 'jszip';

// Define API_URL
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

interface FileViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sandboxId: string;
  initialFilePath?: string | null;
  project?: Project;
}

export function FileViewerModal({
  open,
  onOpenChange,
  sandboxId,
  initialFilePath,
  project,
}: FileViewerModalProps) {
  // Safely handle initialFilePath to ensure it's a string or null
  const safeInitialFilePath = typeof initialFilePath === 'string' ? initialFilePath : null;

  // Auth for session token
  const { session } = useAuth();

  // File navigation state
  const [currentPath, setCurrentPath] = useState('/workspace');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Use React Query for directory listing
  const {
    data: files = [],
    isLoading: isLoadingFiles,
    error: filesError,
    refetch: refetchFiles
  } = useDirectoryQuery(sandboxId, currentPath, {
    enabled: open && !!sandboxId,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Add a navigation lock to prevent race conditions
  const [isNavigationLocked, setIsNavigationLocked] = useState(false);
  const currentNavigationRef = useRef<string | null>(null);

  // File content state
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [rawContent, setRawContent] = useState<string | Blob | null>(null);
  const [textContentForRenderer, setTextContentForRenderer] = useState<
    string | null
  >(null);
  const [blobUrlForRenderer, setBlobUrlForRenderer] = useState<string | null>(
    null,
  );
  const [contentError, setContentError] = useState<string | null>(null);

  // Use the React Query hook for the selected file instead of useCachedFile
  const {
    data: cachedFileContent,
    isLoading: isCachedFileLoading,
    error: cachedFileError,
  } = useFileContentQuery(
    sandboxId,
    selectedFilePath,
    {
      // Auto-detect content type consistently with other components
      enabled: !!selectedFilePath,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Utility state
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State to track if initial path has been processed
  const [initialPathProcessed, setInitialPathProcessed] = useState(false);

  // Project state
  const [projectWithSandbox, setProjectWithSandbox] = useState<
    Project | undefined
  >(project);

  // Add state for PDF export
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const markdownContainerRef = useRef<HTMLDivElement>(null);
  const markdownRef = useRef<HTMLDivElement>(null);

  // Add state for print orientation
  const [pdfOrientation, setPdfOrientation] = useState<
    'portrait' | 'landscape'
  >('portrait');

  // Add a ref to track active download URLs
  const activeDownloadUrls = useRef<Set<string>>(new Set());

  // Setup project with sandbox URL if not provided directly
  useEffect(() => {
    if (project) {
      setProjectWithSandbox(project);
    }
  }, [project, sandboxId]);

  // Function to ensure a path starts with /workspace - Defined early
  const normalizePath = useCallback((path: unknown): string => {
    // Explicitly check if the path is a non-empty string
    if (typeof path !== 'string' || !path) {
      console.warn(
        `[FILE VIEWER] normalizePath received non-string or empty value:`,
        path,
        `Returning '/workspace'`,
      );
      return '/workspace';
    }
    // Now we know path is a string
    return path.startsWith('/workspace')
      ? path
      : `/workspace/${path.replace(/^\//, '')}`;
  }, []);

  // Helper function to check if a value is a Blob (type-safe version of instanceof)
  const isBlob = (value: any): value is Blob => {
    return value instanceof Blob;
  };

  // Helper function to clear the selected file
  const clearSelectedFile = useCallback(() => {
    setSelectedFilePath(null);
    setRawContent(null);
    setTextContentForRenderer(null); // Clear derived text content
    setBlobUrlForRenderer(null); // Clear derived blob URL
    setContentError(null);
  }, []);

  // Core file opening function
  const openFile = useCallback(
    async (file: FileInfo) => {
      if (file.is_dir) {
        // For directories, just navigate to that folder
        const normalizedPath = normalizePath(file.path);
        console.log(
          `[FILE VIEWER] Navigating to folder: ${file.path} → ${normalizedPath}`,
        );

        // Clear selected file when navigating
        clearSelectedFile();

        // Update path state - must happen after clearing selection
        setCurrentPath(normalizedPath);
        return;
      }

      // Skip if already selected
      if (selectedFilePath === file.path) {
        console.log(`[FILE VIEWER] File already selected: ${file.path}`);
        return;
      }

      console.log(`[FILE VIEWER] Opening file: ${file.path}`);

      // Check file types for logging
      const isImageFile = FileCache.isImageFile(file.path);
      const isPdfFile = FileCache.isPdfFile(file.path);
      const extension = file.path.split('.').pop()?.toLowerCase();
      const isOfficeFile = ['xlsx', 'xls', 'docx', 'doc', 'pptx', 'ppt'].includes(extension || '');

      if (isImageFile) {
        console.log(`[FILE VIEWER][IMAGE DEBUG] Opening image file: ${file.path}`);
      } else if (isPdfFile) {
        console.log(`[FILE VIEWER] Opening PDF file: ${file.path}`);
      } else if (isOfficeFile) {
        console.log(`[FILE VIEWER] Opening Office document: ${file.path} (${extension})`);
      }

      // Clear previous state and set selected file
      clearSelectedFile();
      setSelectedFilePath(file.path);

      // The useFileContentQuery hook will automatically handle loading the content
      // No need to manually fetch here - React Query will handle it
    },
    [
      selectedFilePath,
      clearSelectedFile,
      normalizePath,
    ],
  );

  // Load files when modal opens or path changes - Refined
  useEffect(() => {
    if (!open || !sandboxId) {
      return; // Don't load if modal is closed or no sandbox ID
    }

    // Skip repeated loads for the same path
    if (isLoadingFiles && currentNavigationRef.current === currentPath) {
      console.log(`[FILE VIEWER] Already loading ${currentPath}, skipping duplicate load`);
      return;
    }

    // Track current navigation
    currentNavigationRef.current = currentPath;
    console.log(`[FILE VIEWER] Starting navigation to: ${currentPath}`);

    // React Query handles the loading state automatically
    console.log(`[FILE VIEWER] React Query will handle directory listing for: ${currentPath}`);

    // After the first load, set isInitialLoad to false
    if (isInitialLoad) {
      setIsInitialLoad(false);
    }

    // Handle any loading errors
    if (filesError) {
      console.error('Failed to load files:', filesError);
      toast.error('Failed to load files');
    }
  }, [open, sandboxId, currentPath, isInitialLoad, isLoadingFiles, filesError]);

  // Helper function to navigate to a folder
  const navigateToFolder = useCallback(
    (folder: FileInfo) => {
      if (!folder.is_dir) return;

      // Ensure the path is properly normalized
      const normalizedPath = normalizePath(folder.path);

      // Always navigate to the folder to ensure breadcrumbs update correctly
      console.log(
        `[FILE VIEWER] Navigating to folder: ${folder.path} → ${normalizedPath}`,
      );
      console.log(
        `[FILE VIEWER] Current path before navigation: ${currentPath}`,
      );

      // Clear selected file when navigating
      clearSelectedFile();

      // Update path state - must happen after clearing selection
      setCurrentPath(normalizedPath);
    },
    [normalizePath, clearSelectedFile, currentPath],
  );

  // Navigate to a specific path in the breadcrumb
  const navigateToBreadcrumb = useCallback(
    (path: string) => {
      const normalizedPath = normalizePath(path);

      // Always navigate when clicking breadcrumbs to ensure proper update
      console.log(
        `[FILE VIEWER] Navigating to breadcrumb path: ${path} → ${normalizedPath}`,
      );

      // Clear selected file and set path
      clearSelectedFile();
      setCurrentPath(normalizedPath);
    },
    [normalizePath, clearSelectedFile],
  );

  // Helper function to navigate to home
  const navigateHome = useCallback(() => {
    // Always navigate home when clicked to ensure consistent behavior
    console.log('[FILE VIEWER] Navigating home from:', currentPath);

    clearSelectedFile();
    setCurrentPath('/workspace');
  }, [clearSelectedFile, currentPath]);

  // Function to generate breadcrumb segments from a path
  const getBreadcrumbSegments = useCallback(
    (path: string) => {
      // Ensure we're working with a normalized path
      const normalizedPath = normalizePath(path);

      // Remove /workspace prefix and split by /
      const cleanPath = normalizedPath.replace(/^\/workspace\/?/, '');
      if (!cleanPath) return [];

      const parts = cleanPath.split('/').filter(Boolean);
      let currentPath = '/workspace';

      return parts.map((part, index) => {
        currentPath = `${currentPath}/${part}`;
        return {
          name: part,
          path: currentPath,
          isLast: index === parts.length - 1,
        };
      });
    },
    [normalizePath],
  );

  // Add a helper to directly interact with the raw cache
  const directlyAccessCache = useCallback(
    (filePath: string): {
      found: boolean;
      content: any;
      contentType: string;
    } => {
      // Normalize the path for consistent cache key
      let normalizedPath = filePath;
      if (!normalizedPath.startsWith('/workspace')) {
        normalizedPath = `/workspace/${normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath}`;
      }

      // Detect the appropriate content type based on file extension
      const detectedContentType = FileCache.getContentTypeFromPath(filePath);

      // Create cache key with detected content type
      const cacheKey = `${sandboxId}:${normalizedPath}:${detectedContentType}`;
      console.log(`[FILE VIEWER] Checking cache for key: ${cacheKey}`);

      if (FileCache.has(cacheKey)) {
        const cachedContent = FileCache.get(cacheKey);
        console.log(`[FILE VIEWER] Direct cache hit for ${normalizedPath} (${detectedContentType})`);
        return { found: true, content: cachedContent, contentType: detectedContentType };
      }

      console.log(`[FILE VIEWER] Cache miss for key: ${cacheKey}`);
      return { found: false, content: null, contentType: detectedContentType };
    },
    [sandboxId],
  );

  // Handle initial file path - Runs ONLY ONCE on open if initialFilePath is provided
  useEffect(() => {
    // Only run if modal is open, initial path is provided, AND it hasn't been processed yet
    if (open && safeInitialFilePath && !initialPathProcessed) {
      console.log(
        `[FILE VIEWER] useEffect[initialFilePath]: Processing initial path: ${safeInitialFilePath}`,
      );

      // Normalize the initial path
      const fullPath = normalizePath(safeInitialFilePath);
      const lastSlashIndex = fullPath.lastIndexOf('/');
      const directoryPath =
        lastSlashIndex > 0
          ? fullPath.substring(0, lastSlashIndex)
          : '/workspace';
      const fileName =
        lastSlashIndex >= 0 ? fullPath.substring(lastSlashIndex + 1) : '';

      console.log(
        `[FILE VIEWER] useEffect[initialFilePath]: Normalized Path: ${fullPath}, Directory: ${directoryPath}, File: ${fileName}`,
      );

      // Set the current path to the target directory
      // This will trigger the other useEffect to load files for this directory
      if (currentPath !== directoryPath) {
        console.log(
          `[FILE VIEWER] useEffect[initialFilePath]: Setting current path to ${directoryPath}`,
        );
        setCurrentPath(directoryPath);
      }

      // Try to load the file directly from cache if possible
      if (safeInitialFilePath) {
        console.log(`[FILE VIEWER] Attempting to load initial file directly from cache: ${safeInitialFilePath}`);

        // Create a temporary FileInfo object for the initial file
        const initialFile: FileInfo = {
          name: fileName,
          path: fullPath,
          is_dir: false,
          size: 0,
          mod_time: new Date().toISOString(),
        };

        // Now that openFile is defined first, we can call it directly
        console.log(`[FILE VIEWER] Opening initial file: ${fullPath}`);
        openFile(initialFile);
      }

      // Mark the initial path as processed so this doesn't run again
      setInitialPathProcessed(true);
    } else if (!open) {
      // Reset the processed flag when the modal closes
      console.log(
        '[FILE VIEWER] useEffect[initialFilePath]: Modal closed, resetting initialPathProcessed flag.',
      );
      setInitialPathProcessed(false);
    }
  }, [open, safeInitialFilePath, initialPathProcessed, normalizePath, currentPath, openFile]);

  // Effect to handle cached file content updates
  useEffect(() => {
    if (!selectedFilePath) return;

    // Handle errors
    if (cachedFileError) {
      setContentError(`Failed to load file: ${cachedFileError.message}`);
      return;
    }

    // Handle successful content
    if (cachedFileContent !== null && !isCachedFileLoading) {
      console.log(`[FILE VIEWER] Received cached content for: ${selectedFilePath}`);

      // Check file type to determine proper handling
      const isImageFile = FileCache.isImageFile(selectedFilePath);
      const isPdfFile = FileCache.isPdfFile(selectedFilePath);
      const extension = selectedFilePath.split('.').pop()?.toLowerCase();
      const isOfficeFile = ['xlsx', 'xls', 'docx', 'doc', 'pptx', 'ppt'].includes(extension || '');
      const isBinaryFile = isImageFile || isPdfFile || isOfficeFile;

      // Store raw content
      setRawContent(cachedFileContent);

      // Handle content based on type and file extension
      if (typeof cachedFileContent === 'string') {
        if (cachedFileContent.startsWith('blob:')) {
          // It's already a blob URL
          console.log(`[FILE VIEWER] Setting blob URL from cached content: ${cachedFileContent}`);
          setTextContentForRenderer(null);
          setBlobUrlForRenderer(cachedFileContent);
        } else if (isBinaryFile) {
          // Binary files should not be displayed as text, even if they come as strings
          console.warn(`[FILE VIEWER] Binary file received as string content, this should not happen: ${selectedFilePath}`);
          setTextContentForRenderer(null);
          setBlobUrlForRenderer(null);
          setContentError('Binary file received in incorrect format. Please try refreshing.');
        } else {
          // Actual text content for text files
          console.log(`[FILE VIEWER] Setting text content for text file: ${selectedFilePath}`);
          setTextContentForRenderer(cachedFileContent);
          setBlobUrlForRenderer(null);
        }
      } else if (isBlob(cachedFileContent)) {
        // Create blob URL for binary content
        const url = URL.createObjectURL(cachedFileContent);
        console.log(`[FILE VIEWER] Created blob URL: ${url} for ${selectedFilePath}`);
        setBlobUrlForRenderer(url);
        setTextContentForRenderer(null);
      } else {
        // Unknown content type
        console.warn(`[FILE VIEWER] Unknown content type for: ${selectedFilePath}`, typeof cachedFileContent);
        setTextContentForRenderer(null);
        setBlobUrlForRenderer(null);
        setContentError('Unknown content type received.');
      }
    }
  }, [selectedFilePath, cachedFileContent, isCachedFileLoading, cachedFileError]);

  // Modify the cleanup effect to respect active downloads
  useEffect(() => {
    return () => {
      if (blobUrlForRenderer && !isDownloading && !isDownloadingAll && !activeDownloadUrls.current.has(blobUrlForRenderer)) {
        console.log(`[FILE VIEWER] Revoking blob URL on cleanup: ${blobUrlForRenderer}`);
        URL.revokeObjectURL(blobUrlForRenderer);
      }
    };
  }, [blobUrlForRenderer, isDownloading, isDownloadingAll]);

  // Handle modal close
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        console.log('[FILE VIEWER] handleOpenChange: Modal closing, resetting state.');

        // Only revoke if not downloading and not an active download URL
        if (blobUrlForRenderer && !isDownloading && !isDownloadingAll && !activeDownloadUrls.current.has(blobUrlForRenderer)) {
          console.log(`[FILE VIEWER] Manually revoking blob URL on modal close: ${blobUrlForRenderer}`);
          URL.revokeObjectURL(blobUrlForRenderer);
        }

        clearSelectedFile();
        setCurrentPath('/workspace');
        // React Query will handle clearing the files data
        setInitialPathProcessed(false);
        setIsInitialLoad(true);
      }
      onOpenChange(open);
    },
    [onOpenChange, clearSelectedFile, setIsInitialLoad, blobUrlForRenderer, isDownloading, isDownloadingAll],
  );

  // Helper to check if file is markdown
  const isMarkdownFile = useCallback((filePath: string | null) => {
    return filePath ? filePath.toLowerCase().endsWith('.md') : false;
  }, []);

  // Handle PDF export for markdown files
  const handleExportPdf = useCallback(
    async (orientation: 'portrait' | 'landscape' = 'portrait') => {
      if (
        !selectedFilePath ||
        isExportingPdf ||
        !isMarkdownFile(selectedFilePath)
      )
        return;

      setIsExportingPdf(true);

      try {
        // Use the ref to access the markdown content directly
        if (!markdownRef.current) {
          throw new Error('Markdown content not found');
        }

        // Create a standalone document for printing
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          throw new Error(
            'Unable to open print window. Please check if popup blocker is enabled.',
          );
        }

        // Get the base URL for resolving relative URLs
        const baseUrl = window.location.origin;

        // Generate HTML content
        const fileName = selectedFilePath.split('/').pop() || 'document';
        const pdfName = fileName.replace(/\.md$/, '');

        // Extract content
        const markdownContent = markdownRef.current.innerHTML;

        // Generate a full HTML document with controlled styles
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${pdfName}</title>
          <style>
            @media print {
              @page { 
                size: ${orientation === 'landscape' ? 'A4 landscape' : 'A4'};
                margin: 15mm;
              }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            body {
              font-family: 'Helvetica', 'Arial', sans-serif;
              font-size: 12pt;
              color: #333;
              line-height: 1.5;
              padding: 20px;
              max-width: 100%;
              margin: 0 auto;
              background: white;
            }
            h1 { font-size: 24pt; margin-top: 20pt; margin-bottom: 12pt; }
            h2 { font-size: 20pt; margin-top: 18pt; margin-bottom: 10pt; }
            h3 { font-size: 16pt; margin-top: 16pt; margin-bottom: 8pt; }
            h4, h5, h6 { font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; }
            p { margin: 8pt 0; }
            pre, code {
              font-family: 'Courier New', monospace;
              background-color: #f5f5f5;
              border-radius: 3pt;
              padding: 2pt 4pt;
              font-size: 10pt;
            }
            pre {
              padding: 8pt;
              margin: 8pt 0;
              overflow-x: auto;
              white-space: pre-wrap;
            }
            code {
              white-space: pre-wrap;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            a {
              color: #0066cc;
              text-decoration: underline;
            }
            ul, ol {
              padding-left: 20pt;
              margin: 8pt 0;
            }
            blockquote {
              margin: 8pt 0;
              padding-left: 12pt;
              border-left: 4pt solid #ddd;
              color: #666;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 12pt 0;
            }
            th, td {
              border: 1pt solid #ddd;
              padding: 6pt;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            /* Syntax highlighting basic styles */
            .hljs-keyword, .hljs-selector-tag { color: #569cd6; }
            .hljs-literal, .hljs-number { color: #b5cea8; }
            .hljs-string { color: #ce9178; }
          }
          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 12pt;
            color: #333;
            line-height: 1.5;
            padding: 20px;
            max-width: 100%;
            margin: 0 auto;
            background: white;
          }
          h1 { font-size: 24pt; margin-top: 20pt; margin-bottom: 12pt; }
          h2 { font-size: 20pt; margin-top: 18pt; margin-bottom: 10pt; }
          h3 { font-size: 16pt; margin-top: 16pt; margin-bottom: 8pt; }
          h4, h5, h6 { font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; }
          p { margin: 8pt 0; }
          pre, code {
            font-family: 'Courier New', monospace;
            background-color: #f5f5f5;
            border-radius: 3pt;
            padding: 2pt 4pt;
            font-size: 10pt;
          }
          pre {
            padding: 8pt;
            margin: 8pt 0;
            overflow-x: auto;
            white-space: pre-wrap;
          }
          code {
            white-space: pre-wrap;
          }
          img {
            max-width: 100%;
            height: auto;
          }
          a {
            color: #0066cc;
            text-decoration: underline;
          }
          ul, ol {
            padding-left: 20pt;
            margin: 8pt 0;
          }
          blockquote {
            margin: 8pt 0;
            padding-left: 12pt;
            border-left: 4pt solid #ddd;
            color: #666;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 12pt 0;
          }
          th, td {
            border: 1pt solid #ddd;
            padding: 6pt;
            text-align: left;
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          /* Syntax highlighting basic styles */
          .hljs-keyword, .hljs-selector-tag { color: #569cd6; }
          .hljs-literal, .hljs-number { color: #b5cea8; }
          .hljs-string { color: #ce9178; }
          .hljs-comment { color: #6a9955; }
          .hljs-attribute, .hljs-attr { color: #9cdcfe; }
          .hljs-function, .hljs-name { color: #dcdcaa; }
          .hljs-title.class_ { color: #4ec9b0; }
          .markdown-content pre { background-color: #f8f8f8; }
        </style>
      </head>
      <body>
        <div class="markdown-content">
          ${markdownContent}
        </div>
        <script>
          // Remove any complex CSS variables or functions that might cause issues
          document.querySelectorAll('[style]').forEach(el => {
            const style = el.getAttribute('style');
            if (style && (style.includes('oklch') || style.includes('var(--') || style.includes('hsl('))) {
              // Replace complex color values with simple ones or remove them
              el.setAttribute('style', style
                .replace(/color:.*?(;|$)/g, 'color: #333;')
                .replace(/background-color:.*?(;|$)/g, 'background-color: transparent;')
              );
            }
          });
          
          // Print automatically when loaded
          window.onload = () => {
            setTimeout(() => {
              window.print();
              setTimeout(() => window.close(), 500);
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

        // Write the HTML content to the new window
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        toast.success('PDF export initiated. Check your print dialog.');
      } catch (error) {
        console.error('PDF export failed:', error);
        toast.error(
          `Failed to export PDF: ${error instanceof Error ? error.message : String(error)}`,
        );
      } finally {
        setIsExportingPdf(false);
      }
    },
    [selectedFilePath, isExportingPdf, isMarkdownFile],
  );

  // Handle file upload
  const handleUpload = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // Process file upload
  const processUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        console.log(`[FILE VIEWER] Uploading file: ${file.name}`);
        
        // Create FormData for upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', `${currentPath}/${file.name}`);

        // Upload the file
        const response = await fetch(`${API_URL}/api/sandbox/${sandboxId}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        console.log(`[FILE VIEWER] Successfully uploaded: ${file.name}`);
      }

      toast.success(`Successfully uploaded ${files.length} file(s)`);
      
      // Refresh the file list
      refetchFiles();
      
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUploading(false);
    }
  }, [currentPath, sandboxId, session?.access_token, refetchFiles]);

  // Handle file download - Define after helpers
  const handleDownload = async () => {
    if (!selectedFilePath || isDownloading) return;

    try {
      setIsDownloading(true);
      console.log(`[FILE VIEWER] Starting download for: ${selectedFilePath}`);

      // Get the file content from cache
      const cacheKey = `${sandboxId}:${selectedFilePath}`;
      const cachedContent = FileCache.get(cacheKey);

      if (!cachedContent) {
        console.log(`[FILE VIEWER] Cache miss for download, fetching fresh content`);
        // If not in cache, fetch it fresh
        const content = await getCachedFile(
          sandboxId,
          selectedFilePath,
          {
            contentType: FileCache.getContentTypeFromPath(selectedFilePath),
            force: true,
            token: session?.access_token,
          }
        );

        if (!content) {
          throw new Error('Failed to fetch file content');
        }

        // Create a new blob URL for download
        let downloadUrl;
        try {
          // Check if content is a valid blob or URL
          if (content instanceof Blob) {
            downloadUrl = URL.createObjectURL(content);
          } else if (typeof content === 'string' && content.startsWith('blob:')) {
            // It's already a blob URL
            downloadUrl = content;
          } else {
            console.warn(`[FILE VIEWER] Content is not a Blob or blob URL, attempting conversion`);
            // Try to convert to a Blob if possible
            let blob;
            
            if (content instanceof ArrayBuffer) {
              blob = new Blob([content]);
            } else if (typeof content === 'string') {
              blob = new Blob([content], { type: 'text/plain' });
            } else {
              throw new Error(`Cannot convert content of type ${typeof content} to blob`);
            }
            
            downloadUrl = URL.createObjectURL(blob);
          }
          console.log(`[FILE VIEWER] Created download URL: ${downloadUrl}`);  
        } catch (error) {
          console.error(`[FILE VIEWER] Error creating object URL:`, error);
          throw new Error(`Failed to create download URL: ${error instanceof Error ? error.message : String(error)}`);
        }

        // Track the URL to prevent premature revocation
        activeDownloadUrls.current.add(downloadUrl);

        // Create and trigger download
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = selectedFilePath.split('/').pop() || 'file';
        document.body.appendChild(a);
        a.click();

        // Clean up
        document.body.removeChild(a);
        
        // Use setTimeout to delay URL revocation to ensure download completes
        setTimeout(() => {
          URL.revokeObjectURL(downloadUrl);
          activeDownloadUrls.current.delete(downloadUrl);
          console.log(`[FILE VIEWER] Revoked download URL after delay: ${downloadUrl}`);
        }, 5000); // 5 second delay to ensure download completes
      } else {
        console.log(`[FILE VIEWER] Using cached content for download, type: ${typeof cachedContent}, isBlob: ${cachedContent instanceof Blob}`);
        // If we have cached content, use it directly
        let downloadUrl;
        
        try {
          // Check if the cached content is a Blob or can be converted to one
          if (cachedContent instanceof Blob) {
            // It's already a Blob, use it directly
            downloadUrl = URL.createObjectURL(cachedContent);
          } else if (typeof cachedContent === 'string' && cachedContent.startsWith('blob:')) {
            // It's already a blob URL, use it directly
            downloadUrl = cachedContent;
          } else {
            // Try to convert to a Blob if it's another format (like ArrayBuffer)
            console.log(`[FILE VIEWER] Attempting to convert cached content to Blob`);
            let blob;
            
            if (cachedContent instanceof ArrayBuffer) {
              blob = new Blob([cachedContent]);
            } else if (typeof cachedContent === 'string') {
              blob = new Blob([cachedContent], { type: 'text/plain' });
            } else if (cachedContent?.content instanceof Blob) {
              // Handle case where cache stores {content: Blob, timestamp: number, type: string}
              blob = cachedContent.content;
            } else {
              throw new Error(`Cannot convert cached content type ${typeof cachedContent} to blob`);
            }
            
            downloadUrl = URL.createObjectURL(blob);
          }
          console.log(`[FILE VIEWER] Created download URL from cache: ${downloadUrl}`);      
        } catch (error) {
          console.error(`[FILE VIEWER] Error creating object URL from cached content:`, error);
          throw new Error(`Failed to create download URL: ${error instanceof Error ? error.message : String(error)}`);
        }

        // Track the URL to prevent premature revocation
        activeDownloadUrls.current.add(downloadUrl);

        // Create and trigger download
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = selectedFilePath.split('/').pop() || 'file';
        document.body.appendChild(a);
        a.click();

        // Clean up
        document.body.removeChild(a);
        
        // Use setTimeout to delay URL revocation to ensure download completes
        setTimeout(() => {
          URL.revokeObjectURL(downloadUrl);
          activeDownloadUrls.current.delete(downloadUrl);
          console.log(`[FILE VIEWER] Revoked download URL after delay: ${downloadUrl}`);
        }, 5000); // 5 second delay to ensure download completes
      }

      toast.success('Download started');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(`Failed to download file: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Helper function to download a blob
  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Track URL and schedule cleanup
    activeDownloadUrls.current.add(url);
    setTimeout(() => {
      URL.revokeObjectURL(url);
      activeDownloadUrls.current.delete(url);
    }, 10000);

    toast.success('Download started');
  };

  // Function to recursively gather files from a directory
  const gatherFilesRecursively = useCallback(async (
    path: string, 
    zip: JSZip, 
    folderPath: string = ''
  ): Promise<void> => {
    try {
      // List all files and directories in the current path
      const allFiles = await listSandboxFiles(sandboxId, path);
      
      // Process each file/directory
      for (const file of allFiles) {
        const relativePath = folderPath ? `${folderPath}/${file.name}` : file.name;
        
        // Skip node_modules, package-lock.json, and folders starting with a dot
        if ((file.is_dir && (file.name === 'node_modules' || file.name.startsWith('.'))) || 
            (!file.is_dir && file.name === 'package-lock.json')) {
          console.log(`[ZIP] Skipping excluded item: ${file.path}`);
          continue;
        }
        
        if (file.is_dir) {
          // For directories, create a folder in the zip and recurse
          console.log(`[ZIP] Processing directory: ${file.path}`);
          await gatherFilesRecursively(file.path, zip, relativePath);
        } else {
          // For files, add to the zip
          console.log(`[ZIP] Adding file: ${file.path}`);
          try {
            // Get file content using React Query utilities
            const content = await getCachedFile(
              sandboxId,
              file.path,
              {
                contentType: 'blob', // Always get as blob for universal compatibility
                force: false, // Use cache if available
                token: session?.access_token,
              }
            );
            
            if (content) {
              // Add file to the zip with proper relative path
              if (content instanceof Blob) {
                zip.file(relativePath, content);
              } else if (typeof content === 'string' && !content.startsWith('blob:')) {
                // Plain text content
                zip.file(relativePath, content);
              } else if (typeof content === 'string' && content.startsWith('blob:')) {
                // Handle blob URLs by fetching the content
                const response = await fetch(content);
                const blob = await response.blob();
                zip.file(relativePath, blob);
              } else {
                console.warn(`[ZIP] Unexpected content type for ${file.path}: ${typeof content}`);
              }
            }
          } catch (error) {
            console.error(`[ZIP] Error adding file ${file.path}:`, error);
            // Continue with other files even if one fails
          }
        }
      }
    } catch (error) {
      console.error(`[ZIP] Error gathering files from ${path}:`, error);
      throw error;
    }
  }, [sandboxId, session?.access_token]);

  // Handle download all files as a zip
  const handleDownloadAll = useCallback(async () => {
    if (isDownloadingAll) return;
    
    try {
      setIsDownloadingAll(true);
      toast.info('Preparing workspace download...');
      console.log('[ZIP] Starting download all process');
      
      // Create a new JSZip instance
      const zip = new JSZip();
      
      // Start gathering files from the workspace root
      await gatherFilesRecursively('/workspace', zip);
      
      // Generate the zip file
      console.log('[ZIP] Generating zip file...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Create download link
      const downloadUrl = URL.createObjectURL(zipBlob);
      activeDownloadUrls.current.add(downloadUrl);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'workspace.zip';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      
      // Delay URL revocation to ensure download completes
      setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
        activeDownloadUrls.current.delete(downloadUrl);
      }, 10000);
      
      toast.success('Workspace download started');
    } catch (error) {
      console.error('[ZIP] Download all failed:', error);
      toast.error(`Failed to download workspace: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsDownloadingAll(false);
    }
  }, [sandboxId, isDownloadingAll, gatherFilesRecursively]);

  // --- Render --- //
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[1200px] w-[95vw] h-[90vh] max-h-[900px] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 py-2 border-b flex-shrink-0">
          <DialogTitle className="text-lg font-semibold">
            Workspace Files
          </DialogTitle>
        </DialogHeader>

        {/* Navigation Bar */}
        <div className="px-4 py-2 border-b flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={navigateHome}
            className="h-8 w-8"
            title="Go to home directory"
          >
            <Home className="h-4 w-4" />
          </Button>

          <div className="flex items-center overflow-x-auto flex-1 min-w-0 scrollbar-hide whitespace-nowrap">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-sm font-medium min-w-fit flex-shrink-0"
              onClick={navigateHome}
            >
              home
            </Button>

            {currentPath !== '/workspace' && (
              <>
                {getBreadcrumbSegments(currentPath).map((segment, index) => (
                  <Fragment key={segment.path}>
                    <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground opacity-50 flex-shrink-0" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-sm font-medium truncate max-w-[200px]"
                      onClick={() => navigateToBreadcrumb(segment.path)}
                    >
                      {segment.name}
                    </Button>
                  </Fragment>
                ))}
              </>
            )}

            {selectedFilePath && (
              <>
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground opacity-50 flex-shrink-0" />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {selectedFilePath.split('/').pop()}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {selectedFilePath && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={isDownloading || isCachedFileLoading}
                  className="h-8 gap-1"
                >
                  {isDownloading ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Download</span>
                </Button>

                {/* Replace the Export as PDF button with a dropdown */}
                {isMarkdownFile(selectedFilePath) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          isExportingPdf ||
                          isCachedFileLoading ||
                          contentError !== null
                        }
                        className="h-8 gap-1"
                      >
                        {isExportingPdf ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                        <span className="hidden sm:inline">Export as PDF</span>
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleExportPdf('portrait')}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <span className="rotate-90">⬌</span> Portrait
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleExportPdf('landscape')}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <span>⬌</span> Landscape
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            )}

            {!selectedFilePath && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUpload}
                disabled={isUploading}
                className="h-8 gap-1"
              >
                {isUploading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Upload</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadAll}
              disabled={isDownloadingAll}
              className="h-8 gap-1"
            >
              {isDownloadingAll ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Download All</span>
            </Button>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={processUpload}
              disabled={isUploading}
              multiple
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {selectedFilePath ? (
            /* File Viewer */
            <div className="h-full w-full overflow-auto">
              {isCachedFileLoading ? (
                <div className="h-full w-full flex flex-col items-center justify-center">
                  <Loader className="h-8 w-8 animate-spin text-primary mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Loading file{selectedFilePath ? `: ${selectedFilePath.split('/').pop()}` : '...'}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {(() => {
                      // Normalize the path for consistent cache checks
                      if (!selectedFilePath) return "Preparing...";

                      let normalizedPath = selectedFilePath;
                      if (!normalizedPath.startsWith('/workspace')) {
                        normalizedPath = `/workspace/${normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath}`;
                      }

                      // Detect the appropriate content type based on file extension
                      const detectedContentType = FileCache.getContentTypeFromPath(normalizedPath);

                      // Check for cache with the correct content type
                      const isCached = FileCache.has(`${sandboxId}:${normalizedPath}:${detectedContentType}`);

                      return isCached
                        ? "Using cached version"
                        : "Fetching from server";
                    })()}
                  </p>
                </div>
              ) : contentError ? (
                <div className="h-full w-full flex items-center justify-center p-4">
                  <div className="max-w-md p-6 text-center border rounded-lg bg-muted/10">
                    <AlertTriangle className="h-10 w-10 text-orange-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      Error Loading File
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {contentError}
                    </p>
                    <div className="flex justify-center gap-3">
                      <Button
                        onClick={() => {
                          setContentError(null);
                          openFile({
                            path: selectedFilePath,
                            name: selectedFilePath.split('/').pop() || '',
                            is_dir: false,
                            size: 0,
                            mod_time: new Date().toISOString(),
                          } as FileInfo);
                        }}
                      >
                        Retry
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          clearSelectedFile();
                        }}
                      >
                        Back to Files
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full w-full relative">
                  {(() => {
                    // Safety check: don't render text content for binary files
                    const isImageFile = FileCache.isImageFile(selectedFilePath);
                    const isPdfFile = FileCache.isPdfFile(selectedFilePath);
                    const extension = selectedFilePath?.split('.').pop()?.toLowerCase();
                    const isOfficeFile = ['xlsx', 'xls', 'docx', 'doc', 'pptx', 'ppt'].includes(extension || '');
                    const isBinaryFile = isImageFile || isPdfFile || isOfficeFile;

                    // For binary files, only render if we have a blob URL
                    if (isBinaryFile && !blobUrlForRenderer) {
                      return (
                        <div className="h-full w-full flex items-center justify-center">
                          <div className="text-sm text-muted-foreground">
                            Loading {isPdfFile ? 'PDF' : isImageFile ? 'image' : 'file'}...
                          </div>
                        </div>
                      );
                    }

                    return (
                      <FileRenderer
                        key={selectedFilePath}
                        content={isBinaryFile ? null : textContentForRenderer}
                        binaryUrl={blobUrlForRenderer}
                        fileName={selectedFilePath}
                        className="h-full w-full"
                        project={projectWithSandbox}
                        markdownRef={
                          isMarkdownFile(selectedFilePath) ? markdownRef : undefined
                        }
                        onDownload={handleDownload}
                        isDownloading={isDownloading}
                      />
                    );
                  })()}
                </div>
              )}
            </div>
          ) : (
            /* File Explorer */
            <div className="h-full w-full">
              {isLoadingFiles ? (
                <div className="h-full w-full flex items-center justify-center">
                  <Loader className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : files.length === 0 ? (
                <div className="h-full w-full flex flex-col items-center justify-center">
                  <Folder className="h-12 w-12 mb-2 text-muted-foreground opacity-30" />
                  <p className="text-sm text-muted-foreground">
                    Directory is empty
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-full w-full p-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4">
                    {files.map((file) => (
                      <button
                        key={file.path}
                        className={`flex flex-col items-center p-3 rounded-lg border hover:bg-muted/50 transition-colors ${selectedFilePath === file.path
                          ? 'bg-muted border-primary/20'
                          : ''
                          }`}
                        onClick={() => {
                          if (file.is_dir) {
                            console.log(
                              `[FILE VIEWER] Folder clicked: ${file.name}, path: ${file.path}`,
                            );
                            navigateToFolder(file);
                          } else {
                            openFile(file);
                          }
                        }}
                      >
                        <div className="w-12 h-12 flex items-center justify-center mb-1">
                          {file.is_dir ? (
                            <Folder className="h-9 w-9 text-blue-500" />
                          ) : (
                            <File className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <span className="text-xs text-center font-medium truncate max-w-full">
                          {file.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
