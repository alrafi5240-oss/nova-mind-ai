import { useState } from 'react';
import { Camera, Paperclip, SendHorizontal } from 'lucide-react';
import AttachmentToolsSheet from './AttachmentToolsSheet';

const QUICK_ACTIONS = [
  { id: 'website', label: 'Build website', prompt: 'Help me plan and structure a modern marketing website with clear sections, copy direction, and a simple launch checklist.' },
  { id: 'logo', label: 'Generate logo', prompt: 'I need logo concepts for my brand. Ask me for the name and vibe, then suggest directions, color palettes, and symbol ideas I can brief a designer or an image model with.' },
  { id: 'ad', label: 'Write ad copy', prompt: 'Write concise ad copy variants for a paid social campaign: one hook-led version, one benefit-led version, and a short retargeting line. Keep tone premium and clear.' },
];

export default function ComposerBar({
  draft,
  isGenerating,
  onDraftChange,
  onSend,
  onQuickAction,
  onAttachmentToolSelect,
}) {
  const [attachmentSheetOpen, setAttachmentSheetOpen] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSend(draft);
  };

  return (
    <div className="sticky bottom-0 z-30 -mx-4 shrink-0 border-t border-slate-100 bg-white/95 px-4 pb-4 pt-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/95 sm:-mx-6 sm:px-6">
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="mb-4 flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => onQuickAction?.(action.prompt)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition duration-200 ease-out hover:border-slate-300 hover:bg-slate-50 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              {action.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex w-full items-end gap-2 rounded-full border border-slate-200 bg-white p-2 pl-3 shadow-[0_4px_24px_rgba(15,23,42,0.08)] transition duration-300 ease-out focus-within:border-slate-300 focus-within:shadow-[0_8px_32px_rgba(15,23,42,0.1)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] dark:focus-within:border-slate-600"
        >
          <button
            type="button"
            onClick={() => setAttachmentSheetOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 transition duration-200 ease-out hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Open attachment and tools"
            aria-haspopup="dialog"
            aria-expanded={attachmentSheetOpen}
          >
            <Paperclip className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
          </button>

          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 transition duration-200 ease-out hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Open camera"
          >
            <Camera className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
          </button>

          <div className="min-w-0 flex-1 py-1">
            <textarea
              rows={1}
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  onSend(draft);
                }
              }}
              placeholder="Message NOVA MIND AI…"
              className="max-h-36 min-h-[44px] w-full resize-none bg-transparent py-2.5 text-[0.9375rem] leading-6 text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          <button
            type="submit"
            disabled={!draft.trim() || isGenerating}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm transition duration-200 ease-out hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            aria-label={isGenerating ? 'Generating response' : 'Send message'}
          >
            <SendHorizontal className="h-4 w-4" />
          </button>
        </form>
      </div>

      <AttachmentToolsSheet
        open={attachmentSheetOpen}
        onClose={() => setAttachmentSheetOpen(false)}
        onToolSelect={onAttachmentToolSelect}
      />
    </div>
  );
}
