import { Globe2, ImagePlus, Megaphone, Sparkles } from 'lucide-react';

const ICONS = {
  build_website: Globe2,
  generate_logo: ImagePlus,
  write_ad_copy: Megaphone,
  default: Sparkles,
};

export default function QuickActionBar({ actions, onTrigger }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {actions.map((action) => {
        const Icon = ICONS[action.id] || ICONS.default;

        return (
          <button
            key={action.id}
            type="button"
            onClick={() => onTrigger(action)}
            className="quick-action-pill interactive-ripple"
          >
            <Icon className="h-4 w-4" />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
