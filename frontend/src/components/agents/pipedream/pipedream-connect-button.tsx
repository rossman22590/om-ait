'use client';

import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Loader2, Zap } from 'lucide-react';
import { pipedreamApi } from '@/hooks/react-query/pipedream/utils';

import { toast } from 'sonner';

interface PipedreamConnectButtonProps {
  app?: string;
  onConnect?: () => void;
  className?: string;
}

export const PipedreamConnectButton: React.FC<PipedreamConnectButtonProps> = ({
  app,
  onConnect,
  className
}) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const response = await pipedreamApi.createConnectionToken({ app });
      
      if (response.success && response.link) {
        // Pre-open popup synchronously to avoid blockers
        const connectWindow = window.open('', '_blank', 'width=600,height=700');

        if (connectWindow) {
          try {
            const origin = window.location.origin;
            connectWindow.location.href = `${origin}/pipedream/connecting`;
          } catch {}

          // PostMessage the actual link; delayed fallback if still on holding page
          try {
            connectWindow.postMessage({ link: response.link }, '*');
          } catch {}
          setTimeout(() => {
            try {
              const href = connectWindow.location?.href || '';
              if (href.includes('/pipedream/connecting')) {
                try { connectWindow.location.href = response.link; } catch {}
              }
            } catch {}
          }, 800);

          const checkClosed = setInterval(async () => {
            if (connectWindow.closed) {
              clearInterval(checkClosed);
              // After the popup closes, verify a connection actually exists
              try {
                // small delay to allow backend to persist connection
                await new Promise(r => setTimeout(r, 800));
                const connections = await pipedreamApi.getConnections();
                const target = app?.replace(/^pipedream:/, '');
                const isConnected = connections.connections?.some(c => (c.name_slug === target || c.app === target) && c.status === 'connected');
                if (isConnected) {
                  setIsConnecting(false);
                  onConnect?.();
                } else {
                  setIsConnecting(false);
                  toast.error('No Pipedream connection detected. Please complete the authorization or try again.');
                }
              } catch (e) {
                setIsConnecting(false);
                toast.error('Failed to verify connection status.');
              }
            }
          }, 1000);
          
          setTimeout(() => {
            clearInterval(checkClosed);
            if (!connectWindow.closed) {
              setIsConnecting(false);
            }
          }, 5 * 60 * 1000);
        } else {
          setIsConnecting(false);
          toast.error('Failed to open connection window. Please check your popup blocker.');
        }
      } else {
        setIsConnecting(false);
        toast.error(response.error || 'Failed to create connection');
      }
    } catch (error) {
      setIsConnecting(false);
      console.error('Connection error:', error);
      toast.error('Failed to connect to app');
    }
  };

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      className={className}
      size="sm"
    >
      {isConnecting ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Zap className="h-3 w-3" />
          {app ? 'Connect' : 'Connect Apps'}
        </>
      )}
    </Button>
  );
}; 