export interface Tool {
	id: string;
	name: string;
	description: string;
	category: string;
	url: string;
	icon: string;
	rating: number;
	affiliateLink: string;
	isEditorsPick: boolean;
	addedDate: string;
}

export interface Category {
	id: string;
	name: string;
	icon: string;
}

export const categories: Category[] = [
	{ id: 'all', name: 'All Tools', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
	{ id: 'pdf', name: 'PDF Tools', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
	{ id: 'image', name: 'Image Tools', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
	{ id: 'ai-writing', name: 'AI Writing', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
	{ id: 'video', name: 'Video Tools', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
	{ id: 'productivity', name: 'Productivity', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
];

export const tools: Tool[] = [
	{
		id: 'smallpdf',
		name: 'Smallpdf',
		description: 'Online PDF editor, merge and compress.',
		category: 'pdf',
		url: 'https://smallpdf.com',
		icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
		rating: 4.5,
		affiliateLink: 'https://smallpdf.com?ref=toolwise',
		isEditorsPick: true,
		addedDate: '2026-05-19',
	},
	{
		id: 'tinypng',
		name: 'TinyPNG',
		description: 'Smart image compression without quality loss.',
		category: 'image',
		url: 'https://tinypng.com',
		icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
		rating: 4.8,
		affiliateLink: 'https://tinypng.com?ref=toolwise',
		isEditorsPick: false,
		addedDate: '2026-05-19',
	},
	{
		id: 'notion-ai',
		name: 'Notion AI',
		description: 'All-in-one workspace with AI writing.',
		category: 'ai-writing',
		url: 'https://www.notion.so/product/ai',
		icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
		rating: 4.7,
		affiliateLink: 'https://www.notion.so/product/ai?ref=toolwise',
		isEditorsPick: true,
		addedDate: '2026-05-19',
	},
	{
		id: 'deepl',
		name: 'DeepL',
		description: 'AI translator better than Google Translate.',
		category: 'ai-writing',
		url: 'https://www.deepl.com',
		icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129',
		rating: 4.6,
		affiliateLink: 'https://www.deepl.com?ref=toolwise',
		isEditorsPick: false,
		addedDate: '2026-05-19',
	},
	{
		id: 'grammarly',
		name: 'Grammarly',
		description: 'AI writing assistant for grammar.',
		category: 'ai-writing',
		url: 'https://www.grammarly.com',
		icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
		rating: 4.5,
		affiliateLink: 'https://www.grammarly.com?ref=toolwise',
		isEditorsPick: false,
		addedDate: '2026-05-19',
	},
	{
		id: 'obs-studio',
		name: 'OBS Studio',
		description: 'Free screen recorder for streaming.',
		category: 'video',
		url: 'https://obsproject.com',
		icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
		rating: 4.9,
		affiliateLink: 'https://obsproject.com?ref=toolwise',
		isEditorsPick: false,
		addedDate: '2026-05-19',
	},
	{
		id: 'capcut',
		name: 'CapCut',
		description: 'Free video editor.',
		category: 'video',
		url: 'https://www.capcut.com',
		icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
		rating: 4.4,
		affiliateLink: 'https://www.capcut.com?ref=toolwise',
		isEditorsPick: false,
		addedDate: '2026-05-19',
	},
	{
		id: 'canva',
		name: 'Canva',
		description: 'Graphic design made simple.',
		category: 'productivity',
		url: 'https://www.canva.com',
		icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
		rating: 4.8,
		affiliateLink: 'https://www.canva.com?ref=toolwise',
		isEditorsPick: false,
		addedDate: '2026-05-19',
	},
	{
		id: 'figma',
		name: 'Figma',
		description: 'Collaborative design tool.',
		category: 'productivity',
		url: 'https://www.figma.com',
		icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
		rating: 4.7,
		affiliateLink: 'https://www.figma.com?ref=toolwise',
		isEditorsPick: false,
		addedDate: '2026-05-19',
	},
	{
		id: 'xmind',
		name: 'XMind',
		description: 'Mind mapping and brainstorming tool.',
		category: 'productivity',
		url: 'https://xmind.app',
		icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.804-.98A9.998 9.998 0 0010.552 3.133a1 1 0 00-.552 1.334L9 7m0 13l6-3m-6 3V7m6 10V7m0 0L9 7',
		rating: 4.3,
		affiliateLink: 'https://xmind.app?ref=toolwise',
		isEditorsPick: false,
		addedDate: '2026-05-19',
	},
];
