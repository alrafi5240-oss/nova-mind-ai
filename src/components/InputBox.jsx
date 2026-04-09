import { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  BookOpen,
  Camera,
  ChevronDown,
  CornerDownLeft,
  FileText,
  Globe2,
  ImagePlus,
  Images,
  Paperclip,
  Sparkles,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import VoiceButton from './VoiceButton';
import AttachmentToolsSheet from './chat/AttachmentToolsSheet';

const ATTACH_ACTIONS = [
  {
    id: 'camera',
    label: 'Camera',
    icon: Camera,
    description: 'Capture a live photo and use it as workspace context.',
    kind: 'picker',
    inputKey: 'camera',
  },
  {
    id: 'photos',
    label: 'Photos',
    icon: Images,
    description: 'Choose images from the gallery for multimodal context.',
    kind: 'picker',
    inputKey: 'photos',
  },
  {
    id: 'files',
    label: 'Files',
    icon: FileText,
    description: 'Attach files from the device or local workspace.',
    kind: 'picker',
    inputKey: 'files',
  },
  {
    id: 'create-image',
    label: 'Create image',
    icon: ImagePlus,
    description: 'Kick off a premium image generation prompt.',
    kind: 'prompt',
    template: 'Create a premium image concept for ',
  },
  {
    id: 'thinking',
    label: 'Thinking',
    icon: Sparkles,
    description: 'Ask for step-by-step reasoning on the task.',
    kind: 'prompt',
    template: '/code Think step by step about ',
  },
  {
    id: 'deep-research',
    label: 'Deep research',
    icon: BookOpen,
    description: 'Expand the task into a deeper agent-style research pass.',
    kind: 'prompt',
    template: '/agent Deeply research ',
  },
  {
    id: 'web-search',
    label: 'Web search',
    icon: Globe2,
    description: 'Search for the latest public information before answering.',
    kind: 'prompt',
    template: '/agent Search the web for the latest information about ',
  },
];

const FILE_INPUT_CONFIG = {
  camera: { accept: 'image/*', capture: 'environment' },
  photos: { accept: 'image/*', multiple: true },
  files: { multiple: true },
};

const formatBytes = (value) => {
  if (!Number.isFinite(value) || value <= 0) return null;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const buildAttachmentContext = (message, attachments) => {
  const trimmed = message.trim();
  if (!attachments.length) return trimmed;

  const attachmentLines = attachments.map((attachment) => {
    const parts = [attachment.name];
    if (attachment.sizeLabel) parts.push(attachment.sizeLabel);
    parts.push(attachment.label);
    return `- ${parts.join(' · ')}`;
  });

  const body = trimmed || 'Use the attached context to help with this request.';
  return `${body}\n\nAttached context:\n${attachmentLines.join('\n')}`;
};

export default function InputBox({
  onSend,
  onVoiceRecordingComplete,
  isStreaming = false,
  isVoiceProcessing = false,
  isVoiceSpeaking = false,
  disabled = false,
  placeholder = 'Ask anything...',
  placeholderHints = [],
  helperText = 'Enter to send. Shift + Enter for a new line.',
  variant = 'docked',
}) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [attachSheetOpen, setAttachSheetOpen] = useState(false);
  const [attachedItems, setAttachedItems] = useState([]);
  const [isMobileAttachSheet, setIsMobileAttachSheet] = useState(false);
  const textareaRef = useRef(null);
  const attachMenuRef = useRef(null);
  const fileInputRefs = useRef({
    camera: null,
    photos: null,
    files: null,
  });

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, variant === 'hero' ? 220 : 170)}px`;
  }, [message, variant]);

  useEffect(() => {
    if (!placeholderHints.length || message.trim() || isFocused) return undefined;

    const timer = window.setInterval(() => {
      setPlaceholderIndex((current) => (current + 1) % placeholderHints.length);
    }, 2300);

    return () => window.clearInterval(timer);
  }, [placeholderHints, message, isFocused]);

  useEffect(() => {
    if (!attachMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (attachMenuRef.current?.contains(event.target)) return;
      setAttachMenuOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setAttachMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [attachMenuOpen]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)');
    const update = () => setIsMobileAttachSheet(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  const resetFileInputs = () => {
    Object.values(fileInputRefs.current).forEach((input) => {
      if (input) input.value = '';
    });
  };

  const submit = () => {
    if ((!message.trim() && !attachedItems.length) || disabled || isStreaming || isVoiceProcessing) return;
    onSend(buildAttachmentContext(message, attachedItems));
    setMessage('');
    setAttachedItems([]);
    resetFileInputs();
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

  const handleAttachAction = (action) => {
    if (action.kind === 'picker') {
      setAttachMenuOpen(false);
      setAttachSheetOpen(false);
      fileInputRefs.current[action.inputKey]?.click();
      return;
    }

    setMessage((current) =>
      current.trim()
        ? `${action.template}${action.template.endsWith(' ') ? '' : ' '}${current}`
        : action.template
    );
    setAttachMenuOpen(false);
    setAttachSheetOpen(false);
    textareaRef.current?.focus();
  };

  const handleFileSelection = (inputKey, event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) return;

    const action = ATTACH_ACTIONS.find((item) => item.inputKey === inputKey);
    const label = action?.label || 'Attachment';
    const nextItems = selectedFiles.map((file) => ({
      id: `${inputKey}-${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
      size: file.size,
      sizeLabel: formatBytes(file.size),
      mimeType: file.type,
      label,
    }));

    setAttachedItems((current) => {
      const existingIds = new Set(current.map((item) => item.id));
      return [...current, ...nextItems.filter((item) => !existingIds.has(item.id))];
    });

    setAttachMenuOpen(false);
    setAttachSheetOpen(false);
    textareaRef.current?.focus();
  };

  const handleRemoveAttachment = (attachmentId) => {
    setAttachedItems((current) => current.filter((item) => item.id !== attachmentId));
  };

  const isBusy = disabled || isStreaming || isVoiceProcessing;
  const hasMessage = message.trim().length > 0 || attachedItems.length > 0;
  const animatedPlaceholder = !message.trim() && placeholderHints.length ? placeholderHints[placeholderIndex] : placeholder;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className={clsx(variant === 'docked' ? 'sticky bottom-0 z-20 pt-5' : 'w-full', 'animate-fade-in')}
    >
      {Object.entries(FILE_INPUT_CONFIG).map(([inputKey, config]) => (
        <input
          key={inputKey}
          ref={(node) => {
            fileInputRefs.current[inputKey] = node;
          }}
          type="file"
          className="hidden"
          accept={config.accept}
          capture={config.capture}
          multiple={config.multiple}
          onChange={(event) => handleFileSelection(inputKey, event)}
        />
      ))}

      <div className={clsx('composer-shell rounded-[32px] p-4', (isFocused || hasMessage) && 'composer-shell-glow', isFocused ? 'workspace-focus-ring' : '')}>
        <div className="flex items-start gap-3">
          <div className="mt-1.5 hidden rounded-2xl border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),rgba(56,189,248,0.12),rgba(168,85,247,0.08))] p-2.5 text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.12)] dark:text-white sm:block">
            <Sparkles className="h-4 w-4" />
          </div>

          <textarea
            ref={textareaRef}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            rows={1}
            placeholder={animatedPlaceholder}
            disabled={isBusy}
            className={clsx(
              'min-h-[92px] flex-1 resize-none bg-transparent px-1 py-2 text-[15px] leading-7 text-slate-900 outline-none placeholder:text-slate-500 disabled:cursor-not-allowed dark:text-slate-50 dark:placeholder:text-slate-400',
              variant === 'hero' ? 'min-h-[136px] text-base' : ''
            )}
          />
        </div>

        {attachedItems.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200/70 pt-4 dark:border-white/12">
            {attachedItems.map((attachment) => (
              <div
                key={attachment.id}
                className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/55 px-3 py-2 text-xs font-medium text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)] backdrop-blur-md dark:bg-white/8 dark:text-slate-100"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/12 bg-white/40 dark:bg-white/10">
                  <FileText className="h-3.5 w-3.5" />
                </span>
                <span className="max-w-[12rem] truncate">{attachment.name}</span>
                <span className="hidden text-slate-500 dark:text-slate-400 sm:inline">
                  {attachment.sizeLabel || attachment.label}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(attachment.id)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-500 transition-colors duration-200 hover:bg-black/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                  aria-label={`Remove ${attachment.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/70 px-1 pt-4 dark:border-white/12">
          <div className="flex items-center gap-2">
            <div ref={attachMenuRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  if (isMobileAttachSheet) {
                    setAttachSheetOpen(true);
                    return;
                  }
                  setAttachMenuOpen((current) => !current);
                }}
                className="glass-button inline-flex h-11 items-center gap-2 rounded-full px-3.5 text-sm font-medium text-slate-700 transition-all duration-300 hover:-translate-y-0.5 dark:text-slate-100"
                aria-expanded={isMobileAttachSheet ? attachSheetOpen : attachMenuOpen}
                aria-haspopup={isMobileAttachSheet ? 'dialog' : 'menu'}
              >
                <Paperclip className="h-4 w-4" />
                <span className="hidden sm:inline">Attach</span>
                <ChevronDown
                  className={clsx(
                    'h-4 w-4 transition-transform duration-300',
                    (isMobileAttachSheet ? attachSheetOpen : attachMenuOpen) && 'rotate-180'
                  )}
                />
              </button>

              <AnimatePresence>
                {!isMobileAttachSheet && attachMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute bottom-full left-0 z-30 mb-3 w-[min(88vw,320px)] overflow-hidden rounded-[26px] border border-white/20 bg-[linear-gradient(145deg,rgba(255,255,255,0.62),rgba(255,255,255,0.26)_60%,rgba(255,255,255,0.16))] p-2 shadow-[0_24px_64px_rgba(15,23,42,0.14),0_0_28px_rgba(168,85,247,0.12)] backdrop-blur-[16px] dark:bg-[linear-gradient(145deg,rgba(255,255,255,0.12),rgba(30,41,59,0.18)_60%,rgba(2,6,23,0.34))] dark:shadow-[0_28px_72px_rgba(2,6,23,0.38),0_0_30px_rgba(168,85,247,0.16)]"
                    role="menu"
                  >
                    <div className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Attach menu
                    </div>
                    <div className="grid gap-1">
                      {ATTACH_ACTIONS.map((action) => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={action.id}
                            type="button"
                            onClick={() => handleAttachAction(action)}
                            className="flex items-center gap-3 rounded-[20px] px-3 py-3 text-left text-sm font-medium text-slate-800 transition-all duration-300 hover:bg-white/42 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
                            role="menuitem"
                          >
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/20 text-slate-800 dark:bg-white/10 dark:text-slate-100">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block">{action.label}</span>
                              <span className="mt-1 hidden text-xs font-normal text-slate-500 dark:text-slate-400 sm:block">
                                {action.description}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <VoiceButton
              onRecordingComplete={onVoiceRecordingComplete}
              isProcessing={isVoiceProcessing}
              isSpeaking={isVoiceSpeaking}
              disabled={disabled || isStreaming}
            />
            <p className="max-w-[32rem] text-xs leading-6 text-slate-600 dark:text-slate-300">{helperText}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-medium text-slate-400 backdrop-blur-md dark:flex">
              <CornerDownLeft className="h-3.5 w-3.5" />
              Shift + Enter
            </div>

            <motion.button
              type="button"
              onClick={submit}
              disabled={!hasMessage || isBusy}
              whileHover={{ scale: hasMessage && !isBusy ? 1.02 : 1, y: hasMessage && !isBusy ? -1 : 0 }}
              whileTap={{ scale: hasMessage && !isBusy ? 0.97 : 1 }}
              className={clsx(
                'group inline-flex h-12 w-12 items-center justify-center rounded-full border text-white transition-all duration-300',
                hasMessage && !isBusy
                  ? 'border-white/24 bg-[linear-gradient(135deg,rgba(168,85,247,0.94),rgba(244,114,182,0.90),rgba(59,130,246,0.94))] shadow-[0_18px_40px_rgba(168,85,247,0.28)] hover:-translate-y-0.5 hover:shadow-[0_24px_48px_rgba(168,85,247,0.34)]'
                  : 'border-white/14 bg-[linear-gradient(135deg,rgba(255,255,255,0.50),rgba(255,255,255,0.26))] text-slate-500 dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(15,23,42,0.22))] dark:text-slate-400'
              )}
              aria-label="Send message"
            >
              <ArrowUp className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
            </motion.button>
          </div>
        </div>
      </div>

      <AttachmentToolsSheet
        brandName="NOVA MIND AI"
        open={attachSheetOpen}
        onClose={() => setAttachSheetOpen(false)}
        onToolSelect={handleAttachAction}
        tools={ATTACH_ACTIONS}
      />
    </motion.div>
  );
}
