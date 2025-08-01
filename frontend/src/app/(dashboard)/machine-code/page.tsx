"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUserEmail,
  fetchUserTeam,
  fetchAllTeams,
  createUserTeam,
  createTeamKey,
  fetchTeamInfo,
  fetchTeamKeys,
} from "./actions";

// shadcn/ui components
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Custom components
import StripeModal from "./stripe-modal";
import InstallationGuide from "./installation-guide";

// Helper UI components
function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-400 border-opacity-60 mb-6" style={{
          borderTopColor: "#a855f7",
          borderBottomColor: "#f472b6"
        }} />
        <span className="text-lg text-muted-foreground font-semibold">Loading...</span>
      </div>
    </div>
  );
}

function ErrorBox({ error }: { error: string }) {
  return (
    <div className="bg-destructive/10 text-destructive border border-destructive/30 p-4 rounded-xl mb-4 max-w-lg w-full">
      {error}
    </div>
  );
}

function ClaimButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <Button
      className="px-6 py-2 text-base font-semibold"
      onClick={onClick}
      disabled={loading}
      variant="default"
    >
      {loading ? "Claiming..." : "Claim Machine Code Account"}
    </Button>
  );
}

// Copy-to-clipboard for secret key
function SecretKeyBox({ secretKey }: { secretKey: string }) {
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, [secretKey]);

  const masked = secretKey && secretKey !== "—"
    ? "*".repeat(Math.max(secretKey.length - 4, 0)) + secretKey.slice(-4)
    : secretKey;

  return (
    <div className="flex items-center gap-2">
      <span
        className="break-all font-mono text-card-foreground text-base select-all"
        style={{ wordBreak: "break-all" }}
      >
        {show ? secretKey : masked}
      </span>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label="Copy secret key"
        onClick={handleCopy}
        className="ml-1"
      >
        <Copy className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label={show ? "Hide key" : "Show key"}
        onClick={() => setShow((v) => !v)}
        className="ml-1"
      >
        {show ? (
          <span className="font-mono text-xs">Hide</span>
        ) : (
          <span className="font-mono text-xs">Show</span>
        )}
      </Button>
      {copied && (
        <span className="text-xs text-green-600 dark:text-green-400 ml-1">Copied!</span>
      )}
    </div>
  );
}

// Copy-to-clipboard for base url
function BaseUrlBox({ baseUrl }: { baseUrl: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(baseUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, [baseUrl]);

  return (
    <div className="flex items-center gap-2">
      <span className="break-all font-mono text-card-foreground text-base select-all">{baseUrl}</span>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label="Copy base url"
        onClick={handleCopy}
        className="ml-1"
      >
        <Copy className="w-4 h-4" />
      </Button>
      {copied && (
        <span className="text-xs text-green-600 dark:text-green-400 ml-1">Copied!</span>
      )}
    </div>
  );
}

export default function MachineCodePage() {
  const [initialized, setInitialized] = useState(false); // <-- NEW STATE
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeModalOpen, setStripeModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [postCheckoutRefresh, setPostCheckoutRefresh] = useState(false);

  const [email, setEmail] = useState<string | null>(null);
  const [team, setTeam] = useState<any>(null);
  const [teamInfo, setTeamInfo] = useState<any>(null);
  const [teamKeys, setTeamKeys] = useState<any[]>([]);
  const [allTeams, setAllTeams] = useState<any[]>([]);

  // Function to refresh team data
  const refreshTeamData = useCallback(async (retryCount = 0): Promise<boolean> => {
    if (!email || !team?.team_id) return false;
    
    try {
      console.log(`[REFRESH] Attempting to refresh team data (attempt ${retryCount + 1})`);
      const [info, keys] = await Promise.all([
        fetchTeamInfo(team.team_id),
        fetchTeamKeys(team.team_id),
      ]);
      
      console.log("[REFRESH] Fetched team data:", { info, keys: keys.keys });
      
      setTeamInfo(info);
      setTeamKeys(keys.keys || []);
      return true;
    } catch (e: any) {
      console.error(`[REFRESH] Failed to refresh team data (attempt ${retryCount + 1}):`, e);
      if (retryCount < 3) {
        // Retry after a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        return refreshTeamData(retryCount + 1);
      }
      setError("Failed to refresh data: " + e.message);
      return false;
    }
  }, [email, team?.team_id]);

  // Function to wait for budget update with polling
  const waitForBudgetUpdate = useCallback(async (originalBudget: number, expectedIncrease: number) => {
    const maxAttempts = 10;
    const delayMs = 2000;
    
    console.log(`[BUDGET_POLL] Starting to poll for budget update. Original: $${originalBudget}, Expected increase: $${expectedIncrease}`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`[BUDGET_POLL] Attempt ${attempt}/${maxAttempts}`);
      
      const success = await refreshTeamData();
      if (!success) {
        console.log(`[BUDGET_POLL] Failed to fetch data on attempt ${attempt}`);
        continue;
      }
      
      // Check if budget has been updated
      const currentTeamObj = Array.isArray(teamInfo) ? teamInfo[0] : teamInfo;
      const currentBudget = 
        currentTeamObj?.team_info?.max_budget ?? 
        currentTeamObj?.max_budget ?? 
        0;
      
      console.log(`[BUDGET_POLL] Current budget: $${currentBudget}, Expected: $${originalBudget + expectedIncrease}`);
      
      if (currentBudget >= originalBudget + expectedIncrease) {
        console.log(`[BUDGET_POLL] Budget updated successfully! New budget: $${currentBudget}`);
        return true;
      }
      
      if (attempt < maxAttempts) {
        console.log(`[BUDGET_POLL] Budget not updated yet, waiting ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    console.log(`[BUDGET_POLL] Timeout waiting for budget update after ${maxAttempts} attempts`);
    return false;
  }, [teamInfo, refreshTeamData]);

  // Fetch user email and team on mount
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const userEmail = await getCurrentUserEmail();
        if (!userEmail) throw new Error("Could not determine your email.");
        if (cancelled) return;
        setEmail(userEmail);

        // Fetch all teams
        const teams = await fetchAllTeams();
        setAllTeams(teams);

        // Find a team where team_alias or team_id matches the email (case-insensitive, trimmed)
        const normalizedEmail = userEmail.trim().toLowerCase();
        const matchedTeam = teams.find(
          (t: any) =>
            (typeof t.team_alias === "string" && t.team_alias.trim().toLowerCase() === normalizedEmail) ||
            (typeof t.team_id === "string" && t.team_id.trim().toLowerCase() === normalizedEmail)
        );
        setTeam(matchedTeam);

        if (matchedTeam) {
          // Fetch team info and keys
          const [info, keys] = await Promise.all([
            fetchTeamInfo(matchedTeam.team_id),
            fetchTeamKeys(matchedTeam.team_id),
          ]);
          if (cancelled) return;
          setTeamInfo(info);
          setTeamKeys(keys.keys || []);
        }
      } catch (e: any) {
        setError(e.message || "Unknown error");
      } finally {
        // This is the key change: only mark as initialized at the very end.
        if (!cancelled) {
          setInitialized(true);
        }
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Claim credits: create team and key, then reload info
  const router = useRouter();

  const handleClaim = useCallback(async () => {
    if (!email) return;
    setClaiming(true);
    setError(null);
    try {
      // Create team
      const newTeam = await createUserTeam(email);
      // Create key and get the response
      const keyResponse = await createTeamKey(email, newTeam.team_id);

      // Save the key in localStorage for the user
      if (keyResponse && keyResponse.key) {
        // FIX: Clean the key to remove the double dash
        const cleanedKey = keyResponse.key.replace(/^sk--/, 'sk-');
        localStorage.setItem("machine_code_secret_key", cleanedKey);
        console.log(`[CLAIM] Original key: ${keyResponse.key}, Cleaned key: ${cleanedKey}`);
      }

      // Fetch info
      const [info, keys] = await Promise.all([
        fetchTeamInfo(newTeam.team_id),
        fetchTeamKeys(newTeam.team_id),
      ]);
      setTeam(newTeam);
      setTeamInfo(info);
      setTeamKeys(keys.keys || []);
    } catch (e: any) {
      setError(e.message || "Failed to claim credits");
    } finally {
      setClaiming(false);
    }
  }, [email]);

  const handleCheckoutStarted = useCallback(async (purchasedAmount?: number) => {
    setStripeModalOpen(false);
    setPostCheckoutRefresh(true);
    
    // Get current budget for comparison
    const currentTeamObj = Array.isArray(teamInfo) ? teamInfo[0] : teamInfo;
    const currentBudget = 
      currentTeamObj?.team_info?.max_budget ?? 
      currentTeamObj?.max_budget ?? 
      0;
    
    console.log(`[CHECKOUT] Payment completed. Current budget: $${currentBudget}, Purchased: $${purchasedAmount || 'unknown'}`);
    
    try {
      // If we know the purchased amount, poll for the specific budget increase
      if (purchasedAmount) {
        const success = await waitForBudgetUpdate(currentBudget, purchasedAmount);
        if (!success) {
          // Fallback to regular refresh
          await refreshTeamData();
        }
      } else {
        // Fallback: wait a bit then refresh
        await new Promise(resolve => setTimeout(resolve, 3000));
        await refreshTeamData();
      }
    } catch (error) {
      console.error("[CHECKOUT] Error refreshing data:", error);
      // Try one more time
      await refreshTeamData();
    } finally {
      setPostCheckoutRefresh(false);
    }
  }, [teamInfo, waitForBudgetUpdate, refreshTeamData]);

  // Manual refresh function
  const handleManualRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await refreshTeamData();
    } finally {
      setRefreshing(false);
    }
  }, [refreshTeamData]);

  // --- START: NEW, MORE ROBUST RENDER LOGIC ---
  
  // Show loading screen until the initialization process is fully complete.
  if (!initialized) {
    return <Loading />;
  }

  // If initialization is done and there's an error, show the error box.
  if (error) {
    return <ErrorBox error={error} />;
  }

  // Once initialized, we can safely decide which component to render.
  // If there's no team, the user needs to claim one.
  if (!team) {
    return (
      <div className="min-h-[100vh] flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
        <Card className="w-full max-w-2xl p-12 rounded-2xl shadow-xl border border-purple-200/50 dark:border-purple-800/50 bg-white/80 dark:bg-gray-900/60 flex flex-col items-center">
          <CardHeader className="pb-2 w-full flex flex-col items-center">
            <CardTitle className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-lg mb-2">
              Machine Code
            </CardTitle>
          </CardHeader>
          <CardContent className="w-full flex flex-col items-center">
            <p className="text-muted-foreground text-lg mb-6 text-center">
              You have not claimed your Machine Code account yet.<br />
              Click Claim to get started with Machine Code in your IDE.
            </p>
            <ClaimButton onClick={handleClaim} loading={claiming} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // If a team exists but its info hasn't loaded yet (e.g., right after claiming), show loading.
  if (!teamInfo || !teamKeys) {
    return <Loading />;
  }
  
  // --- END: NEW RENDER LOGIC ---

  // If we get here, the user has a team and all data is loaded. Show the dashboard.
  let teamObj = teamInfo;
  if (Array.isArray(teamInfo)) {
    if (team && team.team_id) {
      teamObj = teamInfo.find((t: any) =>
        typeof t.team_id === "string" &&
        typeof team.team_id === "string" &&
        t.team_id.trim().toLowerCase() === team.team_id.trim().toLowerCase()
      );
    }
    if (!teamObj && team && team.team_alias) {
      teamObj = teamInfo.find((t: any) =>
        typeof t.team_alias === "string" &&
        typeof team.team_alias === "string" &&
        t.team_alias.trim().toLowerCase() === team.team_alias.trim().toLowerCase()
      );
    }
    if (!teamObj) {
      teamObj = teamInfo[0];
    }
  }
  
  // Read budget and spend from nested team_info if present
  const budget =
    teamObj && teamObj.team_info && typeof teamObj.team_info.max_budget === "number"
      ? teamObj.team_info.max_budget
      : 0;
  const spend =
    teamObj && teamObj.team_info && typeof teamObj.team_info.spend === "number"
      ? teamObj.team_info.spend
      : 0;
  
  // Try to get the secret key from localStorage if available (for new claims)
  let secretKey = "—";
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("machine_code_secret_key");
    if (stored) secretKey = stored;
  }
  let foundKeyObj: any = null;
  if (secretKey === "—" && Array.isArray(teamKeys)) {
    for (const k of teamKeys) {
      for (const prop of Object.keys(k)) {
        if (typeof k[prop] === "string" && k[prop].startsWith("sk")) {
          secretKey = k[prop];
          foundKeyObj = k;
          break;
        }
      }
      if (foundKeyObj) break;
    }
    // Fallback: try key_alias === email
    if (secretKey === "—") {
      const keyObj = teamKeys.find((k: any) => k.key_alias === email) || teamKeys[0];
      if (keyObj) {
        secretKey =
          keyObj.key ||
          keyObj.token ||
          keyObj.api_key ||
          keyObj.secret ||
          "—";
      }
    }
  }
  
  // Use env variable for base URL
  const baseUrl = process.env.NEXT_PUBLIC_LITELLM_BASE_URL || "";
  
  // Progress bar width calculation
  const progress = budget > 0 ? Math.min(100, (spend / budget) * 100) : 0;

  return (
    <>
      <div className="min-h-[100vh] flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 py-16">
        <h1 className="text-4xl font-extrabold mb-10 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-lg">
          Machine Code
        </h1>
        <div className="flex flex-row flex-wrap gap-12 w-full max-w-7xl justify-center">
          {/* Budget & Spend Card */}
          <Card className="flex-1 min-w-[520px] max-w-[700px] rounded-2xl border border-purple-200/50 dark:border-purple-800/50 shadow-lg bg-white/80 dark:bg-gray-900/60 p-12 relative">
            {(refreshing || postCheckoutRefresh) && (
              <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center rounded-2xl backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                  <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                    {postCheckoutRefresh ? "Updating budget..." : "Refreshing..."}
                  </span>
                </div>
              </div>
            )}
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Budget & Spend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    ${spend.toFixed(2)}
                  </span>
                  <span className="text-base text-gray-500 dark:text-gray-400">of</span>
                  <span className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                    ${budget.toFixed(2)}
                  </span>
                  <span className="text-base text-gray-500 dark:text-gray-400">budget</span>
                </div>
                <div className="mc-progress-bar-container">
                  <div
                    className="mc-progress-bar"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>$0</span>
                  <span>${budget.toFixed(2)}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={() => setStripeModalOpen(true)}
                    className="px-6 py-2 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-pink-600 hover:to-purple-600 transition-all"
                    disabled={postCheckoutRefresh}
                  >
                    Get More Credits
                  </Button>
                  <Button
                    onClick={handleManualRefresh}
                    disabled={refreshing || postCheckoutRefresh}
                    variant="outline"
                    className="px-4 py-2 text-sm"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? "Refreshing..." : "Refresh"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Secret Key & Base URL Card */}
          <Card className="flex-1 min-w-[520px] max-w-[700px] rounded-2xl border border-pink-200/50 dark:border-pink-800/50 shadow-lg bg-white/80 dark:bg-gray-900/60 p-12">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Secret Key & Base URL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-200">Secret Key:</span>
                  <div className="mt-1">
                    <SecretKeyBox secretKey={secretKey} />
                  </div>
                  {secretKey === "—" && (
                    <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                      <strong>Note:</strong> For security, the secret key is only shown once when you first create it. If you do not see a key starting with <code>sk</code> below, you may need to re-claim or generate a new key.
                    </div>
                  )}
                </div>
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-200">Base URL:</span>
                  <div className="mt-1">
                    <BaseUrlBox baseUrl={baseUrl} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
         <InstallationGuide />
      </div>

      <Dialog open={stripeModalOpen} onOpenChange={setStripeModalOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 border-none bg-transparent">
          <StripeModal
            open={stripeModalOpen}
            onClose={() => setStripeModalOpen(false)}
            email={email}
            teamId={team?.team_id || null}
            onCheckoutStarted={handleCheckoutStarted}
          />
        </DialogContent>
      </Dialog>

      <style jsx>{`
        .mc-progress-bar-container {
          width: 100%;
          height: 0.75rem;
          background-color: rgba(75, 75, 75, 0.15);
          border-radius: 9999px;
          margin-top: 0.75rem;
          overflow: hidden;
        }
        @keyframes mc-flow {
          0% { background-position: 200% 50%; }
          100% { background-position: 0% 50%; }
        }
        .mc-progress-bar {
          height: 100%;
          border-radius: 9999px;
          background: linear-gradient(90deg,
            #8b5cf6, #a855f7, #c084fc, #d946ef, #f472b6, #ec4899, #d946ef, #c084fc, #a855f7, #8b5cf6
          );
          background-size: 500% 100%;
          animation: mc-flow 12s linear infinite;
          transition: width 0.3s cubic-bezier(.4,1,.7,1);
        }
      `}</style>
    </>
  );
}
