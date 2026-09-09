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
  /** Native Banner: max 1 per page. */
  maxPerPage: 1;
  /** Adult ads are disabled for toolstep.top. */
  adultAds: false;
  /** Page types where the Native Banner is eligible. */
  eligibleTypes: string[];
}

export const ADSTERRA_CONFIG: AdsterraConfig = {
  // Master switch. Rollback = flip to false (site-wide Adsterra off, no code
  // deletion needed). The former 8-page /best/ experiment is now part of this
  // unified rollout.
  enabled: true,
  scriptSrc:
    'https://pl31180616.profitableratecpmnetwork.com/115f0347827dcc42197dfe9f0a88d287/invoke.js',
  containerId: 'container-115f0347827dcc42197dfe9f0a88d287',
  reservedMinHeight: 250,
  // Native Banner: max 1 per page, adult ads disabled for this property.
  maxPerPage: 1 as const,
  adultAds: false as const,
  // Rollout: page types where the Native Banner is eligible (Tier A commercial
  // content). Static /reviews/*.astro pages are Tier B — deferred to a later
  // stage because they are individually hand-authored files.
  eligibleTypes: ['best', 'compare', 'alternatives', 'reviews'],
};

/** Whether the Native Banner may render for a given page type. */
export function isAdsterraEnabledForPage(pageType: string): boolean {
  return ADSTERRA_CONFIG.enabled && ADSTERRA_CONFIG.eligibleTypes.includes(pageType);
}
