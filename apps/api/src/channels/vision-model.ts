import { config } from '../config';
import { gatewayModelCatalog } from '../llm-gateway/models/catalog-models';
import { platformDefaultModelId } from '../llm-gateway/models/served-managed-models';
import { projectLlmGatewayEnabledById } from '../llm-gateway/enablement';
import { isModelServableForAccount } from '../llm-gateway/resolution/default-model';
import { accountMayUseManagedModels } from '../billing/services/entitlements';

/**
 * A chat message that carries an image is unanswerable on a text-only model.
 *
 * `deepseek-v4-flash` declares `input.image: false`, so OpenCode never sends
 * the image upstream at all: the agent downloads the file, calls `read`, gets
 * "Image read successfully", and then has nothing to look at. It hunts for
 * ImageMagick / tesseract / an OCR API and the turn dies with no answer.
 * Observed live on Teams 2026-09-19 (session
 * 196a99f5-8d4d-4d48-988e-cec7152e0d10).
 *
 * `LLM_GATEWAY_VISION_MODEL` already encodes the platform's answer for this —
 * "route image-bearing DEFAULT-model requests to this model" — but the gateway
 * rule (llm-gateway/routing/resolve-route.ts) can only fire when an image part
 * reaches the gateway, and OpenCode strips it before that, precisely because
 * the model declares it cannot take one. So a channel that KNOWS the inbound
 * message has an image must pick the model itself, up front.
 *
 * The configured target is a PREFERENCE, not a guarantee. Probed live on dev
 * 2026-09-21, `gpt-5.6-luna` answers `The "gpt-5.6-luna" model requires
 * Kortix's managed provider, which is disabled on this deployment.` — pinning
 * a prompt to it turns a degraded answer into a failed turn. So every
 * candidate is checked with `isModelServableForAccount` and the search falls
 * through to what this account can actually serve (`glm-5.3-flash` on dev).
 * When nothing qualifies the answer is `null` and the turn runs unchanged.
 */

/** How many candidates to probe. A probe is a candidate resolution, not an upstream request. */
const MAX_CANDIDATE_PROBES = 6;

function wireModelId(model: string): string {
  return model.startsWith('kortix/') ? model.slice('kortix/'.length) : model;
}

export function modelReadsImages(projectId: string, model: string | null | undefined): boolean {
  if (!model) return false;
  return gatewayModelCatalog(projectId)[wireModelId(model)]?.attachment === true;
}

function inputCostOf(cost: { input?: number } | undefined): number {
  return typeof cost?.input === 'number' ? cost.input : Number.POSITIVE_INFINITY;
}

/**
 * Preference order: the operator's configured target, then the platform
 * default (often vision-capable in its own right), then the cheapest
 * vision-capable model the project's catalog carries. Deduped, capped, and
 * never the model we are trying to move off.
 */
export function visionCandidates(projectId: string, currentModel: string | null | undefined): string[] {
  const catalog = gatewayModelCatalog(projectId);
  const preferred = [config.LLM_GATEWAY_VISION_MODEL?.trim(), platformDefaultModelId()].filter(
    (m): m is string => !!m,
  );
  const byCost = Object.entries(catalog)
    .filter(([, m]) => m.attachment === true)
    .sort(([, a], [, b]) => inputCostOf(a.cost) - inputCostOf(b.cost))
    .map(([id]) => id);

  const current = currentModel ? wireModelId(currentModel) : null;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const candidate of [...preferred, ...byCost]) {
    const wire = wireModelId(candidate);
    if (wire === current || seen.has(wire)) continue;
    if (catalog[wire]?.attachment !== true) continue;
    seen.add(wire);
    out.push(wire);
    if (out.length >= MAX_CANDIDATE_PROBES) break;
  }
  return out;
}

/**
 * The model this turn must run on to be able to read an inbound image, or
 * `null` when the current model already reads images, the project is
 * off-gateway, or nothing servable can read one.
 *
 * `currentModel` is the session's pin (or the channel binding's `/model`
 * pick); `null` means the turn would take the platform default.
 */
export async function visionModelForProject(input: {
  projectId: string;
  accountId: string;
  userId: string | null | undefined;
  currentModel: string | null | undefined;
}): Promise<string | null> {
  const { projectId, accountId, userId, currentModel } = input;
  if (!userId) return null;
  if (!(await projectLlmGatewayEnabledById(projectId).catch(() => false))) return null;

  const effective = currentModel || platformDefaultModelId();
  if (modelReadsImages(projectId, effective)) return null;

  const candidates = visionCandidates(projectId, effective);
  if (candidates.length === 0) return null;

  const freeModelsOnly = !(await accountMayUseManagedModels(accountId).catch(() => false));
  for (const model of candidates) {
    const servable = await isModelServableForAccount({
      userId,
      accountId,
      projectId,
      freeModelsOnly,
      model,
    }).catch(() => false);
    if (servable) return model;
  }
  console.info('[channels] no servable vision model for this account — the image turn runs unchanged', {
    projectId,
    tried: candidates,
  });
  return null;
}

/** `{ providerID, modelID }` for a prompt-level model override. */
export function promptModelOverride(model: string): { providerID: string; modelID: string } {
  const wire = wireModelId(model);
  const slash = model.startsWith('kortix/') ? -1 : wire.indexOf('/');
  if (slash > 0) return { providerID: wire.slice(0, slash), modelID: wire.slice(slash + 1) };
  return { providerID: 'kortix', modelID: wire };
}
