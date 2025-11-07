"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("flex flex-col items-center gap-3", className)}>{children}</div>;
}
