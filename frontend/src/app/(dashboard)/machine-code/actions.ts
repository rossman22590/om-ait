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
  // DEBUG: Log the API key value to the server console
  // eslint-disable-next-line no-console
  console.log("[DEBUG] LITELLM_API_KEY in fetchUserTeam:", process.env.LITELLM_API_KEY);

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
  // Debug: log the API key (masked)
  // eslint-disable-next-line no-console
  console.log("[DEBUG] Using LITELLM_API_KEY:", apiKey.slice(0, 6) + "..." + apiKey.slice(-4));

  const res = await fetch(`${BASE_URL}/team/list`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-litellm-api-key": apiKey,
    },
  });

  // Debug: log status and response
  // eslint-disable-next-line no-console
  console.log("[DEBUG] fetchAllTeams response status:", res.status, res.statusText);

  let data: any = {};
  try {
    data = await res.json();
    // eslint-disable-next-line no-console
    console.log("[DEBUG] fetchAllTeams response body:", data);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log("[DEBUG] fetchAllTeams failed to parse JSON:", err);
  }

  if (!res.ok) throw new Error("Failed to fetch teams: " + res.status + " " + res.statusText);

  // If the response is an array, return it directly. If it's an object, try .teams.
  if (Array.isArray(data)) return data;
  return data.teams || [];
}
/**
 * Create a team key and ensure the key is visible (not redacted) by setting permissions.hide_secrets = false.
 */
export async function createTeamKey(email: string, team_id: string) {
  if (!process.env.LITELLM_API_KEY) {
    throw new Error("LITELLM_API_KEY is not set in the environment.");
  }
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
      max_budget: 2,
      budget_duration: null,
      permissions: { hide_secrets: false }, // <-- ensure key is visible
    }),
  });
  if (!res.ok) throw new Error("Failed to create team key: " + res.status + " " + res.statusText);
  const response = await res.json();
  // eslint-disable-next-line no-console
  console.log("[DEBUG] createTeamKey response:", response);
  return response;
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