import { extractToolData, normalizeContentToString } from '../utils';

export interface ExposePortData {
  port: number | null;
  url: string | null;
  message: string | null;
  success?: boolean;
  timestamp?: string;
}

const parseContent = (content: any): any => {
  if (typeof content === 'string') {
    try {
      return JSON.parse(content);
    } catch (e) {
      return content;
    }
  }
  return content;
};

const extractFromNewFormat = (content: any): { 
  port: number | null; 
  url: string | null;
  message: string | null;
  success?: boolean; 
  timestamp?: string;
} => {
  const parsedContent = parseContent(content);
  
  if (!parsedContent || typeof parsedContent !== 'object') {
    return { port: null, url: null, message: null, success: undefined, timestamp: undefined };
  }

  if ('tool_execution' in parsedContent && typeof parsedContent.tool_execution === 'object') {
    const toolExecution = parsedContent.tool_execution;
    const args = toolExecution.arguments || {};
    
    let parsedOutput = toolExecution.result?.output;
    if (typeof parsedOutput === 'string') {
      try {
        parsedOutput = JSON.parse(parsedOutput);
      } catch (e) {
      }
    }

    const extractedData = {
      port: args.port ? parseInt(args.port, 10) : (parsedOutput?.port ? parseInt(parsedOutput.port, 10) : null),
      url: parsedOutput?.url || null,
      message: parsedOutput?.message || parsedContent.summary || null,
      success: toolExecution.result?.success,
      timestamp: toolExecution.execution_details?.timestamp
    };

    console.log('ExposePortToolView: Extracted from new format:', {
      port: extractedData.port,
      hasUrl: !!extractedData.url,
      hasMessage: !!extractedData.message,
      success: extractedData.success
    });
    
    return extractedData;
  }

  if ('role' in parsedContent && 'content' in parsedContent) {
    return extractFromNewFormat(parsedContent.content);
  }

  return { port: null, url: null, message: null, success: undefined, timestamp: undefined };
};

const extractPortFromAssistantContent = (content: string | object | undefined | null): number | null => {
  const contentStr = normalizeContentToString(content);
  if (!contentStr) return null;
  
  try {
    // Try standard <expose-port> tag format
    let match = contentStr.match(/<expose-port>\s*(\d+)\s*<\/expose-port>/);
    
    // If not found, try looking for port number in other common patterns
    if (!match) {
      // Look for "port 8000" pattern (case insensitive)
      match = contentStr.match(/port\s+(\d+)/i);
    }
    
    // If still not found, look for "port: 8000" pattern
    if (!match) {
      match = contentStr.match(/port:\s*(\d+)/i);
    }
    
    // If still not found, look for "exposed port 8000" pattern
    if (!match) {
      match = contentStr.match(/exposed\s+port\s+(\d+)/i);
    }
    
    return match ? parseInt(match[1], 10) : null;
  } catch (e) {
    console.error('Failed to extract port number:', e);
    return null;
  }
};

const extractUrlFromContent = (content: string | object | undefined | null): string | null => {
  const contentStr = normalizeContentToString(content);
  if (!contentStr) return null;
  
  try {
    // Look for URL patterns starting with http/https
    let match = contentStr.match(/https?:\/\/\S+/);
    
    // If not found, look for "Live URL:" pattern
    if (!match) {
      match = contentStr.match(/Live URL:\s*(https?:\/\/\S+)/i);
    }
    
    // If found, clean up any trailing punctuation or whitespace
    if (match) {
      // Remove trailing punctuation or formatting characters
      let url = match[0];
      if (match[1]) url = match[1]; // Use the capture group if available
      
      // Remove trailing punctuation, quotes, escape sequences and other unwanted characters
      url = url.replace(/["',\\].*$/, ''); // Remove anything after a quote, comma, or backslash
      url = url.replace(/[.,;:)'">\s]+$/, ''); // Remove any remaining trailing punctuation
      
      return url;
    }
    
    return null;
  } catch (e) {
    console.error('Failed to extract URL:', e);
    return null;
  }
};

const extractFromLegacyFormat = (content: any): { 
  port: number | null; 
  url: string | null;
  message: string | null;
} => {
  const toolData = extractToolData(content);
  
  // Extract port using our enhanced function
  const port = extractPortFromAssistantContent(content);
  
  // Extract URL using our new function
  const url = extractUrlFromContent(content);
  
  // Use tool data if available, otherwise use our extracted values
  return {
    port: toolData?.arguments?.port || port,
    url: (toolData?.toolResult as any)?.url || url,
    message: (toolData?.toolResult as any)?.message ?? null
  };
};

export function extractExposePortData(
  assistantContent: any,
  toolContent: any,
  isSuccess: boolean,
  toolTimestamp?: string,
  assistantTimestamp?: string
): {
  port: number | null;
  url: string | null;
  message: string | null;
  actualIsSuccess: boolean;
  actualToolTimestamp?: string;
  actualAssistantTimestamp?: string;
} {
  let port: number | null = null;
  let url: string | null = null;
  let message: string | null = null;
  let actualIsSuccess = isSuccess;
  let actualToolTimestamp = toolTimestamp;
  let actualAssistantTimestamp = assistantTimestamp;

  const assistantNewFormat = extractFromNewFormat(assistantContent);
  const toolNewFormat = extractFromNewFormat(toolContent);

  console.log('ExposePortToolView: Format detection results:', {
    assistantNewFormat: {
      hasPort: !!assistantNewFormat.port,
      hasUrl: !!assistantNewFormat.url,
      hasMessage: !!assistantNewFormat.message
    },
    toolNewFormat: {
      hasPort: !!toolNewFormat.port,
      hasUrl: !!toolNewFormat.url,
      hasMessage: !!toolNewFormat.message
    }
  });

  if (assistantNewFormat.port || assistantNewFormat.url || assistantNewFormat.message) {
    port = assistantNewFormat.port;
    url = assistantNewFormat.url;
    message = assistantNewFormat.message;
    if (assistantNewFormat.success !== undefined) {
      actualIsSuccess = assistantNewFormat.success;
    }
    if (assistantNewFormat.timestamp) {
      actualAssistantTimestamp = assistantNewFormat.timestamp;
    }
    console.log('ExposePortToolView: Using assistant new format data');
  } else if (toolNewFormat.port || toolNewFormat.url || toolNewFormat.message) {
    port = toolNewFormat.port;
    url = toolNewFormat.url;
    message = toolNewFormat.message;
    if (toolNewFormat.success !== undefined) {
      actualIsSuccess = toolNewFormat.success;
    }
    if (toolNewFormat.timestamp) {
      actualToolTimestamp = toolNewFormat.timestamp;
    }
    console.log('ExposePortToolView: Using tool new format data');
  } else {
    const assistantLegacy = extractFromLegacyFormat(assistantContent);
    const toolLegacy = extractFromLegacyFormat(toolContent);

    port = assistantLegacy.port || toolLegacy.port;
    url = assistantLegacy.url || toolLegacy.url;
    message = assistantLegacy.message || toolLegacy.message;
    
    if (!port) {
      const assistantPort = extractPortFromAssistantContent(assistantContent);
      if (assistantPort) {
        port = assistantPort;
      }
    }
    
    console.log('ExposePortToolView: Using legacy format data:', {
      port,
      hasUrl: !!url,
      hasMessage: !!message
    });
  }

  console.log('ExposePortToolView: Final extracted data:', {
    port,
    hasUrl: !!url,
    hasMessage: !!message,
    actualIsSuccess
  });

  return {
    port,
    url,
    message,
    actualIsSuccess,
    actualToolTimestamp,
    actualAssistantTimestamp
  };
} 