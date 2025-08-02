"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// Helper to get the current user's email from Supabase Auth
export async function getCurrentUserEmail(): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw new Error("Failed to get user from Supabase: " + error.message);
  }
  if (!data?.user?.email) {
    throw new Error("No authenticated user or email found. Please log in.");
  }
  return data.user.email;
}

// Get the base URL from env
const BASE_URL = process.env.NEXT_PUBLIC_LITELLM_BASE_URL || "https://machine-code.up.railway.app";

// Fetch all teams and filter by email (team name === user email)
export async function fetchUserTeam(email: string) {
  if (!process.env.LITELLM_API_KEY) {
    throw new Error(
      "LITELLM_API_KEY is not set in the environment. Please set this variable in your .env file (for local dev) or in your deployment environment (for production)."
    );
  }

  const res = await fetch(`${BASE_URL}/team/list`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-litellm-api-key": process.env.LITELLM_API_KEY,
    },
    // If the API supports filtering by team name, use query params; otherwise, filter client-side
  });
  if (!res.ok) throw new Error("Failed to fetch teams: " + res.status + " " + res.statusText);
  const data = await res.json();
  // Find team where team_alias or team_id === email
  const team = (data.teams || []).find(
    (t: any) => t.team_alias === email || t.team_id === email
  );
  return team || null;
}

// Fetch all teams (for debug purposes)
export async function fetchAllTeams() {
  const apiKey = process.env.LITELLM_API_KEY;
  if (!apiKey) {
    throw new Error(
      "LITELLM_API_KEY is not set in the environment. Please set this variable in your .env file (for local dev) or in your deployment environment (for production)."
    );
  }

  const res = await fetch(`${BASE_URL}/team/list`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-litellm-api-key": apiKey,
    },
  });

  let data: any = {};
  try {
    data = await res.json();
  } catch (err) {
    // Failed to parse JSON response
  }

  if (!res.ok) throw new Error("Failed to fetch teams: " + res.status + " " + res.statusText);

  // If the response is an array, return it directly. If it's an object, try .teams.
  if (Array.isArray(data)) return data;
  return data.teams || [];
}

/**
 * Create a team key and ensure the key is visible (not redacted) by setting permissions.hide_secrets = false.
 * Now accepts an optional maxBudget parameter - if not provided, defaults to 2
 */
export async function createTeamKey(email: string, team_id: string, maxBudget?: number) {
  if (!process.env.LITELLM_API_KEY) {
    throw new Error("LITELLM_API_KEY is not set in the environment.");
  }
  
  const keyBudget = maxBudget ?? 2; // Use provided budget or default to 2
  
  const res = await fetch(`${BASE_URL}/key/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-litellm-api-key": process.env.LITELLM_API_KEY,
    },
    body: JSON.stringify({
      key_alias: email,
      team_id,
      models: [
        "Machine Free",
        "Machine Code Flash",
        "Machine Code Premium",
        "Machine Code Max",
        "Machine Code Ultimate",
      ],
      max_budget: keyBudget,
      budget_duration: null,
      permissions: { hide_secrets: false }, // <-- ensure key is visible
    }),
  });
  if (!res.ok) throw new Error("Failed to create team key: " + res.status + " " + res.statusText);
  const response = await res.json();
  return response;
}

/**
 * Regenerate a team key by deleting existing keys and creating a new one
 * The new key will inherit the team's current budget
 */
export async function regenerateKey(email: string, team_id: string) {
  if (!process.env.LITELLM_API_KEY) {
    throw new Error("LITELLM_API_KEY is not set in the environment.");
  }

  try {
    // Step 1: Fetch current team info to get the team's budget
    const teamInfo = await fetchTeamInfo(team_id);
    
    // Extract the team's max budget (same logic as in the frontend)
    let teamBudget = 2; // fallback default
    if (teamInfo) {
      if (teamInfo.team_info && typeof teamInfo.team_info.max_budget === "number") {
        teamBudget = teamInfo.team_info.max_budget;
      } else if (typeof teamInfo.max_budget === "number") {
        teamBudget = teamInfo.max_budget;
      }
    }

    console.log(`[REGENERATE_KEY] Team ${team_id} current budget: $${teamBudget}`);

    // Step 2: List existing keys for the team with the user's email as key_alias
    const listRes = await fetch(`${BASE_URL}/key/list?team_id=${encodeURIComponent(team_id)}&key_alias=${encodeURIComponent(email)}&return_full_object=true`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-litellm-api-key": process.env.LITELLM_API_KEY,
      },
    });

    if (listRes.ok) {
      const listData = await listRes.json();
      const existingKeys = listData.keys || [];

      // Step 3: Delete existing keys with the same alias
      if (existingKeys.length > 0) {
        const keysToDelete = existingKeys
          .filter((key: any) => key.key_alias === email)
          .map((key: any) => key.token || key.key)
          .filter(Boolean);

        if (keysToDelete.length > 0) {
          console.log(`[REGENERATE_KEY] Deleting ${keysToDelete.length} existing keys for ${email}`);
          const deleteRes = await fetch(`${BASE_URL}/key/delete`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-litellm-api-key": process.env.LITELLM_API_KEY,
            },
            body: JSON.stringify({
              keys: keysToDelete,
            }),
          });

          if (!deleteRes.ok) {
            console.warn("Failed to delete existing keys, but continuing with key creation");
          } else {
            console.log(`[REGENERATE_KEY] Successfully deleted existing keys`);
          }
        }
      }
    }

    // Step 4: Create a new key with the team's current budget
    console.log(`[REGENERATE_KEY] Creating new key with budget: $${teamBudget}`);
    const newKey = await createTeamKey(email, team_id, teamBudget);
    
    console.log(`[REGENERATE_KEY] Successfully created new key for ${email}`);
    return newKey;

  } catch (error: any) {
    console.error(`[REGENERATE_KEY] Error regenerating key for ${email}:`, error.message);
    throw new Error("Failed to regenerate key: " + error.message);
  }
}

// Create a team for the user (team_alias = email, budget_duration = undefined)
export async function createUserTeam(email: string) {
  const res = await fetch(`${BASE_URL}/team/new`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-litellm-api-key": process.env.LITELLM_API_KEY || "",
    },
    body: JSON.stringify({
      team_alias: email,
      max_budget: 2,
      budget_duration: undefined, // Indefinite
      models: [
        "Machine Free",
        "Machine Code Flash",
        "Machine Code Premium",
        "Machine Code Max",
        "Machine Code Ultimate"
      ],
    }),
  });
  if (!res.ok) throw new Error("Failed to create team");
  return await res.json();
}

// Fetch team info (budget, spend, models, etc.)
export async function fetchTeamInfo(team_id: string) {
  const res = await fetch(`${BASE_URL}/team/info?team_id=${encodeURIComponent(team_id)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-litellm-api-key": process.env.LITELLM_API_KEY || "",
    },
  });
  if (!res.ok) throw new Error("Failed to fetch team info");
  return await res.json();
}

// Fetch virtual keys for a team (to get the secret key)
export async function fetchTeamKeys(team_id: string) {
  const res = await fetch(`${BASE_URL}/key/list?team_id=${encodeURIComponent(team_id)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-litellm-api-key": process.env.LITELLM_API_KEY || "",
    },
  });
  if (!res.ok) throw new Error("Failed to fetch team keys");
  return await res.json();
}
