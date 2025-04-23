"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import dynamic from 'next/dynamic';

// Dynamically import PDF viewer components to avoid SSR issues
const PDFViewer = dynamic(
  () => import('./pdf-viewer-component').then(mod => mod.PDFViewer),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full">
        <p>Loading PDF viewer...</p>
      </div>
    )
  }
);

interface PdfRendererProps {
  url: string;
  className?: string;
}

export function PdfRenderer({ url, className }: PdfRendererProps) {
  return (
    <div className={cn("flex flex-col w-full h-full", className)}>
      <div className="flex-1 overflow-hidden rounded-md">
        <PDFViewer url={url} />
      </div>
    </div>
  );
}