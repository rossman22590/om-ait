// src/app/machine-code/installation-guide.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Blocks } from "lucide-react";
import Image from "next/image";

// A small component for the step number circle to keep the code clean
const StepCircle = ({ step }: { step: number }) => (
  <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/40 mr-6">
    <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{step}</span>
  </div>
);

export default function InstallationGuide() {
  return (
    <Card className="w-full max-w-7xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg bg-white/80 dark:bg-gray-900/60 p-8 md:p-12 mt-12">
      <CardHeader className="pb-8">
        <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center">
          Installation Guide
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-12">
          
          {/* --- Step 1 --- */}
 {/* --- Step 1 --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Text Content */}
            <div>
              <div className="flex items-center mb-3">
                <StepCircle step={1} />
                <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Go to your IDE</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 pl-[72px]">
                Open your IDE (e.g., VS Code, Cursor, Windsurf) and navigate to the Extensions marketplace from the sidebar.
              </p>
            </div>
            {/* Media Content */}
            <div className="flex items-center justify-center p-8 rounded-lg min-h-[150px]">
              <div className="flex items-center justify-center gap-6">
                <Image
                  src="/machine-code/vscode-logo.png"
                  alt="Visual Studio Code Logo"
                  width={80}
                  height={80}
                  className="rounded-md"
                  unoptimized // Use if your logos are SVGs or you don't need optimization
                />
                <Image
                  src="/machine-code/cursor-logo.png"
                  alt="Cursor IDE Logo"
                  width={80}
                  height={80}
                  className="rounded-md"
                  unoptimized
                />
                <Image
                  src="/machine-code/windsurf-logo.svg"
                  alt="Windsurf IDE Logo"
                  width={80}
                  height={80}
                  className="rounded-md"
                  unoptimized
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* --- Step 2 --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Text Content */}
            <div>
              <div className="flex items-center mb-3">
                <StepCircle step={2} />
                <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Install an Extension</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 pl-[72px]">
                Search for and install either "Roo Code" or "Kilo Code AI Agent". Click a button below to open it directly in VS Code.
              </p>
            </div>
            {/* Media Content */}
            <div className="flex items-center justify-center p-8 rounded-lg min-h-[150px]">
              <div className="flex flex-col gap-4 w-full max-w-xs">
                <Button
                  asChild
                  variant="outline"
                  className="h-12 text-base"
                >
                  <a href="vscode:extension/rooveterinaryinc.roo-cline" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                    <Image
                      src="/machine-code/roo-code-logo.png"
                      alt="Roo Code Logo"
                      width={24}
                      height={24}
                      className="mr-2"
                    />
                    Roo Code
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 text-base"
                >
                  <a href="vscode:extension/kilocode.kilo-code" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                    <Image
                      src="/machine-code/kilo-code-logo.png"
                      alt="Kilo Code Logo"
                      width={24}
                      height={24}
                      className="mr-2"
                    />
                    Kilo Code AI Agent
                  </a>
                </Button>
              </div>
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* --- Step 3 --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Text Content */}
            <div>
              <div className="flex items-center mb-3">
                <StepCircle step={3} />
                <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Configure the Provider</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 pl-[72px]">
                In the extension settings, select "LiteLLM" as the provider. Then, copy and paste your personal Base URL and Secret Key from the cards above.
              </p>
            </div>
            {/* Media Content */}
            <div className="flex items-center justify-center">
              <Image
                src="/machine-code/machine-code-settings.png"
                alt="Machine Code settings screenshot in IDE"
                width={600}
                height={338}
                className="rounded-lg shadow-xl border border-gray-200 dark:border-gray-700"
              />
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
