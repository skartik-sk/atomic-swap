// Vite plugin to handle Safe wallet import issues
export function safeWalletFix() {
  return {
    name: 'safe-wallet-fix',
    resolveId(id) {
      // Handle the problematic Safe wallet imports
      if (id === '@safe-global/safe-apps-provider' || 
          id === '@safe-global/safe-apps-sdk' ||
          id.includes('safe-apps-provider') ||
          id.includes('safe-apps-sdk')) {
        // Return a virtual module ID
        return 'virtual:safe-wallet-stub'
      }
    },
    load(id) {
      if (id === 'virtual:safe-wallet-stub') {
        // Return a stub implementation with correct exports
        return `
          export class SafeAppProvider {
            constructor() {}
          }
          export default class SafeAppsSDK {
            constructor() {}
          }
          export const SafeAppsSDK = SafeAppsSDK;
        `
      }
    }
  }
}
