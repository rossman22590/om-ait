import { config } from '../config';
import { gatewayModelCatalog } from '../llm-gateway/models/catalog-models';
import { platformDefaultModelId } from '../llm-gateway/models/served-managed-models';
import { projectLlmGatewayEnabledById } from '../llm-gateway/enablement';
import { isModelServableForAccount } from '../llm-gateway/resolution/default-model';
import { accountMayUseManagedModels } from '../billing/services/entitlements';

/**
 * A chat message that carries an image is unanswerable on a text-only model.
 *
 * The platform default (`deepseek-v4-flash`) declares `input.image: false`, so
 * OpenCode never sends the image upstream at all: the agent downloads the file,
 * calls `read`, gets "Image read successfully", and then has nothing to look
 * at. It hunts for ImageMagick / tesseract / an OCR API and the turn dies with
 * no answer. Observed live on Teams 2026-09-19 (session
 * 196a99f5-8d4d-4d48-988e-cec7152e0d10).
 *
 * `LLM_GATEWAY_VISION_MODEL` already encodes the platform's answer for this —
 * "route image-bearing DEFAULT-model requests to this model" — but the gateway
 * rule (llm-gateway/routing/resolve-route.ts) can only fire when an image part
 * reaches the gateway, and OpenCode strips it before that. So a channel that
 * KNOWS the inbound message has an image must pick the model itself, up front.
 *
 * Off-gateway (self-host with native provider refs) this is a no-op: the
 * managed catalog does not describe those models and the vision target is a
 * managed slug that does not exist there.
 */

function wireModelId(model: string): string {
  return model.startsWith('kortix/') ? model.slice('kortix/'.length) : model;
}

export function modelReadsImages(projectId: string, model: string | null | undefined): boolean {
  if (!model) return false;
  return gatewayModelCatalog(projectId)[wireModelId(model)]?.attachment === true;
}

/**
 * The model this turn must run on to be able to read an inbound image, or
 * `null` when the current model already reads images, no vision target is
 * configured, or the configured target cannot read images either.
 *
 * `currentModel` is the channel binding's pick (`/model` in the chat); `null`
 * means the session would take the platform default.
 */
export function visionModelFor(projectId: string, currentModel: string | null | undefined): string | null {
  const target = config.LLM_GATEWAY_VISION_MODEL?.trim();
  if (!target) return null;
  const effective = currentModel || platformDefaultModelId();
  if (modelReadsImages(projectId, effective)) return null;
  if (!modelReadsImages(projectId, target)) return null;
  return target;
}

/**
 * The same decision, gated on the project actually routing through the gateway
 * AND on the target being servable for this account.
 *
 * The servability probe is not optional: a free-tier account sees no managed
 * models at all, and forwarding a prompt pinned to one the gateway will refuse
 * turns a degraded answer into a failed turn. When anything is uncertain the
 * answer is `null` — the turn then behaves exactly as it did before.
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
  const target = visionModelFor(projectId, currentModel);
  if (!target) return null;
  const freeModelsOnly = !(await accountMayUseManagedModels(accountId).catch(() => false));
  const servable = await isModelServableForAccount({
    userId,
    accountId,
    projectId,
    freeModelsOnly,
    model: target,
  }).catch(() => false);
  if (!servable) {
    console.info('[channels] no vision model for this account — the image turn runs unchanged', {
      projectId,
      target,
    });
    return null;
  }
  return target;
}

/** `{ providerID, modelID }` for a prompt-level model override. */
export function promptModelOverride(model: string): { providerID: string; modelID: string } {
  const wire = wireModelId(model);
  const slash = model.startsWith('kortix/') ? -1 : wire.indexOf('/');
  if (slash > 0) return { providerID: wire.slice(0, slash), modelID: wire.slice(slash + 1) };
  return { providerID: 'kortix', modelID: wire };
}
