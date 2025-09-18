import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

const webhookSecret = process.env.STRIPE_MACHINE_CODE_WEBHOOK!;
const litellmBaseUrl = process.env.NEXT_PUBLIC_LITELLM_BASE_URL || "https://machine-code.up.railway.app";
const litellmApiKey = process.env.LITELLM_API_KEY!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const teamId = paymentIntent.metadata?.teamId;
      const userEmail = paymentIntent.metadata?.email;
      const budgetIncreaseAmount = paymentIntent.metadata?.budgetIncreaseAmount;

      if (!teamId || !userEmail || !budgetIncreaseAmount) {
        console.error("Missing metadata:", { teamId, userEmail, budgetIncreaseAmount });
        return new NextResponse("Missing required metadata", { status: 400 });
      }

      const amountToAdd = parseFloat(budgetIncreaseAmount);
      console.log(`[WEBHOOK] Processing payment for team ${teamId}, adding $${amountToAdd} to budgets`);

      try {
        // 1. Get current team info
        const teamInfoRes = await fetch(`${litellmBaseUrl}/team/info?team_id=${encodeURIComponent(teamId)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-litellm-api-key": litellmApiKey,
          },
        });

        if (!teamInfoRes.ok) {
          const errorText = await teamInfoRes.text();
          console.error(`[WEBHOOK] Failed to fetch team info: ${teamInfoRes.status}`, errorText);
          return new NextResponse(`Failed to fetch team info: ${teamInfoRes.statusText}`, { status: 500 });
        }

        const teamInfo = await teamInfoRes.json();
        console.log(`[WEBHOOK] Current team info response:`, JSON.stringify(teamInfo, null, 2));

        // Fix: Read from nested team_info structure like in the frontend
        const currentTeamMaxBudget = 
          (teamInfo.team_info && typeof teamInfo.team_info.max_budget === "number") 
            ? teamInfo.team_info.max_budget 
            : (teamInfo.max_budget || 0);

        const newTeamMaxBudget = currentTeamMaxBudget + amountToAdd;

        console.log(`[WEBHOOK] Team budget calculation:`);
        console.log(`[WEBHOOK] - Current budget: $${currentTeamMaxBudget}`);
        console.log(`[WEBHOOK] - Amount to add: $${amountToAdd}`);
        console.log(`[WEBHOOK] - New budget: $${newTeamMaxBudget}`);

        // 2. Update team budget
        const updateTeamRes = await fetch(`${litellmBaseUrl}/team/update`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-litellm-api-key": litellmApiKey,
          },
          body: JSON.stringify({
            team_id: teamId,
            max_budget: newTeamMaxBudget,
          }),
        });

        if (!updateTeamRes.ok) {
          const errorText = await updateTeamRes.text();
          console.error(`[WEBHOOK] Failed to update team budget: ${updateTeamRes.status}`, errorText);
          return new NextResponse(`Failed to update team budget: ${updateTeamRes.statusText}`, { status: 500 });
        }

        const updateTeamResult = await updateTeamRes.json();
        console.log(`[WEBHOOK] Successfully updated team budget response:`, updateTeamResult);

        // 3. Verify the team budget was updated correctly
        const verifyTeamRes = await fetch(`${litellmBaseUrl}/team/info?team_id=${encodeURIComponent(teamId)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-litellm-api-key": litellmApiKey,
          },
        });

        if (verifyTeamRes.ok) {
          const verifyTeamInfo = await verifyTeamRes.json();
          const verifiedBudget = 
            (verifyTeamInfo.team_info && typeof verifyTeamInfo.team_info.max_budget === "number") 
              ? verifyTeamInfo.team_info.max_budget 
              : (verifyTeamInfo.max_budget || 0);
          console.log(`[WEBHOOK] Verified team budget after update: $${verifiedBudget}`);
        }

        // 4. Get all keys for the team and update their budgets
        let keysData: any = null;
        let updatedKeysCount = 0;

        const teamKeysRes = await fetch(`${litellmBaseUrl}/key/list?team_id=${encodeURIComponent(teamId)}&return_full_object=true`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-litellm-api-key": litellmApiKey,
          },
        });

        if (!teamKeysRes.ok) {
          console.error(`[WEBHOOK] Failed to fetch team keys: ${teamKeysRes.status}`);
          // Don't fail the webhook, but log the error
        } else {
          keysData = await teamKeysRes.json();
          const keys = keysData.keys || [];

          console.log(`[WEBHOOK] Found ${keys.length} keys for team ${teamId}`);

          // Update budget for each key in the team
          for (const keyInfo of keys) {
            try {
              const currentKeyMaxBudget = keyInfo.max_budget || 0;
              const newKeyMaxBudget = currentKeyMaxBudget + amountToAdd;

              console.log(`[WEBHOOK] Updating key ${keyInfo.key_alias || keyInfo.token || 'unknown'}:`);
              console.log(`[WEBHOOK] - Current key budget: $${currentKeyMaxBudget}`);
              console.log(`[WEBHOOK] - Amount to add: $${amountToAdd}`);
              console.log(`[WEBHOOK] - New key budget: $${newKeyMaxBudget}`);

              const updateKeyRes = await fetch(`${litellmBaseUrl}/key/update`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-litellm-api-key": litellmApiKey,
                },
                body: JSON.stringify({
                  key: keyInfo.token || keyInfo.key,
                  max_budget: newKeyMaxBudget,
                }),
              });

              if (!updateKeyRes.ok) {
                const errorText = await updateKeyRes.text();
                console.error(`[WEBHOOK] Failed to update key budget for ${keyInfo.key_alias || keyInfo.token}: ${updateKeyRes.status}`, errorText);
                // Continue processing other keys even if one fails
              } else {
                const updateKeyResult = await updateKeyRes.json();
                console.log(`[WEBHOOK] Successfully updated key ${keyInfo.key_alias || keyInfo.token} budget:`, updateKeyResult);
                updatedKeysCount++;
              }
            } catch (keyError: any) {
              console.error(`[WEBHOOK] Error updating key ${keyInfo.key_alias || keyInfo.token}:`, keyError.message);
              // Continue with other keys
            }
          }
        }

        // 5. Final success log
        console.log(`[WEBHOOK] Payment processing complete for team ${teamId}:`);
        console.log(`[WEBHOOK] - Team budget updated from $${currentTeamMaxBudget} to $${newTeamMaxBudget}`);
        console.log(`[WEBHOOK] - Updated ${updatedKeysCount} of ${keysData?.keys?.length || 0} team keys`);

      } catch (error: any) {
        console.error(`[WEBHOOK] Error in webhook processing:`, error.message);
        return new NextResponse(`Error in webhook processing: ${error.message}`, { status: 500 });
      }
      break;
    
    default:
      console.log(`[WEBHOOK] Unhandled event type: ${event.type}`);
  }

  return new NextResponse("OK", { status: 200 });
}
