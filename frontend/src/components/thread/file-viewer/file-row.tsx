import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  File, 
  MoreHorizontal,
  Loader,
  Download,
  Archive
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileInfo } from '@/lib/api';

interface FileRowProps {
  file: FileInfo;
  level: number;
  isSelected: boolean;
  isExpanded?: boolean;
  isLoading?: boolean;
  multiSelectMode: boolean;
  onSelect: (checked: boolean) => void;
  onToggleExpansion?: () => void;
  onRename: (file: FileInfo) => void;
  onDelete: (file: FileInfo) => void;
  onEdit: () => void;
  onOpen: () => void;
  canRename?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;  // Added this prop
  onDownloadFile?: (file: FileInfo) => void;  // Added this prop
  onDownloadFolder?: (file: FileInfo) => void;  // Added this prop
}

export function FileRow({
  file,
  level,
  isSelected,
  isExpanded = false,
  isLoading = false,
  multiSelectMode,
  onSelect,
  onToggleExpansion,
  onRename,
  onDelete,
  onEdit,
  onOpen,
  canRename = true,
  canEdit = true,
  canDelete = true,  // Added this prop with default
  onDownloadFile,  // Added this prop
  onDownloadFolder,  // Added this prop
}: FileRowProps) {
  const indentStyle = {
    paddingLeft: `${level * 20 + 8}px`
  };

  return (
    <div 
      className="flex items-center hover:bg-muted/30 px-2 py-1 rounded-lg group relative min-h-[32px]"
      style={indentStyle}
    >
      {/* Expansion arrow for folders */}
      <div className="w-4 h-4 flex items-center justify-center mr-1 flex-shrink-0">
        {file.is_dir && (
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpansion?.();
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader className="h-3 w-3 animate-spin" />
            ) : isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>

      {/* Checkbox - show in multi-select mode for both files and folders */}
      {multiSelectMode && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={e => onSelect(e.target.checked)}
          className="mr-2 flex-shrink-0"
          onClick={e => e.stopPropagation()}
        />
      )}

      {/* File/Folder icon */}
      <div className="w-4 h-4 flex items-center justify-center mr-2 flex-shrink-0">
        {file.is_dir ? (
          <Folder className="h-4 w-4 text-blue-500" />
        ) : (
          <File className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* File name - clickable area */}
      <div 
        className="flex-1 min-w-0 cursor-pointer select-none"
        onClick={onOpen}
      >
        <span className="text-sm truncate block">{file.name}</span>
      </div>

      {/* Actions dropdown - show on hover or when selected */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={e => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
            {/* Select/Deselect option - for both files and folders */}
            <DropdownMenuItem onClick={() => onSelect(!isSelected)}>
              {isSelected ? 'Deselect' : 'Select'}
            </DropdownMenuItem>
            
            {/* Download option - different for files vs folders */}
            {file.is_dir ? (
              onDownloadFolder && (
                <DropdownMenuItem onClick={() => onDownloadFolder(file)}>
                  Download as ZIP
                </DropdownMenuItem>
              )
            ) : (
              onDownloadFile && (
                <DropdownMenuItem onClick={() => onDownloadFile(file)}>
                  Download
                </DropdownMenuItem>
              )
            )}
            
            {/* Rename option - only for files (based on canRename) */}
            {canRename && (
              <DropdownMenuItem onClick={() => onRename(file)}>
                Rename
              </DropdownMenuItem>
            )}
            
            {/* Edit option - only for files (based on canEdit) */}
            {canEdit && !file.is_dir && (
              <DropdownMenuItem onClick={onEdit}>
                Edit
              </DropdownMenuItem>
            )}
            
            {/* Delete option - only for files (based on canDelete) */}
            {canDelete && (
              <DropdownMenuItem 
                onClick={() => onDelete(file)}
                className="text-destructive focus:text-destructive"
              >
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
