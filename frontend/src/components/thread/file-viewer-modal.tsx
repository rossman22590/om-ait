'use client';

import { useState, useEffect, useRef, Fragment, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  File,
  Folder,
  Upload,
  Download,
  ChevronRight,
  Home,
  ChevronLeft,
  Loader,
  AlertTriangle,
  FileText,
  ChevronDown,
  Archive,
  Grid3X3,
  List,
  Edit,
  Save,
  X,
  MoreHorizontal,
  FolderOpen,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileRenderer,
} from '@/components/file-renderers';
import {
  listSandboxFiles,
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
  FileCache
} from '@/hooks/react-query/files';
import JSZip from 'jszip';
import { normalizeFilenameToNFC } from '@/lib/utils/unicode';

// Import updated components
import { FileListView } from './file-viewer/file-list-view';
import { FileSearchBar } from './file-viewer/file-search-bar';
import { FileToolbar } from './file-viewer/file-toolbar';
import { FileRenameModal } from './file-viewer/file-rename-modal';

// Define API_URL
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

interface FileViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sandboxId: string;
  initialFilePath?: string | null;
  project?: Project;
  filePathList?: string[];
}

export function FileViewerModal({
  open,
  onOpenChange,
  sandboxId,
  initialFilePath,
  project,
  filePathList,
}: FileViewerModalProps) {
  // Safely handle initialFilePath to ensure it's a string or null
  const safeInitialFilePath = typeof initialFilePath === 'string' ? initialFilePath : null;

  // Auth for session token
  const { session } = useAuth();

  // File navigation state
  const [currentPath, setCurrentPath] = useState('/workspace');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Add navigation state for file list mode
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(-1);
  const isFileListMode = Boolean(filePathList && filePathList.length > 0);

  // Enhanced state for file management features
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/workspace']));
  const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingZip, setIsCreatingZip] = useState(false);

  // Modal states for rename and delete (files only now)
  const [renameModal, setRenameModal] = useState<{ open: boolean; file: FileInfo | null }>({ open: false, file: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; file: FileInfo | null }>({ open: false, file: null });
  const [multiDeleteModal, setMultiDeleteModal] = useState<{ open: boolean; items: string[] }>({ open: false, items: [] });

  // Inline editing state (replaces modal editing)
  const [inlineEditMode, setInlineEditMode] = useState<{path: string, content: string} | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Store folder contents for tree view
  const [folderContents, setFolderContents] = useState<Map<string, FileInfo[]>>(new Map());

  // Debug filePathList changes
  useEffect(() => {
    console.log('[FILE VIEWER DEBUG] filePathList changed:', {
      filePathList,
      length: filePathList?.length,
      isFileListMode,
      currentFileIndex
    });
  }, [filePathList, isFileListMode, currentFileIndex]);

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

  // Filter files based on search query
  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add a navigation lock to prevent race conditions
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
    refetch: refetchFileContent
  } = useFileContentQuery(
    sandboxId,
    selectedFilePath || undefined,
    {
      // Auto-detect content type consistently with other components
      enabled: !!selectedFilePath,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Utility state
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State to track if initial path has been processed
  const [initialPathProcessed, setInitialPathProcessed] = useState(false);

  // Project state
  const [projectWithSandbox, setProjectWithSandbox] = useState<
    Project | undefined
  >(project);

  // Add state for PDF export
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const markdownRef = useRef<HTMLDivElement>(null);

  // Add a ref to track active download URLs
  const activeDownloadUrls = useRef<Set<string>>(new Set());

  // Add state for download all functionality
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    current: number;
    total: number;
    currentFile: string;
  } | null>(null);

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

  // NEW: Recursive function to get all files and folders within a folder
  const getAllItemsInFolder = useCallback(async (folderPath: string): Promise<string[]> => {
    const allItems: string[] = [];
    const visited = new Set<string>();

    const exploreFolder = async (path: string) => {
      if (visited.has(path)) return;
      visited.add(path);

      try {
        const items = await listSandboxFiles(sandboxId, path);
        
        for (const item of items) {
          allItems.push(item.path);
          
          if (item.is_dir) {
            // Recursively get items from subfolders
            await exploreFolder(item.path);
          }
        }
      } catch (error) {
        console.error(`Error exploring folder ${path}:`, error);
      }
    };

    await exploreFolder(folderPath);
    return allItems;
  }, [sandboxId]);

  // Enhanced file selection functions with recursive folder selection
  const handleFileSelect = useCallback(async (filePath: string, checked: boolean) => {
    const file = filteredFiles.find(f => f.path === filePath);
    if (!file) return;

    let itemsToUpdate = [filePath];

    // If selecting a folder, get all items inside it recursively
    if (file.is_dir && checked) {
      console.log(`[FOLDER SELECTION] Getting all items in folder: ${filePath}`);
      try {
        const folderItems = await getAllItemsInFolder(filePath);
        itemsToUpdate = [filePath, ...folderItems];
        console.log(`[FOLDER SELECTION] Found ${folderItems.length} items in ${filePath}`);
      } catch (error) {
        console.error(`Failed to get folder contents for selection:`, error);
        toast.error('Failed to load folder contents for selection');
      }
    }

    setSelectedFiles(prev => {
      let newSelection: string[];
      
      if (checked) {
        // Add all items (remove duplicates)
        const itemsToAdd = itemsToUpdate.filter(item => !prev.includes(item));
        newSelection = [...prev, ...itemsToAdd];
      } else {
        // Remove all items
        newSelection = prev.filter(item => !itemsToUpdate.includes(item));
      }
      
      // Update multi-select mode based on selection count
      setMultiSelectMode(newSelection.length > 0);
      return newSelection;
    });
  }, [filteredFiles, getAllItemsInFolder]);

  const handleSelectAll = useCallback(() => {
    const allPaths = filteredFiles.map(f => f.path); // Include both files and folders
    setSelectedFiles(allPaths);
    setMultiSelectMode(true);
  }, [filteredFiles]);

  const handleDeselectAll = useCallback(() => {
    setSelectedFiles([]);
    setMultiSelectMode(false);
  }, []);

  // Function to calculate accurate file and folder counts from selection
  const getSelectionStats = useCallback(async () => {
    if (selectedFiles.length === 0) {
      return { totalFiles: 0, totalFolders: 0, rootFolders: 0, rootFiles: 0 };
    }

    let totalFiles = 0;
    let totalFolders = 0;
    let rootFiles = 0;
    let rootFolders = 0;
    
    // Get files that are directly selected (not just included because their parent folder is selected)
    const directlySelectedItems = new Set(selectedFiles);
    
    for (const selectedPath of selectedFiles) {
      // Check if this item is a root selection or a child of a selected folder
      const isRootSelection = !selectedFiles.some(otherPath => 
        otherPath !== selectedPath && selectedPath.startsWith(otherPath + '/')
      );
      
      if (isRootSelection) {
        // This is a directly selected item
        const item = filteredFiles.find(f => f.path === selectedPath);
        if (item) {
          if (item.is_dir) {
            rootFolders++;
            // Count all items in this folder
            try {
              const folderItems = await getAllItemsInFolder(selectedPath);
              for (const itemPath of folderItems) {
                // Determine if it's a file or folder by checking if it ends with a known file extension
                // or by trying to find it in our known files
                const isFile = !itemPath.endsWith('/') && (
                  itemPath.includes('.') || 
                  !selectedFiles.some(p => p.startsWith(itemPath + '/'))
                );
                
                if (isFile) {
                  totalFiles++;
                } else {
                  totalFolders++;
                }
              }
            } catch (error) {
              console.error(`Error counting items in folder ${selectedPath}:`, error);
            }
          } else {
            rootFiles++;
          }
        }
      }
    }
    
    // Add root files to total
    totalFiles += rootFiles;
    totalFolders += rootFolders;

    return { totalFiles, totalFolders, rootFiles, rootFolders };
  }, [selectedFiles, filteredFiles, getAllItemsInFolder]);

  // Folder expansion toggle for tree view with loading
  const toggleFolderExpansion = useCallback(async (folderPath: string) => {
    if (loadingFolders.has(folderPath)) return; // Prevent double-loading

    if (expandedFolders.has(folderPath)) {
      // Collapse folder
      setExpandedFolders(prev => {
        const newSet = new Set(prev);
        newSet.delete(folderPath);
        return newSet;
      });
    } else {
      // Expand folder - load contents if not already loaded
      setLoadingFolders(prev => new Set(prev).add(folderPath));
      
      try {
        const folderFiles = await listSandboxFiles(sandboxId, folderPath);
        
        // Store folder contents
        setFolderContents(prev => new Map(prev).set(folderPath, folderFiles));
        
        // Expand folder
        setExpandedFolders(prev => new Set(prev).add(folderPath));
        
        console.log(`[FOLDER EXPANSION] Loaded ${folderFiles.length} items for ${folderPath}`);
      } catch (error) {
        console.error(`[FOLDER EXPANSION] Failed to load ${folderPath}:`, error);
        toast.error(`Failed to load folder contents: ${folderPath.split('/').pop()}`);
      } finally {
        setLoadingFolders(prev => {
          const newSet = new Set(prev);
          newSet.delete(folderPath);
          return newSet;
        });
      }
    }
  }, [expandedFolders, loadingFolders, sandboxId]);

  // Modal handlers for rename (files only)
  const handleTriggerRename = useCallback((file: FileInfo) => {
    if (file.is_dir) return; // Don't allow folder renaming
    setRenameModal({ open: true, file });
  }, []);

  const handleRenameModalSave = useCallback(async (newName: string) => {
    if (!renameModal.file || !session?.access_token || !newName.trim() || renameModal.file.is_dir) {
      setRenameModal({ open: false, file: null });
      return;
    }

    const file = renameModal.file;
    
    try {
      // For files only
      const response = await fetch(
        `${API_URL}/sandboxes/${sandboxId}/files/content?path=${encodeURIComponent(file.path)}`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch file content');
      }

      const blob = await response.blob();
      
      const pathParts = file.path.split('/');
      pathParts[pathParts.length - 1] = newName;
      const newPath = pathParts.join('/');

      const formData = new FormData();
      formData.append('file', blob, newName);
      formData.append('path', newPath);

      const uploadResponse = await fetch(
        `${API_URL}/sandboxes/${sandboxId}/files`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload renamed file');
      }

      // Delete the old file
      const deleteResponse = await fetch(
        `${API_URL}/sandboxes/${sandboxId}/files?path=${encodeURIComponent(file.path)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (deleteResponse.ok) {
        // Clear cache for old path
        FileCache.delete(`${sandboxId}:${file.path}:text`);
        FileCache.delete(`${sandboxId}:${file.path}:blob`);
        FileCache.delete(`${sandboxId}:${file.path}:json`);
      }
      
      await refetchFiles();
      toast.success(`Renamed to ${newName}`);
      
      // Update selected file path if it was the renamed file
      if (selectedFilePath === file.path) {
        const pathParts = file.path.split('/');
        pathParts[pathParts.length - 1] = newName;
        const newPath = pathParts.join('/');
        setSelectedFilePath(newPath);
      }
      
      // Update selected files list - if the renamed item was selected, update its path
      setSelectedFiles(prev => prev.map(p => {
        if (p === file.path || p.startsWith(file.path + '/')) {
          // Update the path
          const pathParts = file.path.split('/');
          pathParts[pathParts.length - 1] = newName;
          const newBasePath = pathParts.join('/');
          return p.replace(file.path, newBasePath);
        }
        return p;
      }));

    } catch (error) {
      console.error('Rename failed:', error);
      toast.error(`Failed to rename: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setRenameModal({ open: false, file: null });
    }
  }, [renameModal, sandboxId, session?.access_token, refetchFiles, selectedFilePath]);

  // Modal handlers for delete (files only)
  const handleTriggerDelete = useCallback((file: FileInfo) => {
    if (file.is_dir) return; // Don't allow folder deletion
    setDeleteModal({ open: true, file });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteModal.file || !session?.access_token || deleteModal.file.is_dir) {
      setDeleteModal({ open: false, file: null });
      return;
    }

    const file = deleteModal.file;
    setIsDeleting(true);

    try {
      console.log(`[DELETE] Deleting file: ${file.path}`);
      
      const response = await fetch(`${API_URL}/sandboxes/${sandboxId}/files?path=${encodeURIComponent(file.path)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Delete failed: ${response.status} - ${errorData}`);
        throw new Error(`Failed to delete file: ${errorData}`);
      }

      // Clear from cache
      FileCache.delete(`${sandboxId}:${file.path}:text`);
      FileCache.delete(`${sandboxId}:${file.path}:blob`);
      FileCache.delete(`${sandboxId}:${file.path}:json`);

      // Remove from selected files
      setSelectedFiles(prev => prev.filter(p => p !== file.path && !p.startsWith(file.path + '/')));

      await refetchFiles();
      toast.success(`Deleted file: ${file.name}`);

    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(`Failed to delete: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsDeleting(false);
      setDeleteModal({ open: false, file: null });
    }
  }, [deleteModal, sandboxId, session?.access_token, refetchFiles]);

  // Updated handleDeleteSelected to only handle files
  const handleDeleteSelected = useCallback(async () => {
    if (!session?.access_token || selectedFiles.length === 0 || isDeleting) return;

    // Filter to only include files, not folders
    const filesToDelete = selectedFiles.filter(filePath => {
      const file = filteredFiles.find(f => f.path === filePath);
      return file && !file.is_dir;
    });

    if (filesToDelete.length === 0) {
      toast.warning('Only files can be deleted through multi-select. Folders should be downloaded as ZIP instead.');
      return;
    }

    // Open the multi-delete modal with only files
    setMultiDeleteModal({ open: true, items: filesToDelete });
  }, [selectedFiles, session?.access_token, isDeleting, filteredFiles]);

  // New function to handle multi-delete confirmation (files only)
  const handleConfirmMultiDelete = useCallback(async () => {
    if (!session?.access_token || multiDeleteModal.items.length === 0 || isDeleting) {
      setMultiDeleteModal({ open: false, items: [] });
      return;
    }

    setIsDeleting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      console.log(`[MULTI-DELETE] Deleting ${multiDeleteModal.items.length} files`);

      for (const filePath of multiDeleteModal.items) {
        try {
          // Only delete files (should already be filtered)
          const file = filteredFiles.find(f => f.path === filePath);
          if (file && file.is_dir) {
            console.log(`[MULTI-DELETE] Skipping folder: ${filePath}`);
            continue;
          }
          
          console.log(`[MULTI-DELETE] Deleting file: ${filePath}`);
          
          const response = await fetch(`${API_URL}/sandboxes/${sandboxId}/files?path=${encodeURIComponent(filePath)}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            successCount++;
            // Remove from cache
            FileCache.delete(`${sandboxId}:${filePath}:text`);
            FileCache.delete(`${sandboxId}:${filePath}:blob`);
            FileCache.delete(`${sandboxId}:${filePath}:json`);
          } else {
            errorCount++;
            const errorText = await response.text();
            console.error(`Failed to delete ${filePath}: ${response.status} - ${errorText}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`Error deleting ${filePath}:`, error);
        }
      }

      // Clear selections and refresh
      handleDeselectAll();
      await refetchFiles();

      if (successCount > 0) {
        toast.success(`Deleted ${successCount} file(s)`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to delete ${errorCount} file(s)`);
      }

    } catch (error) {
      console.error('Delete operation failed:', error);
      toast.error('Failed to delete files');
    } finally {
      setIsDeleting(false);
      setMultiDeleteModal({ open: false, items: [] });
    }
  }, [sandboxId, multiDeleteModal.items, session?.access_token, isDeleting, refetchFiles, handleDeselectAll, filteredFiles]);

  // Download individual file
  const handleDownloadFile = useCallback(async (file: FileInfo) => {
    if (file.is_dir || !session?.access_token) return;

    try {
      setIsDownloading(true);
      console.log(`[DOWNLOAD FILE] Downloading: ${file.path}`);

      const response = await fetch(
        `${API_URL}/sandboxes/${sandboxId}/files/content?path=${encodeURIComponent(file.path)}`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status}`);
      }

      const blob = await response.blob();
      const mimeType = FileCache.getMimeTypeFromPath?.(file.path) || 'application/octet-stream';
      const finalBlob = new Blob([blob], { type: mimeType });
      
      // Download the file
      const url = URL.createObjectURL(finalBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Track URL and schedule cleanup
      activeDownloadUrls.current.add(url);
      setTimeout(() => {
        URL.revokeObjectURL(url);
        activeDownloadUrls.current.delete(url);
      }, 10000);

      toast.success(`Downloaded: ${file.name}`);

    } catch (error) {
      console.error('Download failed:', error);
      toast.error(`Failed to download file: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsDownloading(false);
    }
  }, [sandboxId, session?.access_token]);

  // Download folder as ZIP
  const handleDownloadFolderAsZip = useCallback(async (folder: FileInfo) => {
    if (!folder.is_dir || !session?.access_token) return;

    try {
      setIsCreatingZip(true);
      console.log(`[DOWNLOAD FOLDER] Creating ZIP for folder: ${folder.path}`);

      const zip = new JSZip();

      // Get all files in the folder recursively
      const folderItems = await getAllItemsInFolder(folder.path);
      console.log(`[DOWNLOAD FOLDER] Found ${folderItems.length} items in folder`);

      let addedFiles = 0;
      for (const itemPath of folderItems) {
        try {
          // Only add files, not folders
          const response = await fetch(
            `${API_URL}/sandboxes/${sandboxId}/files/content?path=${encodeURIComponent(itemPath)}`,
            {
              headers: { 'Authorization': `Bearer ${session.access_token}` }
            }
          );
          
          if (response.ok) {
            const blob = await response.blob();
            const relativePath = itemPath.replace(`${folder.path}/`, '');
            zip.file(relativePath, blob);
            addedFiles++;
          }
        } catch (error) {
          // Skip files that can't be loaded (they might be folders)
          console.log(`Skipping ${itemPath} - might be a folder or inaccessible`);
        }
      }

      if (addedFiles === 0) {
        toast.warning(`No files found in folder "${folder.name}" to download`);
        return;
      }

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${folder.name}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 10000);
      toast.success(`Downloaded folder "${folder.name}" as ZIP with ${addedFiles} files`);

    } catch (error) {
      console.error('Folder ZIP creation failed:', error);
      toast.error(`Failed to create ZIP: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsCreatingZip(false);
    }
  }, [sandboxId, session?.access_token, getAllItemsInFolder]);

  // Download selected files/folders as ZIP
  const handleDownloadSelected = useCallback(async () => {
    if (!session?.access_token || selectedFiles.length === 0 || isCreatingZip) return;

    setIsCreatingZip(true);
    try {
      const zip = new JSZip();

      // Get root items only to avoid duplicates
      const rootItems = selectedFiles.filter(selectedPath => 
        !selectedFiles.some(otherPath => 
          otherPath !== selectedPath && selectedPath.startsWith(otherPath + '/')
        )
      );

      for (let i = 0; i < rootItems.length; i++) {
        const filePath = rootItems[i];
        const file = filteredFiles.find(f => f.path === filePath);
        
        if (!file) continue;
        
        if (file.is_dir) {
          // For folders, recursively add all files
          try {
            const folderItems = await getAllItemsInFolder(filePath);
            for (const itemPath of folderItems) {
              // Only add files, not folders
              try {
                const response = await fetch(
                  `${API_URL}/sandboxes/${sandboxId}/files/content?path=${encodeURIComponent(itemPath)}`,
                  {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                  }
                );
                
                if (response.ok) {
                  const blob = await response.blob();
                  const relativePath = itemPath.replace(`${filePath}/`, '');
                  zip.file(`${file.name}/${relativePath}`, blob);
                }
              } catch (error) {
                // Skip files that can't be loaded (they might be folders)
                console.log(`Skipping ${itemPath} - might be a folder`);
              }
            }
          } catch (error) {
            console.error(`Failed to load folder ${filePath} for zip:`, error);
          }
        } else {
          // For files
          try {
            const response = await fetch(
              `${API_URL}/sandboxes/${sandboxId}/files/content?path=${encodeURIComponent(filePath)}`,
              {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
              }
            );

            if (response.ok) {
              const blob = await response.blob();
              zip.file(file.name, blob);
            }
          } catch (error) {
            console.error(`Failed to load ${filePath} for zip:`, error);
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `selected-items-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 10000);
      toast.success(`Downloaded ${rootItems.length} items as ZIP`);

    } catch (error) {
      console.error('ZIP creation failed:', error);
      toast.error('Failed to create ZIP file');
    } finally {
      setIsCreatingZip(false);
    }
  }, [sandboxId, selectedFiles, session?.access_token, isCreatingZip, filteredFiles, getAllItemsInFolder]);

  // Start inline editing (replaces opening modal)
  const handleStartEdit = useCallback(async () => {
    if (!selectedFilePath || !session?.access_token) return;

    try {
      const response = await fetch(
        `${API_URL}/sandboxes/${sandboxId}/files/content?path=${encodeURIComponent(selectedFilePath)}`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch file content');
      }

      const content = await response.text();
      setInlineEditMode({ path: selectedFilePath, content });
      setEditContent(content);

    } catch (error) {
      console.error('Failed to load file for editing:', error);
      toast.error('Failed to load file for editing');
    }
  }, [selectedFilePath, sandboxId, session?.access_token]);

  // Save inline edit with refetch
  const handleSaveEdit = useCallback(async () => {
    if (!inlineEditMode || !session?.access_token) return;

    setIsSavingEdit(true);
    try {
      const blob = new Blob([editContent], { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', blob, inlineEditMode.path.split('/').pop() || 'file');
      formData.append('path', inlineEditMode.path);

      const response = await fetch(
        `${API_URL}/sandboxes/${sandboxId}/files`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save file');
      }

      // Clear cache to force reload
      FileCache.delete(`${sandboxId}:${inlineEditMode.path}:text`);
      FileCache.delete(`${sandboxId}:${inlineEditMode.path}:blob`);
      FileCache.delete(`${sandboxId}:${inlineEditMode.path}:json`);
      
      // Refetch both the file list and the specific file content
      await Promise.all([
        refetchFiles(),
        refetchFileContent()
      ]);
      
      toast.success('File saved successfully');
      
      // Exit edit mode
      setInlineEditMode(null);
      setEditContent('');

    } catch (error) {
      console.error('Save failed:', error);
      toast.error(`Failed to save: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSavingEdit(false);
    }
  }, [inlineEditMode, editContent, sandboxId, session?.access_token, refetchFiles, refetchFileContent]);

  // Cancel inline edit
  const handleCancelEdit = useCallback(() => {
    setInlineEditMode(null);
    setEditContent('');
  }, []);

  // Edit file function (for dropdown menu action)
  const handleEditFile = useCallback(async (filePath: string) => {
    // First open the file, then start editing
    const file = filteredFiles.find(f => f.path === filePath);
    if (file && !file.is_dir) {
      await openFile(file);
      // Small delay to ensure file is loaded
      setTimeout(() => handleStartEdit(), 100);
    }
  }, [filteredFiles, handleStartEdit]);

  // Recursive function to discover all files in the workspace
  const discoverAllFiles = useCallback(async (
    startPath: string = '/workspace'
  ): Promise<{ files: FileInfo[], totalSize: number }> => {
    const allFiles: FileInfo[] = [];
    let totalSize = 0;
    const visited = new Set<string>();

    const exploreDirectory = async (dirPath: string) => {
      if (visited.has(dirPath)) return;
      visited.add(dirPath);

      try {
        console.log(`[DOWNLOAD ALL] Exploring directory: ${dirPath}`);
        const files = await listSandboxFiles(sandboxId, dirPath);

        for (const file of files) {
          if (file.is_dir) {
            // Recursively explore subdirectories
            await exploreDirectory(file.path);
          } else {
            // Add file to collection
            allFiles.push(file);
            totalSize += file.size || 0;
          }
        }
      } catch (error) {
        console.error(`[DOWNLOAD ALL] Error exploring directory ${dirPath}:`, error);
        toast.error(`Failed to read directory: ${dirPath}`);
      }
    };

    await exploreDirectory(startPath);

    console.log(`[DOWNLOAD ALL] Discovered ${allFiles.length} files, total size: ${totalSize} bytes`);
    return { files: allFiles, totalSize };
  }, [sandboxId]);

  // Function to download all files as a zip
  const handleDownloadAll = useCallback(async () => {
    if (!session?.access_token || isDownloadingAll) return;

    try {
      setIsDownloadingAll(true);
      setDownloadProgress({ current: 0, total: 0, currentFile: 'Discovering files...' });

      // Step 1: Discover all files
      const { files } = await discoverAllFiles();

      if (files.length === 0) {
        toast.error('No files found to download');
        return;
      }

      console.log(`[DOWNLOAD ALL] Starting download of ${files.length} files`);

      // Step 2: Create zip and load files
      const zip = new JSZip();
      setDownloadProgress({ current: 0, total: files.length, currentFile: 'Creating archive...' });

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const relativePath = file.path.replace(/^\/workspace\//, ''); // Remove /workspace/ prefix

        setDownloadProgress({
          current: i + 1,
          total: files.length,
          currentFile: relativePath
        });

        try {
          // Determine content type for proper loading
          const contentType = FileCache.getContentTypeFromPath(file.path);

          // Check cache first
          const cacheKey = `${sandboxId}:${file.path}:${contentType}`;
          let content = FileCache.get(cacheKey);

          if (!content) {
            // Load from server if not cached
            console.log(`[DOWNLOAD ALL] Loading file from server: ${file.path}`);
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/sandboxes/${sandboxId}/files/content?path=${encodeURIComponent(file.path)}`,
              {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
              }
            );

            if (!response.ok) {
              console.warn(`[DOWNLOAD ALL] Failed to load file: ${file.path} (${response.status})`);
              continue; // Skip this file and continue with others
            }

            if (contentType === 'blob') {
              content = await response.blob();
            } else if (contentType === 'json') {
              content = JSON.stringify(await response.json(), null, 2);
            } else {
              content = await response.text();
            }

            // Cache the content
            FileCache.set(cacheKey, content);
          }

          // Add to zip with proper structure
          if (content instanceof Blob) {
            zip.file(relativePath, content);
          } else if (typeof content === 'string') {
            // Handle blob URLs by fetching the actual content
            if (content.startsWith('blob:')) {
              try {
                const blobResponse = await fetch(content);
                const blobContent = await blobResponse.blob();
                zip.file(relativePath, blobContent);
              } catch (blobError) {
                console.warn(`[DOWNLOAD ALL] Failed to fetch blob content for: ${file.path}`, blobError);
                // Fallback: try to fetch from server directly
                const fallbackResponse = await fetch(
                  `${process.env.NEXT_PUBLIC_BACKEND_URL}/sandboxes/${sandboxId}/files/content?path=${encodeURIComponent(file.path)}`,
                  { headers: { 'Authorization': `Bearer ${session.access_token}` } }
                );
                if (fallbackResponse.ok) {
                  const fallbackBlob = await fallbackResponse.blob();
                  zip.file(relativePath, fallbackBlob);
                }
              }
            } else {
              // Regular text content
              zip.file(relativePath, content);
            }
          } else {
            // Handle other content types (convert to JSON string)
            zip.file(relativePath, JSON.stringify(content, null, 2));
          }

          console.log(`[DOWNLOAD ALL] Added to zip: ${relativePath} (${i + 1}/${files.length})`);

        } catch (fileError) {
          console.error(`[DOWNLOAD ALL] Error processing file ${file.path}:`, fileError);
          // Continue with other files
        }
      }

      // Step 3: Generate and download the zip
      setDownloadProgress({
        current: files.length,
        total: files.length,
        currentFile: 'Generating zip file...'
      });

      console.log('[DOWNLOAD ALL] Generating zip file...');
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // Download the zip file
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `workspace-${sandboxId}-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      toast.success(`Downloaded ${files.length} files as zip archive`);
      console.log(`[DOWNLOAD ALL] Successfully created zip with ${files.length} files`);

    } catch (error) {
      console.error('[DOWNLOAD ALL] Error creating zip:', error);
      toast.error(`Failed to create zip archive: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsDownloadingAll(false);
      setDownloadProgress(null);
    }
  }, [sandboxId, session?.access_token, isDownloadingAll, discoverAllFiles]);

  // Helper function to check if a value is a Blob (type-safe version of instanceof)
  const isBlob = (value: any): value is Blob => {
    return value instanceof Blob;
  };

  // Helper function to clear the selected file
  const clearSelectedFile = useCallback(() => {
    console.log(`[FILE VIEWER DEBUG] clearSelectedFile called, isFileListMode: ${isFileListMode}`);
    setSelectedFilePath(null);
    setRawContent(null);
    setTextContentForRenderer(null); // Clear derived text content
    setBlobUrlForRenderer(null); // Clear derived blob URL
    setContentError(null);
    setInlineEditMode(null); // Clear edit mode
    setEditContent('');
    // Only reset file list mode index when not in file list mode
    if (!isFileListMode) {
      console.log(`[FILE VIEWER DEBUG] Resetting currentFileIndex in clearSelectedFile`);
      setCurrentFileIndex(-1);
    } else {
      console.log(`[FILE VIEWER DEBUG] Keeping currentFileIndex in clearSelectedFile because in file list mode`);
    }
  }, [isFileListMode]);

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

      // Only reset file index if we're NOT in file list mode or the file is not in the list
      if (!isFileListMode || !filePathList?.includes(file.path)) {
        console.log(`[FILE VIEWER DEBUG] Resetting currentFileIndex because not in file list mode or file not in list`);
        setCurrentFileIndex(-1);
      } else {
        console.log(`[FILE VIEWER DEBUG] Keeping currentFileIndex because file is in file list mode`);
      }

      // The useFileContentQuery hook will automatically handle loading the content
      // No need to manually fetch here - React Query will handle it
    },
    [
      selectedFilePath,
      clearSelectedFile,
      normalizePath,
      isFileListMode,
      filePathList,
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
      // Clear selections when navigating
      setSelectedFiles([]);
      setMultiSelectMode(false);

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
      setSelectedFiles([]);
      setMultiSelectMode(false);
      setCurrentPath(normalizedPath);
    },
    [normalizePath, clearSelectedFile],
  );

  // Helper function to navigate to home
  const navigateHome = useCallback(() => {
    // Always navigate home when clicked to ensure consistent behavior
    console.log('[FILE VIEWER] Navigating home from:', currentPath);

    clearSelectedFile();
    setSelectedFiles([]);
    setMultiSelectMode(false);
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
  const _directlyAccessCache = useCallback(
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

  // Navigation functions for file list mode
  const navigateToFileByIndex = useCallback((index: number) => {
    console.log('[FILE VIEWER DEBUG] navigateToFileByIndex called:', {
      index,
      isFileListMode,
      filePathList,
      filePathListLength: filePathList?.length
    });

    if (!isFileListMode || !filePathList || index < 0 || index >= filePathList.length) {
      console.log('[FILE VIEWER DEBUG] navigateToFileByIndex early return - invalid conditions');
      return;
    }

    const filePath = filePathList[index];
    console.log('[FILE VIEWER DEBUG] Setting currentFileIndex to:', index, 'for file:', filePath);
    setCurrentFileIndex(index);

    // Create a temporary FileInfo object for the file
    const fileName = filePath.split('/').pop() || '';
    const normalizedPath = normalizePath(filePath);

    const fileInfo: FileInfo = {
      name: fileName,
      path: normalizedPath,
      is_dir: false,
      size: 0,
      mod_time: new Date().toISOString(),
    };

    openFile(fileInfo);
  }, [isFileListMode, filePathList, normalizePath, openFile]);

  const navigatePrevious = useCallback(() => {
    if (currentFileIndex > 0) {
      navigateToFileByIndex(currentFileIndex - 1);
    }
  }, [currentFileIndex, navigateToFileByIndex]);

  const navigateNext = useCallback(() => {
    if (isFileListMode && filePathList && currentFileIndex < filePathList.length - 1) {
      navigateToFileByIndex(currentFileIndex + 1);
    }
  }, [currentFileIndex, isFileListMode, filePathList, navigateToFileByIndex]);

  // Handle initial file path - Runs ONLY ONCE on open if initialFilePath is provided
  useEffect(() => {
    // Only run if modal is open, initial path is provided, AND it hasn't been processed yet
    if (open && safeInitialFilePath && !initialPathProcessed) {
      console.log(
        `[FILE VIEWER] useEffect[initialFilePath]: Processing initial path: ${safeInitialFilePath}`,
      );

      // If we're in file list mode, find the index and navigate to it
      if (isFileListMode && filePathList) {
        console.log('[FILE VIEWER DEBUG] Initial file path - file list mode detected:', {
          isFileListMode,
          filePathList,
          safeInitialFilePath,
          filePathListLength: filePathList.length
        });

        const normalizedInitialPath = normalizePath(safeInitialFilePath);
        const index = filePathList.findIndex(path => normalizePath(path) === normalizedInitialPath);

        console.log('[FILE VIEWER DEBUG] Found index for initial file:', {
          normalizedInitialPath,
          index,
          foundPath: index !== -1 ? filePathList[index] : 'not found'
        });

        if (index !== -1) {
          console.log(`[FILE VIEWER] File list mode: navigating to index ${index} for ${normalizedInitialPath}`);
          navigateToFileByIndex(index);
          setInitialPathProcessed(true);
          return;
        }
      }

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
  }, [open, safeInitialFilePath, initialPathProcessed, normalizePath, currentPath, openFile, isFileListMode, filePathList, navigateToFileByIndex]);

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
      } else if (typeof cachedFileContent === 'object') {
        // convert to json string if file_contents is a object
        const jsonString = JSON.stringify(cachedFileContent, null, 2);
        console.log(`[FILE VIEWER] Setting text content for object file: ${selectedFilePath}`);
        setTextContentForRenderer(jsonString);
        setBlobUrlForRenderer(null);
      }
      else {
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
      if (blobUrlForRenderer && !isDownloading && !activeDownloadUrls.current.has(blobUrlForRenderer)) {
        console.log(`[FILE VIEWER] Revoking blob URL on cleanup: ${blobUrlForRenderer}`);
        URL.revokeObjectURL(blobUrlForRenderer);
      }
    };
  }, [blobUrlForRenderer, isDownloading]);

  // Keyboard navigation
  useEffect(() => {
    if (!open || !isFileListMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigatePrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, isFileListMode, navigatePrevious, navigateNext]);

  // Handle modal close
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        console.log('[FILE VIEWER] handleOpenChange: Modal closing, resetting state.');

        // Only revoke if not downloading and not an active download URL
        if (blobUrlForRenderer && !isDownloading && !activeDownloadUrls.current.has(blobUrlForRenderer)) {
          console.log(`[FILE VIEWER] Manually revoking blob URL on modal close: ${blobUrlForRenderer}`);
          URL.revokeObjectURL(blobUrlForRenderer);
        }

        clearSelectedFile();
        setCurrentPath('/workspace');
        // React Query will handle clearing the files data
        setInitialPathProcessed(false);
        setIsInitialLoad(true);
        setCurrentFileIndex(-1); // Reset file index

        // Reset download all state
        setIsDownloadingAll(false);
        setDownloadProgress(null);

        // Reset enhanced state
        setSelectedFiles([]);
        setMultiSelectMode(false);
        setSearchQuery('');
        setExpandedFolders(new Set(['/workspace']));
        setLoadingFolders(new Set());
        setFolderContents(new Map());
        setInlineEditMode(null);
        setEditContent('');
        
        // Reset modal states
        setRenameModal({ open: false, file: null });
        setDeleteModal({ open: false, file: null });
        setMultiDeleteModal({ open: false, items: [] });
      }
      onOpenChange(open);
    },
    [onOpenChange, clearSelectedFile, setIsInitialLoad, blobUrlForRenderer, isDownloading],
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
        const _baseUrl = window.location.origin;

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

  // Handle file download - streamlined for performance
  const handleDownload = async () => {
    if (!selectedFilePath || isDownloading) return;

    try {
      setIsDownloading(true);

      // Get file metadata
      const fileName = selectedFilePath.split('/').pop() || 'file';
      const mimeType = FileCache.getMimeTypeFromPath?.(selectedFilePath) || 'application/octet-stream';

      // Use rawContent if available
      if (rawContent) {
        let blob: Blob;

        if (typeof rawContent === 'string') {
          if (rawContent.startsWith('blob:')) {
            // If it's a blob URL, get directly from server to avoid CORS issues
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/sandboxes/${sandboxId}/files/content?path=${encodeURIComponent(selectedFilePath)}`,
              { headers: { 'Authorization': `Bearer ${session?.access_token}` } }
            );

            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            blob = await response.blob();
          } else {
            // Text content
            blob = new Blob([rawContent], { type: mimeType });
          }
        } else if (rawContent instanceof Blob) {
          // Already a blob
          blob = rawContent;
        } else {
          // Unknown format, stringify
          blob = new Blob([JSON.stringify(rawContent)], { type: 'application/json' });
        }

        // Ensure correct MIME type
        if (blob.type !== mimeType) {
          blob = new Blob([blob], { type: mimeType });
        }

        downloadBlob(blob, fileName);
        return;
      }

      // Get from server if no raw content
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/sandboxes/${sandboxId}/files/content?path=${encodeURIComponent(selectedFilePath)}`,
        { headers: { 'Authorization': `Bearer ${session?.access_token}` } }
      );

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const blob = await response.blob();
      const finalBlob = new Blob([blob], { type: mimeType });
      downloadBlob(finalBlob, fileName);

    } catch (error) {
      console.error('[FILE VIEWER] Download error:', error);
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

  // Handle file upload - Define after helpers
  const handleUpload = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // Process uploaded file - Define after helpers
  const processUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      setIsUploading(true);

      try {
        // Normalize filename to NFC
        const normalizedName = normalizeFilenameToNFC(file.name);
        const uploadPath = `${currentPath}/${normalizedName}`;

        const formData = new FormData();
        // If the filename was normalized, append with the normalized name in the field name
        // The server will use the path parameter for the actual filename
        formData.append('file', file, normalizedName);
        formData.append('path', uploadPath);

        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error('No access token available');
        }

        const response = await fetch(
          `${API_URL}/sandboxes/${sandboxId}/files`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            body: formData,
          },
        );

        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || 'Upload failed');
        }

        // Reload the file list using React Query
        await refetchFiles();

        toast.success(`Uploaded: ${normalizedName}`);
      } catch (error) {
        console.error('Upload failed:', error);
        toast.error(
          `Upload failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      } finally {
        setIsUploading(false);
        if (event.target) event.target.value = '';
      }
    },
    [currentPath, sandboxId, refetchFiles],
  );

  // Reset file list mode when modal opens without filePathList
  useEffect(() => {
    if (open && !filePathList) {
      setCurrentFileIndex(-1);
    }
  }, [open, filePathList]);

  // Helper functions for file actions - Updated to allow only file operations
  const canRenameFile = useCallback((file: FileInfo) => {
    return !file.is_dir; // Only allow renaming files
  }, []);

  const canEditFile = useCallback((file: FileInfo) => {
    if (file.is_dir) return false; // Can't edit folders
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const editableExtensions = ['txt', 'md', 'js', 'ts', 'jsx', 'tsx', 'css', 'html', 'json', 'yml', 'yaml', 'xml', 'svg', 'py', 'java', 'cpp', 'c', 'h', 'php', 'rb', 'go', 'rs', 'sh', 'bat', 'sql', 'r', 'scala', 'kt', 'swift', 'dart', 'vue', 'scss', 'sass', 'less', 'config', 'conf', 'ini', 'env', 'gitignore', 'dockerfile', 'makefile', 'readme'];
    return editableExtensions.includes(ext) || !ext; // Allow files without extensions
  }, []);

  const canDeleteFile = useCallback((file: FileInfo) => {
    return !file.is_dir; // Only allow deleting files
  }, []);

  // --- Render --- //
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[1200px] w-[95vw] h-[90vh] max-h-[900px] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 py-2 border-b flex-shrink-0 flex flex-row gap-4 items-center">
          <DialogTitle className="text-lg font-semibold">
            Workspace Files
          </DialogTitle>

          {/* Download progress display */}
          {downloadProgress && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Loader className="h-3 w-3 animate-spin" />
                <span>
                  {downloadProgress.total > 0
                    ? `${downloadProgress.current}/${downloadProgress.total}`
                    : 'Preparing...'
                  }
                </span>
              </div>
              <span className="max-w-[200px] truncate">
                {downloadProgress.currentFile}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* View mode toggle - only show when not viewing a file */}
            {!selectedFilePath && (
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 px-3"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 px-3"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Navigation arrows for file list mode */}
            {(() => {
              // Debug logging
              console.log('[FILE VIEWER DEBUG] Navigation visibility check:', {
                isFileListMode,
                selectedFilePath,
                filePathList,
                filePathListLength: filePathList?.length,
                currentFileIndex,
                shouldShow: isFileListMode && selectedFilePath && filePathList && filePathList.length > 1 && currentFileIndex >= 0
              });

              return isFileListMode && selectedFilePath && filePathList && filePathList.length > 1 && currentFileIndex >= 0;
            })() && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={navigatePrevious}
                    disabled={currentFileIndex <= 0}
                    className="h-8 w-8 p-0"
                    title="Previous file (←)"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                                    <div className="text-xs text-muted-foreground px-1">
                    {currentFileIndex + 1} / {(filePathList?.length || 0)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={navigateNext}
                    disabled={currentFileIndex >= (filePathList?.length || 0) - 1}
                    className="h-8 w-8 p-0"
                    title="Next file (→)"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
          </div>
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
                {getBreadcrumbSegments(currentPath).map((segment) => (
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
            {/* Search bar - only show when not viewing a file */}
            {!selectedFilePath && (
              <FileSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                className="w-64"
              />
            )}

            {selectedFilePath && (
              <>
                {/* Edit button for inline editing */}
                {canEditFile({ name: selectedFilePath.split('/').pop() || '', is_dir: false } as FileInfo) && (
                  <>
                    {inlineEditMode ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={isSavingEdit}
                          className="h-8 gap-1"
                        >
                          {isSavingEdit ? (
                            <Loader className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          <span className="hidden sm:inline">Save</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                          className="h-8 gap-1"
                        >
                          <X className="h-4 w-4" />
                          <span className="hidden sm:inline">Cancel</span>
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleStartEdit}
                        className="h-8 gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                    )}
                  </>
                )}

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

                {/* PDF export dropdown for markdown files */}
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
              <>
                {/* Download All button - only show when in home directory */}
                {currentPath === '/workspace' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadAll}
                    disabled={isDownloadingAll || isLoadingFiles}
                    className="h-8 gap-1"
                  >
                    {isDownloadingAll ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Archive className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">Download All</span>
                  </Button>
                )}

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
              </>
            )}

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={processUpload}
              disabled={isUploading}
            />
          </div>
        </div>

        {/* Bulk actions toolbar - only show when in multi-select mode */}
        {multiSelectMode && !selectedFilePath && (
          <FileToolbar
            selectedCount={selectedFiles.length}
            onDelete={handleDeleteSelected}
            onDownload={handleDownloadSelected}
            onDeselectAll={handleDeselectAll}
            disabled={isDeleting || isCreatingZip}
          />
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {selectedFilePath ? (
            /* File Viewer with Inline Editing */
            <div className="h-full w-full overflow-auto">
              {inlineEditMode ? (
                /* Inline Editor */
                <div className="h-full w-full p-4">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-full resize-none font-mono text-sm"
                    placeholder="Edit your file content here..."
                  />
                </div>
              ) : isCachedFileLoading ? (
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
              ) : filteredFiles.length === 0 ? (
                <div className="h-full w-full flex flex-col items-center justify-center">
                  <Folder className="h-12 w-12 mb-2 text-muted-foreground opacity-30" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'No files match your search' : 'Directory is empty'}
                  </p>
                  {searchQuery && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setSearchQuery('')}
                      className="mt-2"
                    >
                      Clear search
                    </Button>
                  )}
                </div>
              ) : (
                <ScrollArea className="h-full w-full p-2">
                  {viewMode === 'grid' ? (
                    /* Grid View with 3-dots menu */
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4">
                      {filteredFiles.map((file) => (
                        <div key={file.path} className="relative group">
                          {/* Checkbox - show in multi-select mode for both files and folders */}
                          {multiSelectMode && (
                            <input
                              type="checkbox"
                              checked={selectedFiles.includes(file.path)}
                              onChange={(e) => handleFileSelect(file.path, e.target.checked)}
                              className="absolute top-1 left-1 z-10"
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                          
                          {/* 3-dots menu */}
                          <div className="absolute top-1 right-1 z-10">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100 bg-background/80 backdrop-blur-sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                {/* Select/Deselect option - for both files and folders */}
                                <DropdownMenuItem onClick={() => handleFileSelect(file.path, !selectedFiles.includes(file.path))}>
                                  {selectedFiles.includes(file.path) ? 'Deselect' : 'Select'}
                                </DropdownMenuItem>
                                
                                {/* Download option - different for files vs folders */}
                                {file.is_dir ? (
                                  <DropdownMenuItem 
                                    onClick={() => handleDownloadFolderAsZip(file)}
                                    disabled={isCreatingZip}
                                  >
                                    Download as ZIP
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    onClick={() => handleDownloadFile(file)}
                                    disabled={isDownloading}
                                  >
                                    Download
                                  </DropdownMenuItem>
                                )}
                                
                                {/* Rename option - only for files */}
                                {canRenameFile(file) && (
                                  <DropdownMenuItem onClick={() => handleTriggerRename(file)}>
                                    Rename
                                  </DropdownMenuItem>
                                )}
                                
                                {/* Edit option - only for files */}
                                {/* {canEditFile(file) && (
                                  <DropdownMenuItem onClick={() => handleEditFile(file.path)}>
                                    Edit
                                  </DropdownMenuItem>
                                )} */}
                                
                                {/* Delete option - only for files */}
                                {canDeleteFile(file) && (
                                  <DropdownMenuItem 
                                    onClick={() => handleTriggerDelete(file)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <button
                            className={`group flex flex-col items-center p-3 rounded-2xl border hover:bg-muted/50 transition-colors w-full ${
                              selectedFilePath === file.path
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
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* List View - VSCode-like Tree Structure */
                    <div className="p-4">
                      <FileListView
                        files={filteredFiles}
                        selectedFiles={selectedFiles}
                        multiSelectMode={multiSelectMode}
                        expandedFolders={expandedFolders}
                        loadingFolders={loadingFolders}
                        folderContents={folderContents}
                        onSelectFile={handleFileSelect}
                        onToggleExpansion={toggleFolderExpansion}
                        onRenameFile={handleTriggerRename}
                        onDeleteFile={handleTriggerDelete}
                        onEditFile={handleEditFile}
                        onOpenFile={(filePath) => {
                          const file = filteredFiles.find(f => f.path === filePath);
                          if (file) {
                            if (file.is_dir) {
                              navigateToFolder(file);
                            } else {
                              openFile(file);
                            }
                          }
                        }}
                        canRename={canRenameFile}
                        canEdit={canEditFile}
                        canDelete={canDeleteFile}
                        onDownloadFile={handleDownloadFile}
                        onDownloadFolder={handleDownloadFolderAsZip}
                      />
                    </div>
                  )}
                </ScrollArea>
              )}
            </div>
          )}
        </div>
      </DialogContent>

      {/* Rename Modal - Files Only */}
      <FileRenameModal
        open={renameModal.open}
        initialName={renameModal.file?.name || ''}
        onSave={handleRenameModalSave}
        onCancel={() => setRenameModal({ open: false, file: null })}
      />

      {/* Single Delete Confirmation Dialog - Files Only */}
      <Dialog open={deleteModal.open} onOpenChange={(open) => setDeleteModal({ open, file: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete File
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to delete <strong>{deleteModal.file?.name}</strong>?
            <p className="text-sm text-muted-foreground mt-2">
              This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setDeleteModal({ open: false, file: null })}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Multi-Delete Confirmation Dialog - Files Only */}
      <Dialog open={multiDeleteModal.open} onOpenChange={(open) => setMultiDeleteModal({ open, items: [] })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Multiple Files
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete <strong>{multiDeleteModal.items.length}</strong> selected file(s)?</p>
            <p className="text-sm text-muted-foreground mt-2">
              This action cannot be undone.
            </p>
            
            {/* Show first few files being deleted */}
            <div className="mt-3 max-h-32 overflow-y-auto">
              <p className="text-sm font-medium mb-1">Files to delete:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {multiDeleteModal.items.slice(0, 10).map(path => {
                  const file = filteredFiles.find(f => f.path === path);
                  return (
                    <li key={path} className="flex items-center gap-1">
                      <File className="h-3 w-3" />
                      <span className="truncate">{file?.name || path.split('/').pop()}</span>
                    </li>
                  );
                })}
                {multiDeleteModal.items.length > 10 && (
                  <li className="text-xs italic">... and {multiDeleteModal.items.length - 10} more files</li>
                )}
              </ul>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setMultiDeleteModal({ open: false, items: [] })}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmMultiDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                `Delete ${multiDeleteModal.items.length} Files`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

