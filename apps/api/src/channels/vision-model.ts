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
 * Every model this project can serve, cheapest first, vision-capable first
 * when the message needs it.
 */
function replacementCandidates(
  projectId: string,
  currentModel: string | null,
  needsVision: boolean,
): string[] {
  const catalog = gatewayModelCatalog(projectId);
  const preferred = [
    ...(needsVision ? [config.LLM_GATEWAY_VISION_MODEL?.trim()] : []),
    platformDefaultModelId(),
  ].filter((m): m is string => !!m);
  const byCost = Object.entries(catalog)
    .filter(([, m]) => (needsVision ? m.attachment === true : true))
    .sort(([, a], [, b]) => inputCostOf(a.cost) - inputCostOf(b.cost))
    .map(([id]) => id);

  const current = currentModel ? wireModelId(currentModel) : null;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const candidate of [...preferred, ...byCost]) {
    const wire = wireModelId(candidate);
    if (wire === current || seen.has(wire)) continue;
    const entry = catalog[wire];
    if (!entry) continue;
    if (needsVision && entry.attachment !== true) continue;
    seen.add(wire);
    out.push(wire);
    if (out.length >= MAX_CANDIDATE_PROBES) break;
  }
  return out;
}

/**
 * Preference order for an image-bearing message. Kept as its own export
 * because the ORDER is the safety story — see the module comment.
 */
export function visionCandidates(projectId: string, currentModel: string | null | undefined): string[] {
  return replacementCandidates(projectId, currentModel ?? null, true);
}

/**
 * The model this channel turn must run on, or `null` to leave it alone.
 *
 * Two things make a turn unanswerable before it starts, and both are
 * invisible to the person typing in Teams or Slack:
 *
 * 1. The message carries an image the pinned model cannot read (`hasImage`).
 * 2. The pinned model is no longer servable at all. Models are retired from
 *    the catalog, and nothing re-validates a session's pin — the dev Teams
 *    session was pinned to `deepseek-v4-flash` and
 *    `PUT /sessions/:id/model` answered
 *    `Model "deepseek-v4-flash" is not available for this account`, so every
 *    turn would have failed upstream with no way for the user to know why.
 *
 * The replacement is always probed with `isModelServableForAccount` first, so
 * this can never pin a turn to something the gateway will refuse. When nothing
 * qualifies the answer is `null` and the turn runs exactly as before.
 */
export async function channelTurnModel(input: {
  projectId: string;
  accountId: string;
  userId: string | null | undefined;
  currentModel: string | null | undefined;
  hasImage: boolean;
}): Promise<string | null> {
  const { projectId, accountId, userId, currentModel, hasImage } = input;
  if (!userId) return null;
  if (!(await projectLlmGatewayEnabledById(projectId).catch(() => false))) return null;

  const catalog = gatewayModelCatalog(projectId);
  const effective = currentModel || platformDefaultModelId();
  const needsVision = hasImage && !modelReadsImages(projectId, effective);

  // A pin the catalog no longer carries is the cheap signal for "retired".
  // Confirm it authoritatively before replacing anything: a BYOK ref can be
  // absent from this view for reasons that are not a retirement.
  let pinUnservable = false;
  const freeModelsOnly = !(await accountMayUseManagedModels(accountId).catch(() => false));
  const probe = (model: string) =>
    isModelServableForAccount({ userId, accountId, projectId, freeModelsOnly, model }).catch(
      () => false,
    );
  if (currentModel && !catalog[wireModelId(currentModel)]) {
    pinUnservable = !(await probe(wireModelId(currentModel)));
  }

  if (!needsVision && !pinUnservable) return null;

  const candidates = replacementCandidates(projectId, effective, needsVision);
  for (const model of candidates) {
    if (await probe(model)) {
      console.info('[channels] replacing this turn\'s model', {
        projectId,
        from: currentModel ?? null,
        to: model,
        reason: needsVision ? (pinUnservable ? 'image+retired' : 'image') : 'retired',
      });
      return model;
    }
  }
  console.info('[channels] no servable replacement model — the turn runs unchanged', {
    projectId,
    needsVision,
    pinUnservable,
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
