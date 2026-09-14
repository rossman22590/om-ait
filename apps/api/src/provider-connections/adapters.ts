import { startCodexDeviceAuth, pollCodexDeviceAuth } from '../projects/codex-device-auth';
import { resolveCatalogUpstream } from '../llm-gateway/models/provider-registry';
import { runtimeModelCatalog } from '../llm-gateway/models/runtime-catalog';

export interface ProviderConnectionAdapter {
  id: string;
  name: string;
  authType: 'api_key' | 'device_oauth';
  secretName: string;
  start?: typeof startCodexDeviceAuth;
  poll?: typeof pollCodexDeviceAuth;
}

export function providerConnectionAdapters(): ProviderConnectionAdapter[] {
  const adapters: ProviderConnectionAdapter[] = [{
    id: 'codex', name: 'ChatGPT subscription', authType: 'device_oauth',
    secretName: 'CODEX_AUTH_JSON', start: startCodexDeviceAuth, poll: pollCodexDeviceAuth,
  }];
  for (const provider of runtimeModelCatalog.snapshot().providers) {
    const upstream = resolveCatalogUpstream(provider.id);
    // Multi-field credentials need a dedicated adapter before personal use.
    if (!upstream || upstream.kind === 'bedrock') continue;
    adapters.push({ id: provider.id, name: provider.name, authType: 'api_key', secretName: upstream.envVar });
  }
  return adapters;
}

export function providerConnectionAdapter(id: string) {
  return providerConnectionAdapters().find((adapter) => adapter.id === id);
}
