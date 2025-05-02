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

### Sandbox Enhancements
- **File Downloads**:
  - Added ZIP file download functionality in the Workspace Files modal
  - Implemented client-side ZIP creation using JSZip for bundling multiple files
  - Created progress indicators and success/error notifications for file operations
  - Improved error handling during file downloads and ZIP creation

  ```tsx
  // ZIP file creation and download functionality
  const createAndDownloadZip = async (filesToDownload: FileInfo[]) => {
    try {
      // Create new JSZip instance
      const zip = new JSZip();
      
      // Add each file to the zip
      for (const file of filesToDownload) {
        if (file.is_dir) continue;
        
        try {
          // Get file content from API
          const content = await getFileContent(file.path, sandboxId!);
          
          // Add file to zip with relative path
          const relativePath = file.path.replace(currentPath, '').replace(/^\//, '');
          zip.file(relativePath, content);
          
          // Show progress notification
          toast.success(`Added ${file.name} to zip`);
        } catch (err) {
          toast.error(`Failed to add ${file.name} to zip: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      
      // Generate zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Create download link
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${getFolderName(currentPath) || 'files'}.zip`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download complete!');
    } catch (err) {
      toast.error(`Failed to create zip: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsDownloading(false);
    }
  };
  
  // Usage in downloadAllFiles function
  const downloadAllFiles = useCallback(async () => {
    if (!files.length || isLoadingFiles) return;
    
    try {
      setIsDownloading(true);
      toast.info("Preparing files for download...");
      
      // Filter out directories - we only want files
      const filesToDownload = files.filter(file => !file.is_dir);
      
      if (filesToDownload.length === 0) {
        toast.warning("No files to download in this directory");
        setIsDownloading(false);
        return;
      }
      
      // If there's only one file, just download it directly
      if (filesToDownload.length === 1) {
        const file = filesToDownload[0];
        await downloadSingleFile(file);
        setIsDownloading(false);
        return;
      }
      
      // For multiple files, create and download as zip
      await createAndDownloadZip(filesToDownload);
    } catch (err) {
      toast.error(`Download failed: ${err instanceof Error ? err.message : String(err)}`);
      setIsDownloading(false);
    }
  }, [files, isLoadingFiles, currentPath, sandboxId]);

### Technical Improvements
- **State Management**:
  - Added `manuallySelectedToolCall` state to track user selections
  - Improved effect dependency arrays for better performance
  - Added proper reset mechanisms when panels are closed
  - Fixed race conditions in asynchronous operations

The thread UI improvements significantly enhance the user experience by allowing inspection of previous tool calls without being interrupted by new messages, while the file system enhancements provide more efficient ways to download multiple workspace files.
