"use client";

import React from "react";

type TocItem = { id: string; text: string; level: number };

export function TableOfContents() {
  const [items, setItems] = React.useState<TocItem[]>([]);

  React.useEffect(() => {
    const headings = Array.from(document.querySelectorAll("h2, h3")) as HTMLElement[];
    const toc = headings
      .filter((h) => h.id)
      .map((h) => ({ id: h.id, text: h.innerText, level: h.tagName === "H2" ? 2 : 3 }));
    setItems(toc);
  }, []);

  if (!items.length) return null;

  return (
    <nav aria-label="Table of contents" className="text-sm space-y-2">
      <div className="font-medium mb-2">On this page</div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id} className={item.level === 3 ? "pl-4" : undefined}>
            <a href={`#${item.id}`} className="text-muted-foreground hover:text-foreground">
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
