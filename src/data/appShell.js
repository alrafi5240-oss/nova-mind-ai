import {
  Code2,
  Compass,
  FileText,
  Globe,
  ImagePlus,
  LayoutDashboard,
  Mail,
  Megaphone,
  MessageSquareText,
  NotebookPen,
  PenSquare,
  ScanSearch,
  ScrollText,
  Sparkles,
  UserRound,
} from 'lucide-react';

export const primaryNavItems = [
  { id: 'workspace', label: 'Workspace', icon: Sparkles },
  { id: 'quick-tools', label: 'Quick Tools', icon: Compass },
  { id: 'library', label: 'Library', icon: LayoutDashboard },
];

export const workspaceTools = [
  {
    id: 'chat-assistant',
    label: 'Chat Assistant',
    description: 'Reason through ideas, drafts, and execution plans.',
    icon: MessageSquareText,
    accent: 'bg-gradient-to-br from-pink-200 to-violet-200 text-violet-700 dark:from-fuchsia-500/20 dark:to-violet-500/20 dark:text-violet-200',
  },
  {
    id: 'image-generator',
    label: 'Image Generator',
    description: 'Create polished concepts and visual directions.',
    icon: ImagePlus,
    accent: 'bg-gradient-to-br from-sky-200 to-cyan-200 text-sky-700 dark:from-sky-500/20 dark:to-cyan-500/20 dark:text-sky-200',
  },
  {
    id: 'image-analysis',
    label: 'Image Analysis',
    description: 'Break down screenshots, references, and visuals.',
    icon: ScanSearch,
    accent: 'bg-gradient-to-br from-amber-200 to-rose-200 text-amber-700 dark:from-amber-500/20 dark:to-rose-500/20 dark:text-amber-200',
  },
  {
    id: 'pdf-chat',
    label: 'PDF Chat',
    description: 'Interrogate documents with focused follow-ups.',
    icon: FileText,
    accent: 'bg-gradient-to-br from-emerald-200 to-teal-200 text-emerald-700 dark:from-emerald-500/20 dark:to-teal-500/20 dark:text-emerald-200',
  },
];

export const productivityTools = [
  {
    id: 'text-rewriter',
    label: 'Text Rewriter',
    description: 'Refine, simplify, or sharpen copy in seconds.',
    icon: PenSquare,
    accent:
      'bg-gradient-to-br from-fuchsia-200 to-rose-200 text-rose-700 dark:from-fuchsia-500/20 dark:to-rose-500/20 dark:text-rose-200',
  },
  {
    id: 'email-writer',
    label: 'Email Writer',
    description: 'Draft polished replies, follow-ups, and outreach.',
    icon: Mail,
    accent:
      'bg-gradient-to-br from-sky-200 to-indigo-200 text-sky-700 dark:from-sky-500/20 dark:to-indigo-500/20 dark:text-sky-200',
  },
  {
    id: 'cv-generator',
    label: 'CV Generator',
    description: 'Turn experience into a cleaner, stronger resume.',
    icon: UserRound,
    accent:
      'bg-gradient-to-br from-emerald-200 to-lime-200 text-emerald-700 dark:from-emerald-500/20 dark:to-lime-500/20 dark:text-emerald-200',
  },
  {
    id: 'notes-ai',
    label: 'Notes AI',
    description: 'Summarize notes, meetings, and quick captures.',
    icon: NotebookPen,
    accent:
      'bg-gradient-to-br from-amber-200 to-orange-200 text-amber-700 dark:from-amber-500/20 dark:to-orange-500/20 dark:text-amber-200',
  },
];

export const advancedAiTools = [
  {
    id: 'code-assistant',
    label: 'Code Assistant',
    description: 'Plan features, debug flows, and ship faster.',
    icon: Code2,
    accent:
      'bg-gradient-to-br from-cyan-200 to-blue-200 text-cyan-700 dark:from-cyan-500/20 dark:to-blue-500/20 dark:text-cyan-200',
  },
  {
    id: 'website-builder',
    label: 'Website Builder',
    description: 'Generate layouts, copy, and page direction.',
    icon: Globe,
    accent:
      'bg-gradient-to-br from-violet-200 to-indigo-200 text-violet-700 dark:from-violet-500/20 dark:to-indigo-500/20 dark:text-violet-200',
  },
  {
    id: 'marketing-generator',
    label: 'Marketing Generator',
    description: 'Create launch hooks, campaigns, and messaging.',
    icon: Megaphone,
    accent:
      'bg-gradient-to-br from-pink-200 to-red-200 text-pink-700 dark:from-pink-500/20 dark:to-red-500/20 dark:text-pink-200',
  },
  {
    id: 'script-writer',
    label: 'Script Writer',
    description: 'Shape video, ad, and presentation scripts fast.',
    icon: ScrollText,
    accent:
      'bg-gradient-to-br from-teal-200 to-cyan-200 text-teal-700 dark:from-teal-500/20 dark:to-cyan-500/20 dark:text-teal-200',
  },
];

export const quickToolSections = [
  {
    id: 'ai-core-tools',
    title: 'AI Core Tools',
    description: 'Core assistants for conversation, image work, and document tasks.',
    tools: workspaceTools,
  },
  {
    id: 'productivity-tools',
    title: 'Productivity Tools',
    description: 'Fast helpers for writing, communication, and daily output.',
    tools: productivityTools,
  },
  {
    id: 'advanced-ai-tools',
    title: 'Advanced AI Tools',
    description: 'Higher-leverage tools for product, growth, and execution work.',
    tools: advancedAiTools,
  },
];

export const allQuickTools = quickToolSections.flatMap((section) => section.tools);
export const quickToolLookup = Object.fromEntries(allQuickTools.map((tool) => [tool.id, tool]));

export const starterPrompts = [
  {
    id: 'launch-plan',
    title: 'Build a launch plan',
    prompt: 'Create a clean launch plan for a premium AI SaaS app with positioning, pricing, and first-week growth priorities.',
  },
  {
    id: 'product-copy',
    title: 'Write product copy',
    prompt: 'Write homepage copy for an AI assistant app that feels clear, premium, and useful instead of hype-heavy.',
  },
  {
    id: 'ux-review',
    title: 'Review this UX',
    prompt: 'Review my current app UX and tell me the highest-impact changes for hierarchy, spacing, and conversion.',
  },
  {
    id: 'feature-spec',
    title: 'Shape a feature spec',
    prompt: 'Turn this rough feature idea into a concise product spec with user flow, edge cases, and success criteria.',
  },
];

export const conversationSections = [
  {
    label: 'Today',
    items: [
      {
        id: 'launch-strategy',
        title: 'Launch strategy',
        preview: 'Homepage positioning and growth hooks',
        updatedAt: '2m ago',
      },
      {
        id: 'voice-flow',
        title: 'Voice flow cleanup',
        preview: 'Improve the listening state and sticky input UX',
        updatedAt: '18m ago',
      },
    ],
  },
  {
    label: 'Yesterday',
    items: [
      {
        id: 'pricing-copy',
        title: 'Pricing copy',
        preview: 'Refine plan naming and premium positioning',
        updatedAt: 'Yesterday',
      },
      {
        id: 'doc-chat',
        title: 'PDF experience',
        preview: 'Outline the document analysis flow',
        updatedAt: 'Yesterday',
      },
    ],
  },
];

export const initialMessagesByConversation = {
  'launch-strategy': [
    {
      id: 'msg-1',
      role: 'assistant',
      content:
        'This workspace is set up for product thinking, UI review, and launch planning. Share the next task and I will help you turn it into something sharper and more usable.',
      timestamp: 'Now',
    },
  ],
  'voice-flow': [
    {
      id: 'msg-2',
      role: 'assistant',
      content:
        'For the voice flow, keep the listening state calm, show one clear status line, and keep the primary mic action anchored at the bottom so the hand path feels natural.',
      timestamp: '18m ago',
    },
    {
      id: 'msg-3',
      role: 'user',
      content: 'How would you simplify the voice screen for mobile?',
      timestamp: '17m ago',
    },
    {
      id: 'msg-4',
      role: 'assistant',
      content:
        'I would use a single animated focal element, one short status line, and one glowing mic button. Everything else should fade back so the user never wonders what to do next.',
      timestamp: '16m ago',
    },
  ],
  'pricing-copy': [
    {
      id: 'msg-5',
      role: 'assistant',
      content:
        'Premium pricing works best when each tier maps to a real usage pattern. Name the plans by job-to-be-done, not by generic level labels.',
      timestamp: 'Yesterday',
    },
  ],
  'doc-chat': [
    {
      id: 'msg-6',
      role: 'assistant',
      content:
        'A good PDF chat flow starts with extraction confidence, then moves into summary, citation, and follow-up questioning without forcing the user to switch views.',
      timestamp: 'Yesterday',
    },
  ],
};
