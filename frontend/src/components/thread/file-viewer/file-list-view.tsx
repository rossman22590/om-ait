import React from 'react';
import { FileRow } from './file-row';
import { cn } from '@/lib/utils';
import { FileInfo } from '@/lib/api';

interface FileListViewProps {
  files: FileInfo[];
  selectedFiles: string[];
  multiSelectMode: boolean;
  expandedFolders: Set<string>;
  loadingFolders: Set<string>;
  folderContents: Map<string, FileInfo[]>;
  onSelectFile: (filePath: string, checked: boolean) => void;
  onToggleExpansion: (folderPath: string) => void;
  onRenameFile: (file: FileInfo) => void;
  onDeleteFile: (file: FileInfo) => void;
  onEditFile: (filePath: string) => void;
  onOpenFile: (filePath: string) => void;
  canRename?: (file: FileInfo) => boolean;
  canEdit?: (file: FileInfo) => boolean;
  canDelete?: (file: FileInfo) => boolean;  // Added this prop
  onDownloadFile?: (file: FileInfo) => void;  // Added this prop
  onDownloadFolder?: (file: FileInfo) => void;  // Added this prop
  className?: string;
}

export function FileListView({
  files,
  selectedFiles,
  multiSelectMode,
  expandedFolders,
  loadingFolders,
  folderContents,
  onSelectFile,
  onToggleExpansion,
  onRenameFile,
  onDeleteFile,
  onEditFile,
  onOpenFile,
  canRename,
  canEdit,
  canDelete,  // Added this prop
  onDownloadFile,  // Added this prop
  onDownloadFolder,  // Added this prop
  className = "",
}: FileListViewProps) {
  
  // Recursively render tree structure
  const renderTreeNode = (file: FileInfo, level: number = 0): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];
    
    // Render the current file/folder
    nodes.push(
      <FileRow
        key={file.path}
        file={file}
        level={level}
        isSelected={selectedFiles.includes(file.path)}
        isExpanded={file.is_dir ? expandedFolders.has(file.path) : false}
        isLoading={file.is_dir ? loadingFolders.has(file.path) : false}
        multiSelectMode={multiSelectMode}
        onSelect={checked => onSelectFile(file.path, checked)}
        onToggleExpansion={() => file.is_dir && onToggleExpansion(file.path)}
        onRename={(file) => onRenameFile(file)}
        onDelete={(file) => onDeleteFile(file)}
        onEdit={() => onEditFile(file.path)}
        onOpen={() => onOpenFile(file.path)}
        canRename={canRename?.(file)}
        canEdit={canEdit?.(file)}
        canDelete={canDelete?.(file)}  // Pass the canDelete prop
        onDownloadFile={onDownloadFile}  // Pass the download handlers
        onDownloadFolder={onDownloadFolder}
      />
    );
    
    // If it's an expanded folder, render its children
    if (file.is_dir && expandedFolders.has(file.path) && folderContents.has(file.path)) {
      const children = folderContents.get(file.path) || [];
      
      // Sort children: directories first, then by name
      const sortedChildren = [...children].sort((a, b) => {
        if (a.is_dir && !b.is_dir) return -1;
        if (!a.is_dir && b.is_dir) return 1;
        return a.name.localeCompare(b.name);
      });
      
      // Recursively render children
      sortedChildren.forEach(child => {
        nodes.push(...renderTreeNode(child, level + 1));
      });
    }
    
    return nodes;
  };

  // Sort root files: directories first, then by name
  const sortedFiles = [...files].sort((a, b) => {
    if (a.is_dir && !b.is_dir) return -1;
    if (!a.is_dir && b.is_dir) return 1;
    return a.name.localeCompare(b.name);
  });

  // Render all nodes
  const allNodes: React.ReactNode[] = [];
  sortedFiles.forEach(file => {
    allNodes.push(...renderTreeNode(file, 0));
  });

  return (
    <div className={cn("flex flex-col gap-0", className)}>
      {allNodes}
    </div>
  );
}
