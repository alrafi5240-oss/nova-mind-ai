import {
  Bot,
  BrainCircuit,
  ClipboardList,
  Code2,
  CreditCard,
  Globe2,
  Image,
  Monitor,
  MonitorSmartphone,
  Newspaper,
  Scale,
  ShieldCheck,
  Sparkles,
  WalletCards,
  Workflow,
} from 'lucide-react';

export const NOVA_PLATFORM = {
  name: 'NOVA MIND AI',
  slogan: 'Stop chatting. Start building.',
  hero: {
    badge: 'Next-gen AI operating system',
    title: 'Not just AI. Your digital brain.',
    subtitle: 'One calm workspace for execution, automation, and intelligent decision-making.',
    description:
      'NOVA MIND AI brings planning, coding, analysis, media work, and agent execution into one premium control layer built for serious operators, builders, and teams.',
    ctaPrimary: 'Start building free',
    ctaSecondary: 'See Pro Agent',
    chips: [
      'Global intelligence',
      'Country-aware reasoning',
      'Coding and execution',
      'Agent mode for serious work',
    ],
  },
};

export const LANDING_CAPABILITIES = [
  {
    icon: BrainCircuit,
    title: 'Understands the world',
    description:
      'Works across language, market, and context so the workspace stays globally useful from the first prompt.',
    bullets: [
      'Bangla, English, Arabic, Urdu, Persian, and more',
      'Natural responses shaped by region and use case',
    ],
  },
  {
    icon: Scale,
    title: 'Legal + smart awareness',
    description:
      'Designed to think through country-specific laws, policy, risk, and behavior before suggesting a next move.',
    bullets: [
      'Country-aware guidance',
      'Safer decision paths for sensitive work',
    ],
  },
  {
    icon: Newspaper,
    title: 'Real-time intelligence',
    description:
      'Turns fast-changing information into usable signal instead of noisy summaries and stale responses.',
    bullets: [
      'Real-time news understanding',
      'Country-specific intelligence when it matters',
    ],
  },
  {
    icon: Image,
    title: 'Create without limits',
    description:
      'Supports image editing, creative direction, poster generation, and media workflows inside one premium system.',
    bullets: [
      'Visual campaigns from a single brief',
      'Creative generation for design and media work',
    ],
  },
  {
    icon: Code2,
    title: 'Build, code, execute',
    description:
      'Moves beyond chat into coding, debugging, planning, architecture thinking, and operational execution.',
    bullets: [
      'AI coding and debugging engine',
      'Built for real production work',
    ],
  },
  {
    icon: MonitorSmartphone,
    title: 'Smart device system',
    description:
      'Desktop gets the full power control center. Mobile stays fast, focused, and intentionally lightweight.',
    bullets: [
      'Mac and PC for heavy work',
      'iOS and Android for lightweight access',
    ],
  },
];

export const PLATFORM_PANELS = [
  {
    icon: Monitor,
    title: 'Desktop: full control center',
    description:
      'Mac and PC become the primary workspace for coding, automation, execution, and heavy operational work.',
    bullets: [
      'Best for deep work and file-aware execution',
      'The premium environment for advanced control',
    ],
  },
  {
    icon: MonitorSmartphone,
    title: 'Mobile: lightweight interface',
    description:
      'iOS and Android stay fast and minimal for monitoring, chatting, and quick interaction while heavy work stays on desktop.',
    bullets: [
      'Light interaction only',
      'Optimized for quick status and conversation',
    ],
  },
  {
    icon: Sparkles,
    title: 'System behavior',
    description:
      'NOVA behaves like a premium operating layer that observes, plans, checks permissions, and executes with structure.',
    bullets: [
      'Planning + permissions + execution',
      'Designed to feel like power, not just software',
    ],
  },
];

export const PAYMENT_METHODS = [
  {
    icon: CreditCard,
    title: 'USD Card',
    body: 'Stripe-grade checkout for global users with instant activation and a clean premium billing experience.',
    meta: 'Visa, Mastercard, AMEX',
  },
  {
    icon: WalletCards,
    title: 'Crypto',
    body: 'USDT TRC20 with QR, polling, and auto verification for fast, low-friction upgrades.',
    meta: 'Auto-verified crypto',
  },
  {
    icon: ShieldCheck,
    title: 'BDT Card',
    body: 'Local card gateway flow for Bangladesh users through SSLCommerz or ShurjoPay style checkout.',
    meta: 'Local gateway',
  },
];

export const PLAN_PREVIEWS = [
  { name: 'Basic', price: '550৳', tone: 'Fast access and a clean starting point.' },
  { name: 'Standard', price: '1300৳', tone: 'More speed, coding access, and higher daily capacity.' },
  { name: 'Advance', price: '2750৳', tone: 'Deeper analysis, larger context, and stronger throughput.' },
  { name: 'Pro Agent', price: '15199৳', tone: 'The strongest balance of power, automation, and execution.' },
  { name: 'Elite Ultra', price: '29999৳', tone: 'Maximum performance, maximum priority, and premium support.' },
];

export const AGENT_STEPS = [
  'Observe the workspace and understand context',
  'Plan the right path before acting',
  'Execute with permission-aware control',
];

export const MARKETING_SYSTEM = {
  videoScript: [
    'Hook: Still using 5 apps? 😳',
    'Problem: Design, Video, Coding — all separate 😩',
    'Solution: NOVA MIND AI 😈🔥',
    'Feature: AI handles planning, coding, creation, and execution automatically 🤖',
    'CTA: Start from 550৳. Stop chatting. Start BUILDING 🔥',
  ],
  adCopy: {
    facebook:
      'Still switching between chat, design, coding, and payment tools? NOVA MIND AI brings execution, automation, and intelligent decisions into one premium workspace. Stop chatting. Start BUILDING 🔥',
    youtube:
      'NOVA MIND AI is not just another chatbot. It is your digital brain, execution engine, and operator system. Build faster, automate more, and upgrade into a full AI workspace.',
  },
  onboarding: [
    'Welcome to NOVA MIND AI. This workspace is designed for execution, not idle prompting.',
    'Use Chat Mode for speed, Coding Mode for production work, and Agent Mode for multi-step execution.',
    'Desktop unlocks the full control center. Mobile keeps the experience light and focused.',
  ],
  dashboardWelcome: {
    title: 'Build with clarity.',
    body: 'Your workspace is ready for execution, automation, and serious work across coding, planning, and operator-grade AI actions.',
  },
};
