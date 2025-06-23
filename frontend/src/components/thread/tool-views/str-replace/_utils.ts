export type DiffType = 'unchanged' | 'added' | 'removed';

export interface LineDiff {
  type: DiffType;
  oldLine: string | null;
  newLine: string | null;
  lineNumber: number;
}

export interface CharDiffPart {
  text: string;
  type: DiffType;
}

export interface DiffStats {
  additions: number;
  deletions: number;
}

import { extractFilePath } from '../utils';

export interface ExtractedData {
  filePath: string | null;
  oldStr: string | null;
  newStr: string | null;
  success?: boolean;
  timestamp?: string;
  extracted?: boolean;
}

export const extractFromNewFormat = (content: any): ExtractedData => {
  if (!content) {
    return { filePath: null, oldStr: null, newStr: null };
  }

  if (typeof content === 'string') {
    console.debug(`StrReplaceToolView: Attempting to extract from string content (length: ${content.length})`);
    
    const jsonRegex = /\{[\s\S]*?"(?:old_str|oldStr|targetContent)"[\s\S]*?"(?:new_str|newStr|replacementContent)"[\s\S]*?\}/i;
    const jsonMatch = content.match(jsonRegex);
    if (jsonMatch) {
      try {
        const jsonStr = jsonMatch[0];
        console.debug('StrReplaceToolView: Found potential JSON object:', jsonStr.substring(0, 100) + '...');
        const jsonObj = JSON.parse(jsonStr);
        
        const oldStrValue = jsonObj.old_str || jsonObj.oldStr || jsonObj.targetContent || jsonObj.target_content;
        const newStrValue = jsonObj.new_str || jsonObj.newStr || jsonObj.replacementContent || jsonObj.replacement_content;
        
        if (oldStrValue && newStrValue) {
          console.debug('StrReplaceToolView: Successfully extracted from embedded JSON');
          return {
            filePath: jsonObj.file_path || jsonObj.filePath || jsonObj.targetFile || jsonObj.target_file || null,
            oldStr: oldStrValue,
            newStr: newStrValue,
            extracted: true,
            timestamp: new Date().toISOString()
          };
        }
      } catch (e) {
        console.debug('StrReplaceToolView: Failed to parse embedded JSON:', e);
      }
    }
    
    console.debug('StrReplaceToolView: Processing string content of length', content.length);
    
    const regexPatterns = [
      // Search for TargetContent/ReplacementContent pattern in a tool call
      {
        targetPattern: /['"](?:TargetContent|target_content)['"]\s*[:=]\s*['"]([\s\S]*?)['"](?:,|\s*})/i,
        replacementPattern: /['"](?:ReplacementContent|replacement_content)['"]\s*[:=]\s*['"]([\s\S]*?)['"](?:,|\s*})/i
      },
      // Search for old_str/new_str pattern
      {
        targetPattern: /['"](?:old_str|oldStr|old_string|oldString)['"]\s*[:=]\s*['"]([\s\S]*?)['"](?:,|\s*})/i,
        replacementPattern: /['"](?:new_str|newStr|new_string|newString)['"]\s*[:=]\s*['"]([\s\S]*?)['"](?:,|\s*})/i
      }
    ];
    
    for (const patterns of regexPatterns) {
      const targetMatch = content.match(patterns.targetPattern);
      const replacementMatch = content.match(patterns.replacementPattern);
      
      if (targetMatch && replacementMatch) {
        console.debug('StrReplaceToolView: Found direct string pattern match in content');
        return {
          filePath: extractFilePath(content),
          oldStr: targetMatch[1],
          newStr: replacementMatch[1],
          success: true
        };
      }
    }
    
    console.debug('StrReplaceToolView: No pattern matches found in string content');
    
    // Try XML format extraction
    // First check for the XML tag pattern similar to file operations
    const xmlPatterns = [
      /<str-replace[^>]*\s+file_path=['"]([^'"]+)['"]>([\s\S]*?)<\/str-replace>/i,
      /<str-replace[^>]*>([\s\S]*?)<\/str-replace>/i,
      /<tool\s+name=['"]str-replace['"][^>]*>([\s\S]*?)<\/tool>/i
    ];
    
    for (const pattern of xmlPatterns) {
      const xmlMatch = content.match(pattern);
      if (xmlMatch) {
        console.debug('StrReplaceToolView: Found XML format match');
        
        // Look for file_path in the tag attributes
        const filePathMatch = xmlMatch[0].match(/file_path=['"]([^'"]+)['"]/);
        const filePath = filePathMatch ? filePathMatch[1] : extractFilePath(content);
        
        // Check for parameter tags inside
        const oldStrMatch = xmlMatch[0].match(/<parameter\s+name=['"]old_str['"]>([\s\S]*?)<\/parameter>/) ||
                          xmlMatch[0].match(/old_str=['"]([^'"]+)['"]/);
        const newStrMatch = xmlMatch[0].match(/<parameter\s+name=['"]new_str['"]>([\s\S]*?)<\/parameter>/) ||
                          xmlMatch[0].match(/new_str=['"]([^'"]+)['"]/);
        
        if (oldStrMatch && newStrMatch) {
          return {
            filePath,
            oldStr: oldStrMatch[1],
            newStr: newStrMatch[1],
            success: true
          };
        }
      }
    }
    
    // Look for markdown-style replacement description
    const oldStrLines = content.match(/[*-]\s*(?:Old|Original|From|Before)\s*(?:String|Text|Content)?:\s*[`'"]([^`'"]*)[`'"]/i);
    const newStrLines = content.match(/[*-]\s*(?:New|Updated|To|After)\s*(?:String|Text|Content)?:\s*[`'"]([^`'"]*)[`'"]/i);
    
    if (oldStrLines && newStrLines) {
      console.debug('StrReplaceToolView: Found markdown-style replacement description');
      return {
        filePath: extractFilePath(content),
        oldStr: oldStrLines[1],
        newStr: newStrLines[1],
        success: true
      };
    }
    
    // Look for diff code blocks
    const diffBlockRegex = /```(?:diff)?\s*([\s\S]*?)```/g;
    let diffMatch;
    while ((diffMatch = diffBlockRegex.exec(content)) !== null) {
      const diffContent = diffMatch[1];
      console.debug('StrReplaceToolView: Found potential diff block');
      
      // Parse diff format (- for removed, + for added)
      const oldLines: string[] = [];
      const newLines: string[] = [];
      
      const lines = diffContent.split('\n');
      for (const line of lines) {
        if (line.startsWith('-') && !line.startsWith('---')) {
          oldLines.push(line.substring(1));
        } else if (line.startsWith('+') && !line.startsWith('+++')) {
          newLines.push(line.substring(1));
        }
      }
      
      if (oldLines.length > 0 && newLines.length > 0) {
        console.debug('StrReplaceToolView: Extracted strings from diff block');
        return {
          filePath: extractFilePath(content),
          oldStr: oldLines.join('\n'),
          newStr: newLines.join('\n'),
          success: true
        };
      }
    }
    
    return { filePath: null, oldStr: null, newStr: null };
  }

  if (typeof content !== 'object') {
    console.debug('StrReplaceToolView: Content is not an object, skipping object extraction');
    return { filePath: null, oldStr: null, newStr: null };
  }
  
  console.debug('StrReplaceToolView: Processing object content with keys:', Object.keys(content).join(', '));

  // Handle tool_execution format (common in newer APIs)
  if ('tool_execution' in content && typeof content.tool_execution === 'object') {
    console.debug('StrReplaceToolView: Found tool_execution object structure');
    const toolExecution = content.tool_execution;
    let args = toolExecution.arguments || {};
    
    // Handle both object and string arguments formats
    if (typeof args === 'string') {
      try {
        args = JSON.parse(args);
        console.debug('StrReplaceToolView: Parsed string arguments into object');
      } catch (error) {
        console.debug('StrReplaceToolView: Could not parse string arguments, trying regex');
        // Try to extract arguments with regex if JSON parsing fails
        const argsMatches = args.match(/['"]?(old_str|oldStr)['"]?\s*[:=]\s*['"]([\s\S]*?)['"](?:,|\s*})/i);
        const newStrMatches = args.match(/['"]?(new_str|newStr)['"]?\s*[:=]\s*['"]([\s\S]*?)['"](?:,|\s*})/i);
        
        if (argsMatches && newStrMatches) {
          console.debug('StrReplaceToolView: Extracted string arguments using regex');
          return {
            filePath: extractFilePath(content),
            oldStr: argsMatches[2],
            newStr: newStrMatches[2],
            success: true
          };
        }
      }
    }
    
    // Check for args in execution_details.input if available
    if (toolExecution.execution_details?.input) {
      console.debug('StrReplaceToolView: Checking execution_details.input for arguments');
      // eslint-disable-next-line no-useless-escape
      const argumentsRegex = /"arguments"\s*:\s*\{([\s\S]+?)\}/i;
      const match = toolExecution.execution_details.input.match(argumentsRegex);
      if (match) {
        const argsJson = match[1];
        try {
          const argsObject = JSON.parse(`{${argsJson}}`);
          console.debug('StrReplaceToolView: Successfully parsed arguments from execution_details');
          args = { ...args, ...argsObject };
        } catch (error) {
          console.error('StrReplaceToolView: Error parsing arguments:', error);
        }
      }
    }
    
    // Check for arguments in various formats and field names
    const argumentKeys = [
      // Standard format
      { old: 'old_str', new: 'new_str' },
      // Camel case
      { old: 'oldStr', new: 'newStr' },
      // ReplacementChunks format
      { old: 'TargetContent', new: 'ReplacementContent' },
      { old: 'target_content', new: 'replacement_content' },
      // Other variations
      { old: 'old_string', new: 'new_string' },
      { old: 'oldString', new: 'newString' },
      { old: 'from', new: 'to' }
    ];
    
    for (const keyPair of argumentKeys) {
      if (args[keyPair.old] !== undefined && args[keyPair.new] !== undefined) {
        console.debug(`StrReplaceToolView: Found ${keyPair.old}/${keyPair.new} in arguments`);
        return {
          filePath: args.file_path || args.filepath || args.target_file || args.targetFile || extractFilePath(content),
          oldStr: args[keyPair.old],
          newStr: args[keyPair.new],
          success: toolExecution.result?.success !== false,
          timestamp: toolExecution.execution_details?.timestamp
        };
      }
    }
    
    // If we have replacement_chunks, try to extract from there
    if (args.replacement_chunks || args.replacementChunks) {
      const chunks = args.replacement_chunks || args.replacementChunks;
      if (Array.isArray(chunks) && chunks.length > 0) {
        const firstChunk = chunks[0];
        console.debug('StrReplaceToolView: Found replacement_chunks, extracting from first chunk');
        return {
          filePath: args.file_path || args.filepath || args.target_file || args.targetFile || extractFilePath(content),
          oldStr: firstChunk.TargetContent || firstChunk.target_content,
          newStr: firstChunk.ReplacementContent || firstChunk.replacement_content,
          success: toolExecution.result?.success !== false,
          timestamp: toolExecution.execution_details?.timestamp
        };
      }
    }
    
    console.debug('StrReplaceToolView: Extracted from tool_execution format:', {
      filePath: args.file_path || args.filepath || args.target_file || args.targetFile,
      oldStr: args.old_str ? `${args.old_str.substring(0, 50)}...` : null,
      newStr: args.new_str ? `${args.new_str.substring(0, 50)}...` : null,
      success: toolExecution.result?.success
    });
    
    return {
      filePath: args.file_path || args.filepath || args.target_file || args.targetFile || null,
      oldStr: args.old_str || args.oldStr || null,
      newStr: args.new_str || args.newStr || null,
      success: toolExecution.result?.success !== false,
      timestamp: toolExecution.execution_details?.timestamp
    };
  }

  if ('role' in content && 'content' in content && typeof content.content === 'string') {
    console.debug('StrReplaceToolView: Found role/content structure with string content, parsing...');
    return extractFromNewFormat(content.content);
  }

  if ('role' in content && 'content' in content && typeof content.content === 'object') {
    console.debug('StrReplaceToolView: Found role/content structure with object content');
    return extractFromNewFormat(content.content);
  }

  return { filePath: null, oldStr: null, newStr: null };
};


export const extractFromLegacyFormat = (content: any, extractToolData: any, extractFilePath: any, extractStrReplaceContent: any): ExtractedData => {
  const assistantToolData = extractToolData(content);
  
  if (assistantToolData.toolResult) {
    const args = assistantToolData.arguments || {};
    
    console.debug('StrReplaceToolView: Extracted from legacy format (extractToolData):', {
      filePath: assistantToolData.filePath || args.file_path,
      oldStr: args.old_str ? `${args.old_str.substring(0, 50)}...` : null,
      newStr: args.new_str ? `${args.new_str.substring(0, 50)}...` : null
    });
    
    return {
      filePath: assistantToolData.filePath || args.file_path || null,
      oldStr: args.old_str || null,
      newStr: args.new_str || null
    };
  }

  const legacyFilePath = extractFilePath(content);
  const strReplaceContent = extractStrReplaceContent(content);
  
  console.debug('StrReplaceToolView: Extracted from legacy format (fallback):', {
    filePath: legacyFilePath,
    oldStr: strReplaceContent.oldStr ? `${strReplaceContent.oldStr.substring(0, 50)}...` : null,
    newStr: strReplaceContent.newStr ? `${strReplaceContent.newStr.substring(0, 50)}...` : null
  });
  
  return {
    filePath: legacyFilePath,
    oldStr: strReplaceContent.oldStr,
    newStr: strReplaceContent.newStr
  };
};


export const parseNewlines = (text: string): string => {
  return text.replace(/\\n/g, '\n');
};


export const generateLineDiff = (oldText: string, newText: string): LineDiff[] => {
  const parsedOldText = parseNewlines(oldText);
  const parsedNewText = parseNewlines(newText);
  
  const oldLines = parsedOldText.split('\n');
  const newLines = parsedNewText.split('\n');
  
  const diffLines: LineDiff[] = [];
  const maxLines = Math.max(oldLines.length, newLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    const oldLine = i < oldLines.length ? oldLines[i] : null;
    const newLine = i < newLines.length ? newLines[i] : null;
    
    if (oldLine === newLine) {
      diffLines.push({ type: 'unchanged', oldLine, newLine, lineNumber: i + 1 });
    } else {
      if (oldLine !== null) {
        diffLines.push({ type: 'removed', oldLine, newLine: null, lineNumber: i + 1 });
      }
      if (newLine !== null) {
        diffLines.push({ type: 'added', oldLine: null, newLine, lineNumber: i + 1 });
      }
    }
  }
  
  return diffLines;
};

export const generateCharDiff = (oldText: string, newText: string): CharDiffPart[] => {
  const parsedOldText = parseNewlines(oldText);
  const parsedNewText = parseNewlines(newText);
  
  let prefixLength = 0;
  while (
    prefixLength < parsedOldText.length &&
    prefixLength < parsedNewText.length &&
    parsedOldText[prefixLength] === parsedNewText[prefixLength]
  ) {
    prefixLength++;
  }

  let oldSuffixStart = parsedOldText.length;
  let newSuffixStart = parsedNewText.length;
  while (
    oldSuffixStart > prefixLength &&
    newSuffixStart > prefixLength &&
    parsedOldText[oldSuffixStart - 1] === parsedNewText[newSuffixStart - 1]
  ) {
    oldSuffixStart--;
    newSuffixStart--;
  }

  const parts: CharDiffPart[] = [];

  if (prefixLength > 0) {
    parts.push({
      text: parsedOldText.substring(0, prefixLength),
      type: 'unchanged',
    });
  }

  if (oldSuffixStart > prefixLength) {
    parts.push({
      text: parsedOldText.substring(prefixLength, oldSuffixStart),
      type: 'removed',
    });
  }
  if (newSuffixStart > prefixLength) {
    parts.push({
      text: parsedNewText.substring(prefixLength, newSuffixStart),
      type: 'added',
    });
  }

  if (oldSuffixStart < parsedOldText.length) {
    parts.push({
      text: parsedOldText.substring(oldSuffixStart),
      type: 'unchanged',
    });
  }

  return parts;
};

export const calculateDiffStats = (lineDiff: LineDiff[]): DiffStats => {
  return {
    additions: lineDiff.filter(line => line.type === 'added').length,
    deletions: lineDiff.filter(line => line.type === 'removed').length
  };
};