import { FileText, ImagePlus, MessageSquareText, ScanSearch } from 'lucide-react';

export const tools = [
  {
    id: 'chat-assistant',
    label: 'Chat Assistant',
    description: 'Fast, natural help for planning, writing, and everyday decision making.',
    icon: MessageSquareText,
    category: 'Conversation',
    lastUsed: 'Just now',
    accent: 'from-pink-300/80 via-fuchsia-200/70 to-violet-300/80',
    tags: ['chat', 'assistant', 'prompting'],
  },
  {
    id: 'image-generator',
    label: 'Image Generator',
    description: 'Turn ideas into polished visual concepts, illustrations, and product art.',
    icon: ImagePlus,
    category: 'Creative',
    lastUsed: '12m ago',
    accent: 'from-cyan-300/80 via-sky-200/70 to-indigo-300/80',
    tags: ['image', 'creative', 'art'],
  },
  {
    id: 'image-analysis',
    label: 'Image Analysis',
    description: 'Extract details, inspect screenshots, and explain visuals with clarity.',
    icon: ScanSearch,
    category: 'Analysis',
    lastUsed: 'Yesterday',
    accent: 'from-amber-200/80 via-rose-200/70 to-fuchsia-300/80',
    tags: ['vision', 'analysis', 'screenshots'],
  },
  {
    id: 'pdf-chat',
    label: 'PDF Chat',
    description: 'Ask questions across documents and get concise, context-aware answers.',
    icon: FileText,
    category: 'Documents',
    lastUsed: '2d ago',
    accent: 'from-emerald-200/80 via-teal-200/70 to-cyan-300/80',
    tags: ['pdf', 'docs', 'summaries'],
  },
];

export const recentToolIds = ['chat-assistant', 'image-analysis', 'pdf-chat'];
