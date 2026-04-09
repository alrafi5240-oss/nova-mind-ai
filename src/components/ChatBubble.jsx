import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy, Paperclip } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const ATTACHMENT_MARKER = '\n\nAttached context:\n';

const parseUserMessage = (content) => {
  if (!content.includes(ATTACHMENT_MARKER)) {
    return { body: content, attachments: [] };
  }

  const [body, attachmentBlock] = content.split(ATTACHMENT_MARKER);
  const attachments = attachmentBlock
    .split('\n')
    .map((line) => line.replace(/^- /, '').trim())
    .filter(Boolean);

  return {
    body: body.trim(),
    attachments,
  };
};

export default function ChatBubble({ message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const content =
    typeof message?.content === 'string'
      ? message.content
      : message?.content == null
        ? ''
        : String(message.content);
  const parsedUserMessage = isUser ? parseUserMessage(content) : { body: content, attachments: [] };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {}
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className={clsx('flex w-full', isUser ? 'justify-end' : 'justify-start')}
    >
      <div className={clsx('max-w-[min(100%,820px)]', isUser ? 'items-end' : 'items-start')}>
        <div className="mb-2 flex items-center gap-2 px-1 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          <span>{isUser ? 'You' : 'NOVA MIND AI'}</span>
          <span
            className={clsx(
              'rounded-full border px-2.5 py-1 text-[10px] tracking-[0.16em] backdrop-blur-lg',
              isUser
                ? 'border-blue-300/20 bg-blue-500/10 text-blue-100 dark:border-cyan-300/20 dark:bg-cyan-400/10'
                : 'border-slate-200/70 bg-white/70 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
            )}
          >
            {isUser ? 'request' : 'reply'}
          </span>
        </div>

        <motion.div
          whileHover={{ y: -2 }}
          className={clsx(
            'message-bubble px-5 py-4 text-[15px] leading-7',
            isUser
              ? 'message-user rounded-tr-[12px]'
              : 'message-assistant rounded-tl-[12px]'
          )}
        >
          {isUser ? (
            <div className="space-y-3">
              <p className="whitespace-pre-wrap">{parsedUserMessage.body || 'Attached context shared.'}</p>
              {parsedUserMessage.attachments.length ? (
                <div className="flex flex-wrap gap-2">
                  {parsedUserMessage.attachments.map((attachment) => (
                    <span
                      key={attachment}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/16 bg-white/12 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-lg"
                    >
                      <Paperclip className="h-3 w-3" />
                      {attachment}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="prose-chat max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          )}
        </motion.div>

        {!isUser && content && (
          <button
            type="button"
            onClick={handleCopy}
            className="assistant-copy-button mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-300"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy reply'}
          </button>
        )}
      </div>
    </motion.div>
  );
}
