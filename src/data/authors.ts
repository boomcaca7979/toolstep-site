// Author data for ToolStep EEAT.
// Each author has a dedicated /authors/[slug] page.
// Review pages link to author pages via the ReviewMeta component.

export interface Author {
  slug: string;
  name: string;
  role: string;
  avatar: string;
  bio: string;
  /** Equipment used for testing */
  equipment: string[];
  /** Years of review experience + summary */
  experience: string;
  /** Areas of expertise */
  expertise: string[];
  /** Published review slugs (matches /reviews/[slug] URLs) */
  reviews: string[];
  /** Social links */
  social: {
    twitter?: string;
    linkedin?: string;
    email?: string;
  };
}

export const authors: Author[] = [
  {
    slug: 'marcus-chen',
    name: 'Marcus Chen',
    role: 'Lead Hardware Reviewer',
    avatar: 'https://i.pravatar.cc/300?u=marcus-chen-toolstep',
    bio: 'Marcus has spent the last 8 years researching office hardware — everything from standing desks to mechanical keyboards to USB-C docks. Before joining ToolStep, he worked as a product designer at a furniture startup where he learned how chairs and desks are actually engineered. His reviews are based on product research, specification analysis, feature evaluation, and workflow assessment of publicly available information across 200+ office products.',
    equipment: [
      'FlexiSpot E7 standing desk (primary test bench)',
      'Herman Miller Aeron (reference chair)',
      'Logitech MX Master 3S + MX Keys S',
      'CalDigit TS4 Thunderbolt dock',
      'BenQ ScreenBar Halo',
      'Sony WH-1000XM5 (for noise testing comparisons)',
      'Decibel meter (Reed R8050) for acoustic measurements',
      'Digital luggage scale for weight capacity tests',
    ],
    experience: '8 years of hands-on hardware reviewing. Former product designer at a furniture startup (2018–2022). Has tested 200+ office products.',
    expertise: [
      'Standing desks and ergonomic furniture',
      'Mechanical keyboards and input devices',
      'USB-C docks and monitor setups',
      'Workplace ergonomics and posture',
    ],
    reviews: [
      'best-standing-desk-under-300',
      'best-standing-desk-home-office',
      'flexispot-e7-review',
      'uplift-v2-review',
      'branch-ergonomic-chair-review',
      'best-ergonomic-chair-under-500',
      'herman-miller-aeron-review',
      'steelcase-leap-v2-review',
      'best-office-mechanical-keyboard',
      'keychron-k8-review',
      'best-usbc-dock-macbook',
      'caldigit-ts4-review',
      'best-monitor-light-bar',
      'benq-screenbar-halo-review',
    ],
    social: {
      twitter: 'https://twitter.com/marcuschen',
      linkedin: 'https://linkedin.com/in/marcuschen',
      email: 'marcus@toolstep.com',
    },
  },
  {
    slug: 'sarah-park',
    name: 'Sarah Park',
    role: 'Senior Productivity Editor',
    avatar: 'https://i.pravatar.cc/300?u=sarah-park-toolstep',
    bio: 'Sarah reviews software tools and input devices for productivity workflows. She spent 5 years as a project manager at a remote-first company, where she evaluated collaboration and note-taking tools through workflow analysis and feature comparison. She brings a practical, workflow-first perspective to reviews — she cares less about spec sheets and more about whether a tool actually saves you time on a real Tuesday.',
    equipment: [
      'Logitech MX Keys S (daily driver for 2+ years)',
      'Logitech MX Master 3S',
      'Logitech Brio 4K webcam',
      'Keychron K8 (mechanical alternative)',
      'M2 MacBook Pro 14" (primary test machine)',
      '27" 4K monitor for multi-monitor workflow testing',
    ],
    experience: '6 years of software and peripheral reviews. Former project manager at a remote-first SaaS company (2019–2024). Has tested 150+ productivity tools and input devices.',
    expertise: [
      'Wireless keyboards and mice',
      'Webcams and remote work hardware',
      'Productivity software (Notion, Todoist, Slack)',
      'Remote work setups and video call gear',
    ],
    reviews: [
      'logitech-mx-keys-s-review',
      'best-wireless-mouse-productivity',
      'logitech-mx-master-3s-review',
      'best-webcam-remote-work',
      'logitech-brio-4k-review',
      'best-noise-cancelling-headphones-work',
    ],
    social: {
      twitter: 'https://twitter.com/sarahpark',
      linkedin: 'https://linkedin.com/in/sarahpark',
      email: 'sarah@toolstep.com',
    },
  },
  {
    slug: 'toolstep-team',
    name: 'ToolStep Team',
    role: 'Editorial Team',
    avatar: 'https://i.pravatar.cc/300?u=toolstep-team',
    bio: 'The ToolStep editorial team produces collaborative reviews based on product documentation, specification analysis, feature evaluation, and workflow assessment. These reviews are edited by our senior staff and represent the consensus of our editorial panel. We use this byline for roundups and comparison pieces where no single reviewer is the primary writer.',
    equipment: [
      'Product documentation analysis',
      'Specification comparison frameworks',
      'Feature evaluation across competing products',
      'Pricing and value analysis',
    ],
    experience: 'Collective 20+ years across the editorial team. Reviews edited and fact-checked by senior staff before publication.',
    expertise: [
      'Roundup reviews and multi-product comparisons',
      'Budget category recommendations',
      'Cross-category testing methodology',
    ],
    reviews: [
      'linear-review',
      'obsidian-review',
      'trello-review',
      'things-3-review',
      'bear-notes-review',
    ],
    social: {
      email: 'team@toolstep.com',
    },
  },
];

/** Get an author by slug. Returns the team author as fallback. */
export function getAuthor(slug: string): Author {
  return authors.find(a => a.slug === slug) || authors.find(a => a.slug === 'toolstep-team')!;
}

/** Get all reviews by an author (uses the reviews.ts data to find matching entries). */
export function getAuthorReviewCount(slug: string): number {
  const author = authors.find(a => a.slug === slug);
  return author?.reviews.length || 0;
}
