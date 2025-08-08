'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader } from 'lucide-react';

interface SheetRendererProps {
  url: string; // binary URL to fetch the XLSX file
  fileName: string;
  className?: string;
}

// Simple in-browser preview for Excel files using SheetJS
// Renders the first worksheet by default with a dropdown to switch sheets
// Limits rendering to a safe subset of rows/columns for performance
export function SheetRenderer({ url, fileName, className }: SheetRendererProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workbookData, setWorkbookData] = useState<{
    sheetNames: string[];
    sheets: Record<string, string[][]>; // sheetName -> 2D array of cell strings
  } | null>(null);
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Dynamic import so apps without preview can still build
        const XLSX = await import('xlsx');
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`);
        const buf = await res.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });

        const MAX_ROWS = 500;
        const MAX_COLS = 50;

        const sheetNames = wb.SheetNames || [];
        const sheets: Record<string, string[][]> = {};
        for (const name of sheetNames) {
          const ws = wb.Sheets[name];
          const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
          const rows: string[][] = [];
          for (let r = range.s.r; r <= Math.min(range.e.r, range.s.r + MAX_ROWS - 1); r++) {
            const row: string[] = [];
            for (let c = range.s.c; c <= Math.min(range.e.c, range.s.c + MAX_COLS - 1); c++) {
              const addr = XLSX.utils.encode_cell({ r, c });
              const cell = ws[addr];
              row.push(cell ? String(cell.v ?? '') : '');
            }
            rows.push(row);
          }
          sheets[name] = rows;
        }
        if (!cancelled) {
          setWorkbookData({ sheetNames, sheets });
          setActiveSheet(sheetNames[0] || null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to render sheet');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [url]);

  const rows = useMemo(() => {
    if (!workbookData || !activeSheet) return [];
    return workbookData.sheets[activeSheet] || [];
  }, [workbookData, activeSheet]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-6 ${className || ''}`}>
        <Loader className="h-5 w-5 animate-spin mr-2" />
        <span>Loading spreadsheet preview…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 text-sm text-muted-foreground ${className || ''}`}>
        Unable to preview this spreadsheet. {error}
      </div>
    );
  }

  if (!workbookData || !activeSheet) {
    return (
      <div className={`p-6 text-sm text-muted-foreground ${className || ''}`}>
        No data found in this spreadsheet.
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className || ''}`}>
      <div className="flex items-center gap-2 p-3 border-b bg-background/50">
        <div className="text-sm font-medium truncate">{fileName}</div>
        <div className="ml-auto flex items-center gap-2">
          <select
            className="h-8 px-2 border rounded text-sm bg-background"
            value={activeSheet || ''}
            onChange={(e) => setActiveSheet(e.target.value)}
          >
            {workbookData.sheetNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className="border-b">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="p-2 border-r align-top whitespace-pre-wrap">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3 text-xs text-muted-foreground border-t">
        Preview limited to 500 rows x 50 columns for performance. Use Download for the full file.
      </div>
    </div>
  );
}
