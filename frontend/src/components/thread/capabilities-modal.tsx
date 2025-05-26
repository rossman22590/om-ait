'use client';

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useModal, ModalType } from "@/hooks/use-modal-store";
import { Terminal, Server, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CapabilitiesModal = () => {
  const { type, isOpen, onClose } = useModal();
  
  // Use useEffect to automatically show the modal once when visiting a thread
  useEffect(() => {
    // Check localStorage to see if we've shown this modal before
    const hasShownModal = localStorage.getItem('capabilities_modal_shown');
    
    // If we haven't shown it yet and the user isn't already viewing a different modal,
    // show the capabilities modal
    if (!hasShownModal && !isOpen) {
      // Set a slight delay to avoid modal appearing immediately on page load
      const timer = setTimeout(() => {
        useModal.getState().onOpen("capabilitiesDialog");
        // Mark that we've shown the modal
        localStorage.setItem('capabilities_modal_shown', 'true');
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  const isModalOpen = isOpen && type === "capabilitiesDialog" as ModalType;

  // SVG component for Python logo
  const PythonLogo = () => (
    <svg 
      viewBox="0 0 128 128" 
      width="24" 
      height="24"
      className="text-blue-600 dark:text-blue-400"
    >
      <linearGradient id="python-original-a" gradientUnits="userSpaceOnUse" x1="70.252" y1="1237.476" x2="170.659" y2="1151.089" gradientTransform="matrix(.563 0 0 -.568 -29.215 707.817)"><stop offset="0" stopColor="#5A9FD4"/><stop offset="1" stopColor="#306998"/></linearGradient><linearGradient id="python-original-b" gradientUnits="userSpaceOnUse" x1="209.474" y1="1098.811" x2="173.62" y2="1149.537" gradientTransform="matrix(.563 0 0 -.568 -29.215 707.817)"><stop offset="0" stopColor="#FFD43B"/><stop offset="1" stopColor="#FFE873"/></linearGradient><path fill="url(#python-original-a)" d="M63.391 1.988c-4.222.02-8.252.379-11.8 1.007-10.45 1.846-12.346 5.71-12.346 12.837v9.411h24.693v3.137H29.977c-7.176 0-13.46 4.313-15.426 12.521-2.268 9.405-2.368 15.275 0 25.096 1.755 7.311 5.947 12.519 13.124 12.519h8.491V67.234c0-8.151 7.051-15.34 15.426-15.34h24.665c6.866 0 12.346-5.654 12.346-12.548V15.833c0-6.693-5.646-11.72-12.346-12.837-4.244-.706-8.645-1.027-12.866-1.008zM50.037 9.557c2.55 0 4.634 2.117 4.634 4.721 0 2.593-2.083 4.69-4.634 4.69-2.56 0-4.633-2.097-4.633-4.69-.001-2.604 2.073-4.721 4.633-4.721z" transform="translate(0 10.26)"/><path fill="url(#python-original-b)" d="M91.682 28.38v10.966c0 8.5-7.208 15.655-15.426 15.655H51.591c-6.756 0-12.346 5.783-12.346 12.549v23.515c0 6.691 5.818 10.628 12.346 12.547 7.816 2.297 15.312 2.713 24.665 0 6.216-1.801 12.346-5.423 12.346-12.547v-9.412H63.938v-3.138h37.012c7.176 0 9.852-5.005 12.348-12.519 2.578-7.735 2.467-15.174 0-25.096-1.774-7.145-5.161-12.521-12.348-12.521h-9.268zM77.809 87.927c2.561 0 4.634 2.097 4.634 4.692 0 2.602-2.074 4.719-4.634 4.719-2.55 0-4.633-2.117-4.633-4.719 0-2.595 2.083-4.692 4.633-4.692z" transform="translate(0 10.26)"/>
    </svg>
  );

  return (
    <Dialog open={isModalOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md border-none shadow-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-semibold">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Terminal className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <span>Machine Capabilities</span>
            </div>
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600 dark:text-gray-300">
            Important information about Machine's capabilities and limitations
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-2">
          <div className="space-y-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900">
              <div className="flex items-start gap-3">
                <div className="mt-1 shrink-0">
                  <PythonLogo />
                </div>
                <div>
                  <h3 className="font-medium text-emerald-800 dark:text-emerald-300 text-sm">Can run Python scripts</h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                    Data analysis, ML, web scraping with pre-installed packages (pandas, numpy, scikit-learn, matplotlib, etc.)
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-900">
              <div className="flex items-start gap-3">
                <div className="mt-1 shrink-0">
                  <Server className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-800 dark:text-blue-300 text-sm">Supports data operations</h3>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                    Process CSV, JSON, XML, SQL databases, and make HTTP requests to external APIs.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-900">
              <div className="flex items-start gap-3">
                <div className="mt-1 shrink-0">
                  <Terminal className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-medium text-amber-800 dark:text-amber-300 text-sm">Can run shell scripts</h3>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Use Linux command-line tools for file operations, text processing, and system monitoring.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg border border-purple-200 dark:border-purple-900">
              <div className="flex items-start gap-3">
                <div className="mt-1 shrink-0">
                  <ImageIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium text-purple-800 dark:text-purple-300 text-sm">Can generate images</h3>
                  <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
                    Create images using AI for artwork, diagrams, mockups, and visual content.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-900">
              <div className="flex items-start gap-3">
                <div className="mt-1 shrink-0">
                  <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-medium text-red-800 dark:text-red-300 text-sm">Cannot run Node.js or host web apps</h3>
                  <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                    Not designed to run npm servers, host SaaS apps, or run persistent databases. Workspace files are temporary.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <Button onClick={() => onClose()} className="w-full sm:w-auto cursor-pointer">
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
