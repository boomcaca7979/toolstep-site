// Category Registry
// Defines all product categories with metadata for navigation, filtering, and SEO.
// Adding a new category here automatically makes it available across the site.

export interface Category {
  slug: string;
  name: string;
  pluralName: string;
  color: string;
  icon: string;
  description: string;
  parentCategory?: string;
}

export const categories: Category[] = [
  // Hardware — Desks & Chairs
  { slug: 'standing-desks', name: 'Standing Desk', pluralName: 'Standing Desks', color: '#ea580c', icon: 'desk', description: 'Electric and manual standing desks tested for stability, motor quality, and warranty.' },
  { slug: 'office-chairs', name: 'Office Chair', pluralName: 'Office Chairs', color: '#ea580c', icon: 'chair', description: 'Ergonomic office chairs tested for lumbar support, build quality, and all-day comfort.' },
  { slug: 'ergonomic-chairs', name: 'Ergonomic Chair', pluralName: 'Ergonomic Chairs', color: '#ea580c', icon: 'chair', description: 'Ergonomic chairs with adjustable lumbar, armrests, and seat depth.', parentCategory: 'office-chairs' },

  // Hardware — Input Devices
  { slug: 'keyboards', name: 'Keyboard', pluralName: 'Keyboards', color: '#2563eb', icon: 'keyboard', description: 'Mechanical and membrane keyboards tested for typing feel, build quality, and wireless reliability.' },
  { slug: 'mice', name: 'Mouse', pluralName: 'Mice', color: '#2563eb', icon: 'mouse', description: 'Wireless and wired mice tested for ergonomics, sensor accuracy, and battery life.' },

  // Hardware — Displays
  { slug: 'monitors', name: 'Monitor', pluralName: 'Monitors', color: '#7c3aed', icon: 'monitor', description: 'Desktop monitors tested for color accuracy, refresh rate, and ergonomic adjustability.' },
  { slug: 'webcams', name: 'Webcam', pluralName: 'Webcams', color: '#7c3aed', icon: 'camera', description: 'Webcams tested for video quality, low-light performance, and microphone clarity.' },

  // Hardware — Audio
  { slug: 'headphones', name: 'Headphones', pluralName: 'Headphones', color: '#db2777', icon: 'headphones', description: 'Wireless and wired headphones tested for ANC, sound quality, and call clarity.' },

  // Hardware — Connectivity
  { slug: 'docks', name: 'Dock', pluralName: 'Docks', color: '#0891b2', icon: 'dock', description: 'USB-C and Thunderbolt docks tested for bandwidth, charging, and display support.' },
  { slug: 'storage', name: 'Storage', pluralName: 'Storage', color: '#0891b2', icon: 'drive', description: 'External SSDs and hard drives tested for speed, durability, and value.' },

  // Hardware — Accessories
  { slug: 'desk-accessories', name: 'Desk Accessory', pluralName: 'Desk Accessories', color: '#059669', icon: 'accessory', description: 'Desk accessories including lamps, stands, pads, and cable management.' },

  // Software — AI Tools
  { slug: 'ai-assistants', name: 'AI Assistant', pluralName: 'AI Assistants', color: '#9333ea', icon: 'ai', description: 'AI chatbots and assistants tested for writing, coding, reasoning, and multimodal capabilities.' },
  { slug: 'ai-writing', name: 'AI Writing Tool', pluralName: 'AI Writing Tools', color: '#7c3aed', icon: 'edit', description: 'AI writing and grammar tools tested for content quality, tone, and workflow.' },
  { slug: 'ai-coding', name: 'AI Coding Tool', pluralName: 'AI Coding Tools', color: '#059669', icon: 'code', description: 'AI coding assistants tested for code completion, refactoring, and agent capabilities.' },
  { slug: 'ai-image', name: 'AI Image Generator', pluralName: 'AI Image Generators', color: '#db2777', icon: 'image', description: 'AI image generators tested for quality, control, and pricing.' },
  { slug: 'ai-video', name: 'AI Video Tool', pluralName: 'AI Video Tools', color: '#dc2626', icon: 'video', description: 'AI video generation and editing tools tested for output quality and workflow.' },

  // Software — Productivity
  { slug: 'productivity', name: 'Productivity Tool', pluralName: 'Productivity Tools', color: '#6366f1', icon: 'bolt', description: 'Productivity apps and workspace tools tested for workflow, collaboration, and team use.' },
  { slug: 'note-taking', name: 'Note App', pluralName: 'Note Apps', color: '#6366f1', icon: 'note', description: 'Note-taking apps tested for organization, sync, and knowledge management.' },
  { slug: 'task-management', name: 'Task Manager', pluralName: 'Task Managers', color: '#2563eb', icon: 'task', description: 'Task management apps tested for GTD workflows, collaboration, and automation.' },
  { slug: 'project-management', name: 'Project Management Tool', pluralName: 'Project Management Tools', color: '#7c3aed', icon: 'project', description: 'Project management tools tested for team workflows, reporting, and integrations.' },

  // Software — Design
  { slug: 'design-tools', name: 'Design Tool', pluralName: 'Design Tools', color: '#db2777', icon: 'design', description: 'Design tools tested for UI/UX, prototyping, and collaboration.' },

  // Software — Utilities
  { slug: 'security', name: 'Security Tool', pluralName: 'Security Tools', color: '#4f46d5', icon: 'shield', description: 'VPN, password managers, and security tools tested for protection and usability.' },
  { slug: 'cloud-storage', name: 'Cloud Storage', pluralName: 'Cloud Storage', color: '#0891b2', icon: 'cloud', description: 'Cloud storage services tested for space, sync, and security.' },
  { slug: 'video-tools', name: 'Video Tool', pluralName: 'Video Tools', color: '#dc2626', icon: 'video', description: 'Screen recorders and video editors tested for quality and ease of use.' },
];

/**
 * Get a category by slug.
 */
export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find(c => c.slug === slug);
}

/**
 * Get all categories in a parent group.
 */
export function getCategoriesByParent(parentSlug: string): Category[] {
  return categories.filter(c => c.parentCategory === parentSlug);
}

/**
 * Get top-level categories (no parent).
 */
export function getTopLevelCategories(): Category[] {
  return categories.filter(c => !c.parentCategory);
}
