// Adsterra Native Banner configuration — Phase 1 experiment ONLY.
//
// Scope: a single Native Banner slot on 8 experiment pages under /best/,
// placed next to the existing AdSense content-mid slot.
// Deliberately independent from adsense.ts so the two networks can be
// toggled / audited / rolled back separately.
//
// The script URL and container ID below are the official Adsterra-generated
// codes for toolstep.top — do not edit them.
//
// ADSTERRA_CONFIG.enabled is the master switch. It ships as `false` so the
// experiment never loads any third-party script until explicitly enabled.

export interface AdsterraConfig {
  /** Master switch — false = component renders nothing, zero third-party requests. */
  enabled: boolean;
  /** Official Adsterra invoke.js URL for the Native Banner zone. */
  scriptSrc: string;
  /** Official Adsterra container div id the invoke.js injects into. */
  containerId: string;
  /** Reserved container min-height in px — keeps CLS at 0 before/if the creative renders. */
  reservedMinHeight: number;
}

export const ADSTERRA_CONFIG: AdsterraConfig = {
  // Experiment ENABLED (Phase 1): 8 /best/ pages, single Native Banner at content-mid.
  // Rollback = flip back to false.
  enabled: true,
  scriptSrc:
    'https://pl31180616.profitableratecpmnetwork.com/115f0347827dcc42197dfe9f0a88d287/invoke.js',
  containerId: 'container-115f0347827dcc42197dfe9f0a88d287',
  reservedMinHeight: 250,
};
