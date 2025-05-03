# Suna Changelog

This document tracks significant updates and improvements to the Suna platform.

## May 2, 2025

### UI Improvements
- **Workspace Files Modal**:
  - Restored original width settings (`sm:max-w-[90vw] md:max-w-[1200px] w-[95vw]`) to improve visibility of files
  - Improved button placement and spacing for better usability
  - Enhanced search functionality with better styling and clear button

  ```tsx
  // Before: Limited width
  <DialogContent className="max-w-4xl h-[85vh] p-0 gap-0 flex flex-col">

  // After: Restored wider layout
  <DialogContent className="sm:max-w-[90vw] md:max-w-[1200px] w-[95vw] h-[90vh] max-h-[900px] p-0 gap-0 flex flex-col">
  ```

### Thread UI Fixes
- **Tool Call Navigation**:
  - Fixed issue where viewing previous tool calls would auto-jump to the latest tool call during agent operation
  - Implemented new state management to track manually selected tool calls
  - Added conditional auto-scrolling that respects user navigation choices
  - Improved handling of multiple state updates when stopping agent execution

  ```tsx
  // Before: Always jumping to latest tool call
  if (isSidePanelOpen && !userClosedPanelRef.current) {
      // Always jump to the latest tool call index
      setCurrentToolIndex(historicalToolPairs.length - 1);
  }

  // After: Respecting user's manual selection
  // 1. Added state to track manual selections
  const [manuallySelectedToolCall, setManuallySelectedToolCall] = useState(false);

  // 2. Modified the auto-jump logic
  if (isSidePanelOpen && !userClosedPanelRef.current) {
      // Only jump to latest if user hasn't manually selected a tool call
      if (!manuallySelectedToolCall) {
          setCurrentToolIndex(historicalToolPairs.length - 1);
      }
  }

  // 3. Set flag when user manually selects a tool call
  const handleToolClick = useCallback((clickedAssistantMessageId: string | null, clickedToolName: string) => {
    // Other code...
    setManuallySelectedToolCall(true);
    // Other code...
  }, [/* dependencies */]);

  // 4. Reset flag when panel closes
  useEffect(() => {
    if (!isSidePanelOpen) {
      setAutoOpenedPanel(false);
      setManuallySelectedToolCall(false);
    }
  }, [isSidePanelOpen]);
  ```

- **Thread Public Status Persistence**:
  - Fixed issue where thread public status was not persisted correctly
  - Added `is_public` field to API response to ensure UI state matches database

  ```tsx
  // Before: is_public field missing from API response
  const mappedThreads: Thread[] = (data || []).map(thread => ({
    thread_id: thread.thread_id,
    account_id: thread.account_id,
    project_id: thread.project_id,
    created_at: thread.created_at,
    updated_at: thread.updated_at
  }));

  // After: Added is_public field to ensure UI state matches database
  const mappedThreads: Thread[] = (data || []).map(thread => ({
    thread_id: thread.thread_id,
    account_id: thread.account_id,
    project_id: thread.project_id,
    created_at: thread.created_at,
    updated_at: thread.updated_at,
    is_public: thread.is_public || false  // Added is_public to ensure it's passed to frontend
  }));
  ```

- **Thread Sharing Improvements**:
  - Added reliable share dialog for public threads
  - Fixed UI issues with thread public status toggling
  - Improved user experience by automatically opening share dialog when making threads public
  - Added dedicated share button for threads that are already public
  - Enhanced clipboard integration for easy sharing

  ```tsx
  // Implementation of the share dialog
  <AlertDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Share Thread</AlertDialogTitle>
        <AlertDialogDescription>
          {threadToShare && (
            <>
              Share <strong>{threadToShare.projectName}</strong> with others using this link:
            </>
          )}
        </AlertDialogDescription>
      </AlertDialogHeader>
      
      {/* Keep the div outside of AlertDialogDescription to avoid nesting div inside p */}
      {threadToShare && (
        <div className="mt-4 px-6 flex">
          <input
            type="text"
            value={shareLink}
            readOnly
            className="flex-1 rounded-l-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
          />
          <button
            onClick={copyShareLink}
            className="rounded-r-md border border-l-0 border-input bg-accent px-3 py-2 text-sm font-medium hover:bg-accent/80"
          >
            Copy
          </button>
        </div>
      )}
      
      <AlertDialogFooter>
        <AlertDialogAction>Close</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  ```

  ```tsx
  // Function to toggle public status with improved UX
  const togglePublicStatus = async (thread: ThreadWithProject) => {
    try {
      // If already public, just open share dialog
      if (thread.isPublic) {
        openShareDialog(thread);
        return;
      }
      
      const newStatus = true; // We're making it public
      const result = await toggleThreadPublicStatus(thread.threadId, newStatus);
      
      if (result) {
        toast.success("Thread is now public");
        
        // Update in the UI
        setThreads(currentThreads => 
          currentThreads.map(t => {
            if (t.threadId === thread.threadId) {
              return {
                ...t,
                isPublic: true
              };
            }
            return t;
          })
        );
        
        // Open share dialog
        openShareDialog({...thread, isPublic: true});
      } else {
        toast.error("Failed to make thread public");
      }
    } catch (error) {
      console.error('Error making thread public:', error);
      toast.error('Failed to update thread status. Please try again.');
    }
  };
  ```

### Sandbox Enhancements
- **File Downloads**:
  - Added ZIP file download functionality in the Workspace Files modal
  - Implemented client-side ZIP creation using JSZip for bundling multiple files
  - Created progress indicators and success/error notifications for file operations
  - Improved error handling during file downloads and ZIP creation
  - Enhanced folder download functionality with recursive processing up to 4 levels deep
  - Implemented robust 3-tier approach to ensure all files are captured in folder downloads
  - Added special handling for website folder and consistently inconsistent API responses
  - Improved file path handling to maintain proper folder structure in downloaded zip files

  ```tsx
  // Multi-tier folder processing strategy for robust file downloads
  const processFolderContents = async (
    folderPath: string,
    zipFolder: JSZip,
    headers: Record<string, string>,
    depth: number
  ): Promise<number> => {
    // Limit recursion depth
    const MAX_DEPTH = 4;
    if (depth >= MAX_DEPTH) {
      console.log(`[DEBUG] Reached maximum folder depth (${MAX_DEPTH}) at ${folderPath}`);
      return 0;
    }
    
    // Try multiple approaches to get all files
    
    // APPROACH 1: Using the list files API
    let folderContents: FileInfo[] = [];
    let apiSuccess = false;
    
    try {
      // Directly call the API to list files
      const folderUrl = `${API_URL}/sandboxes/${sandboxId}/files?path=${encodeURIComponent(folderPath)}`;
      const response = await fetch(folderUrl, { headers });
      
      if (response.ok) {
        const responseText = await response.text();
        
        if (responseText && responseText.trim() !== '') {
          const data = JSON.parse(responseText);
          
          // API sometimes returns array, sometimes object
          if (Array.isArray(data)) {
            folderContents = data;
            apiSuccess = true;
          } else if (typeof data === 'object' && data !== null) {
            // Try to extract files from object response
            if (data.files && Array.isArray(data.files)) {
              folderContents = data.files;
              apiSuccess = true;
            } else {
              // Convert object keys to files
              const paths = Object.keys(data);
              folderContents = paths.map(path => ({
                name: path.split('/').pop() || '',
                path,
                is_dir: false,
                size: 0,
                mod_time: new Date().toISOString()
              }));
              apiSuccess = true;
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error calling list files API for ${folderPath}:`, error);
    }

    // APPROACH 2 & 3: Additional fallback strategies...
    
    // Process all discovered files and folders
    const files = folderContents.filter(file => !file.is_dir);
    const subdirs = folderContents.filter(file => file.is_dir);
    
    let processedFiles = 0;
    
    // Add files to the zip
    for (const file of files) {
      try {
        const fileUrl = new URL(`${API_URL}/sandboxes/${sandboxId}/files/content`);
        fileUrl.searchParams.append('path', file.path);
        
        const fileResponse = await fetch(fileUrl.toString(), { headers });
        
        if (fileResponse.ok) {
          const blob = await fileResponse.blob();
          zipFolder.file(file.name, blob);
          processedFiles++;
        }
      } catch (error) {
        console.error(`Error adding file ${file.path} to zip:`, error);
      }
    }
    
    // Process subfolders recursively
    for (const dir of subdirs) {
      if (!dir.path) continue;
      
      const subfolderInZip = zipFolder.folder(dir.name);
      if (!subfolderInZip) continue;
      
      const filesInSubfolder = await processFolderContents(
        dir.path, 
        subfolderInZip, 
        headers, 
        depth + 1
      );
      processedFiles += filesInSubfolder;
    }
    
    return processedFiles;
  };
  
  // Comprehensive "Download All" implementation for files and folders
  const downloadAllFiles = useCallback(async () => {
    if (!files.length || isLoadingFiles) return;
    
    try {
      setIsDownloading(true);
      toast.info("Preparing to download files...");
      
      const zip = new JSZip();
      
      // Get authenticated session for API calls
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      // Process all visible items in the current directory
      let totalProcessed = 0;
      const processingToast = toast.loading(`Processing files...`);
      
      for (const item of files) {
        if (item.name.startsWith('.')) continue; // Skip hidden files
        
        if (item.is_dir) {
          // Process folder recursively
          const folderInZip = zip.folder(item.name);
          if (folderInZip) {
            const filesInFolder = await processFolderContents(
              item.path, 
              folderInZip, 
              headers, 
              0
            );
            totalProcessed += filesInFolder;
          }
        } else {
          // Process single file
          const fileUrl = new URL(`${API_URL}/sandboxes/${sandboxId}/files/content`);
          fileUrl.searchParams.append('path', item.path);
          
          const fileResponse = await fetch(fileUrl.toString(), { headers });
          
          if (fileResponse.ok) {
            const blob = await fileResponse.blob();
            zip.file(item.name, blob);
            totalProcessed++;
          }
        }
      }
      
      // Generate the zip file with a meaningful name
      const downloadName = currentPath === "/" 
        ? `sandbox-${sandboxId}.zip` 
        : `${currentPath.split('/').filter(Boolean).pop() || 'files'}.zip`;
      
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });
      
      // Create and trigger download
      const downloadUrl = window.URL.createObjectURL(zipBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = downloadName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success(`Downloaded ${totalProcessed} files`);
    } catch (error) {
      toast.error(`Error downloading files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloading(false);
    }
  }, [files, isLoadingFiles, sandboxId, currentPath]);
  ```

### Technical Improvements
- **State Management**:
  - Added `manuallySelectedToolCall` state to track user selections
  - Improved effect dependency arrays for better performance
  - Added proper reset mechanisms when panels are closed
  - Fixed race conditions in asynchronous operations

The thread UI improvements significantly enhance the user experience by allowing inspection of previous tool calls without being interrupted by new messages, while the file system enhancements provide more efficient ways to download multiple workspace files.
