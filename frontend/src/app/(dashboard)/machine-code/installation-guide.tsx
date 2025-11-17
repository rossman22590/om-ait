// src/app/machine-code/installation-guide.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Blocks, Copy } from "lucide-react";
import Image from "next/image";

// A small component for the step number circle to keep the code clean
const StepCircle = ({ step }: { step: number }) => (
  <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/40 mr-6">
    <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{step}</span>
  </div>
);

export default function InstallationGuide() {
  const [copied, setCopied] = useState(false);
  const [snippet, setSnippet] = useState<string>("");

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_LITELLM_BASE_URL || "https://machine-code.up.railway.app";
    let apiKey = "";
    try {
      if (typeof window !== "undefined") {
        apiKey = localStorage.getItem("machine_code_secret_key") || "";
      }
    } catch {}

    const payload = {
      custom_models: [
        {
          model_display_name: "Machine",
          model: "machine-cli",
          base_url: baseUrl,
          api_key: "sk-xxxxxxxx",
          provider: "generic-chat-completion-api",
          max_tokens: 64000,
        },
      ],
    } as const;
    setSnippet(JSON.stringify(payload, null, 2));
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, [snippet]);
  return (
    <Card className="w-full max-w-7xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg bg-white/80 dark:bg-gray-900/60 p-8 md:p-12 mt-12">
      <CardHeader className="pb-8">
        <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center">
          Models        </CardTitle>
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
                <Button
                  asChild
                  variant="outline"
                  className="h-12 text-base"
                >
                  <a href="vscode:extension/factoryai.factory-ai" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                    <Image
                      src="/machine-code/factory_hq_logo.jpg"
                      alt="Factory AI Logo"
                      width={24}
                      height={24}
                      className="mr-2"
                    />
                    Factory AI
                  </a>
                </Button>
              </div>
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* --- Step 3 --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-stretch">
            {/* Text Content */}
            <div>
              <div className="flex items-center mb-3">
                <StepCircle step={3} />
                <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Configure the Provider</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 pl-[72px]">
                In the extension settings, select "LiteLLM" as the provider. Then, copy and paste your personal Base URL and Secret Key from the cards above.
              </p>
              {/* Kilo Code / Roo Code images only */}
              <div className="pl-[72px] mt-4 w-full max-w-[700px]">
                <div className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <span>Kilo Code / Roo Code</span>
                </div>
                <div className="flex items-center gap-3">
                  <Image src="/machine-code/kilo-code-logo.png" alt="Kilo Code" width={28} height={28} className="rounded" />
                  <Image src="/machine-code/roo-code-logo.png" alt="Roo Code" width={28} height={28} className="rounded" />
                </div>
              </div>

              {/* Settings screenshot under Roo Code logo (above Factory) */}
              <div className="pl-[72px] mt-4 w-full max-w-[700px]">
                <Image
                  src="/machine-code/machine-code-settings.png"
                  alt="Machine Code settings screenshot"
                  width={500}
                  height={282}
                  className="rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mx-auto"
                />
              </div>

              {/* Factory AI configuration */}
              <div className="pl-[72px] mt-6 w-full max-w-[700px]">
                <div className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <Image src="/machine-code/factory_hq_logo.jpg" alt="Factory AI" width={24} height={24} className="rounded" />
                  <span>Factory AI configuration</span>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-gray-800 bg-black">
                  <pre className="m-0 p-4 text-sm leading-6 text-white overflow-x-auto">
{`$ `}
<code>{snippet}</code>
                  </pre>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="absolute top-2 right-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs"
                    aria-label="Copy configuration"
                  >
                    <Copy className="w-3.5 h-3.5" /> {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
            {/* Right side: FAQ */}
            <div className="h-full">
              <div className="h-full min-h-[640px] rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-10 md:p-12 flex flex-col">
                <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100">FAQ</h4>
                <div className="mt-6 space-y-6 text-[1.05rem] leading-7">
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-gray-800 dark:text-gray-200">What is the Base URL?</summary>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">It’s the endpoint your IDE calls for chat completions. Use the personal Base URL shown above.</p>
                  </details>
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-gray-800 dark:text-gray-200">Where do I find my Secret Key?</summary>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Copy the Secret Key from the card above and paste it into your extension settings. Keep it private.</p>
                  </details>
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-gray-800 dark:text-gray-200">Which provider should I select?</summary>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Select LiteLLM (or a generic OpenAI-compatible option) in Roo Code or Kilo Code.</p>
                  </details>
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-gray-800 dark:text-gray-200">The IDE can’t connect—what should I check?</summary>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Verify the Base URL, ensure the key is valid, and confirm your network allows outbound requests to the URL.</p>
                  </details>
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-gray-800 dark:text-gray-200">Can I use multiple models?</summary>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Yes. Add additional entries to custom_models with different model names and settings as needed.</p>
                  </details>
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-gray-800 dark:text-gray-200">How do I rotate my key?</summary>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Generate a new key, update it in your IDE settings, then revoke the old one in your dashboard.</p>
                  </details>
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-gray-800 dark:text-gray-200">Where is the Factory config on Windows?</summary>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">It’s stored under C:\\Users\\YOUR_USERNAME\\.factory. Replace YOUR_USERNAME with your Windows account name.</p>
                  </details>
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-gray-800 dark:text-gray-200">I get 401 Unauthorized</summary>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Your Secret Key is missing/invalid or was rotated. Re-copy it and restart the IDE if needed.</p>
                  </details>
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-gray-800 dark:text-gray-200">CORS or 403 errors</summary>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Ensure you’re using your personal Base URL, not a generic one. Some networks/proxies may block requests—try a different network or VPN.</p>
                  </details>
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-gray-800 dark:text-gray-200">Requests timeout or feel slow</summary>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Lower max_tokens, try again later, and verify proxy/firewall settings allow long-lived HTTPS connections.</p>
                  </details>
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-gray-800 dark:text-gray-200">429 rate limited</summary>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Wait briefly before retrying, reduce request concurrency, or shorten prompts/responses.</p>
                  </details>
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-gray-800 dark:text-gray-200">TLS/SSL or corporate proxy issues</summary>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Validate system certificates and set your IDE to use the corporate proxy when required.</p>
                  </details>
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-gray-800 dark:text-gray-200">Base URL format (trailing slash)</summary>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Use the URL exactly as provided. Adding/removing a trailing slash can cause 404/405 errors.</p>
                  </details>
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-gray-800 dark:text-gray-200">Changes don’t apply after edit</summary>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Reload the IDE window to refresh cached settings in some extensions.</p>
                  </details>
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-gray-800 dark:text-gray-200">Official websites</summary>
                    <div className="mt-2 text-gray-600 dark:text-gray-400 space-y-1">
                      <p><a className="text-purple-600 dark:text-purple-400 hover:underline" href="https://factory.ai" target="_blank" rel="noopener noreferrer">Factory AI</a></p>
                      <p><a className="text-purple-600 dark:text-purple-400 hover:underline" href="https://marketplace.visualstudio.com/items?itemName=kilocode.kilo-code" target="_blank" rel="noopener noreferrer">Kilo Code</a></p>
                      <p><a className="text-purple-600 dark:text-purple-400 hover:underline" href="https://marketplace.visualstudio.com/items?itemName=rooveterinaryinc.roo-cline" target="_blank" rel="noopener noreferrer">Roo Code / Cline</a></p>
                      <p><a className="text-purple-600 dark:text-purple-400 hover:underline" href="https://codeium.com/windsurf" target="_blank" rel="noopener noreferrer">Windsurf</a></p>
                      <p><a className="text-purple-600 dark:text-purple-400 hover:underline" href="https://code.visualstudio.com" target="_blank" rel="noopener noreferrer">Visual Studio Code</a></p>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
