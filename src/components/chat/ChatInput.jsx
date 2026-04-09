import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export default function ChatInput({
  onSend,
  isStreaming,
  disabled,
  variant = 'docked',
  placeholder,
  leftSlot = null,
  helperText,
}) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, variant === 'centered' ? 220 : 180)}px`;
  }, [message, variant]);

  const submit = () => {
    const trimmed = message.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend(trimmed);
    setMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const hasContent = message.trim().length > 0;
  const resolvedPlaceholder =
    placeholder || (disabled ? 'You have reached your message limit' : 'Message Nova Mind AI');
  const resolvedHelperText = helperText || 'Enter to send. Shift + Enter for a new line.';

  return (
    <div
      className={clsx(
        variant === 'docked'
          ? 'dock-backdrop pointer-events-none absolute inset-x-0 bottom-0 z-20 px-5 pb-7 pt-6 sm:px-7 lg:px-10'
          : 'w-full'
      )}
    >
      <div className="pointer-events-auto mx-auto w-full max-w-[900px]">
        <div className={clsx('composer-shell rounded-[30px] p-4 sm:p-5', variant === 'centered' ? 'rounded-[34px]' : '')}>
          <div className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={resolvedPlaceholder}
              disabled={disabled || isStreaming}
              rows={1}
              className={clsx(
                'max-h-56 flex-1 resize-none border-0 bg-transparent px-2 text-[#09111F] placeholder:text-[#6B7A93] focus:outline-none disabled:cursor-not-allowed',
                variant === 'centered'
                  ? 'min-h-[136px] py-4 text-[16px] leading-[1.75]'
                  : 'min-h-[74px] py-3.5 text-[15px] leading-[1.7]'
              )}
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-[rgba(255,255,255,0.42)] px-2 pt-4">
            <div className="flex min-w-0 items-center gap-3">
              {leftSlot}
              <p className="truncate text-xs text-[#60708A]">{resolvedHelperText}</p>
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={!hasContent || disabled || isStreaming}
              className={clsx(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-300',
                hasContent && !disabled && !isStreaming
                  ? 'border border-[rgba(255,255,255,0.42)] bg-[linear-gradient(135deg,rgba(0,140,255,0.96),rgba(0,187,249,0.94),rgba(0,245,212,0.92))] text-[#04131F] shadow-[0_16px_30px_rgba(0,140,255,0.22),0_0_20px_rgba(0,245,212,0.1)] hover:-translate-y-0.5'
                  : 'bg-[rgba(125,143,170,0.18)] text-[#7B8DA8]'
              )}
              aria-label="Send message"
            >
              {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
