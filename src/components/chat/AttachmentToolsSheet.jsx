import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Brain, Camera, ClipboardList, FileText, Globe, ImagePlus, Images, LayoutGrid, Microscope } from 'lucide-react';

const DEFAULT_TOOLS = [
  { id: 'camera', label: 'Camera', Icon: Camera },
  { id: 'photos', label: 'Photos', Icon: Images },
  { id: 'files', label: 'Files', Icon: FileText },
  { id: 'create-image', label: 'Create image', Icon: ImagePlus },
  { id: 'thinking', label: 'Thinking', Icon: Brain },
  { id: 'deep-research', label: 'Deep research', Icon: Microscope },
  { id: 'web-search', label: 'Web search', Icon: Globe },
  { id: 'quizzes', label: 'Quizzes', Icon: ClipboardList },
  { id: 'explore-apps', label: 'Explore apps', Icon: LayoutGrid },
];

const SWIPE_CLOSE_PX = 72;

export default function AttachmentToolsSheet({
  brandName = 'NOVA MIND AI',
  open,
  onClose,
  onToolSelect,
  tools = DEFAULT_TOOLS,
}) {
  const touchStartY = useRef(null);
  const touchLastY = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleTouchStart = useCallback((e) => {
    const y = e.touches[0]?.clientY;
    touchStartY.current = y;
    touchLastY.current = y;
  }, []);

  const handleTouchMove = useCallback((e) => {
    touchLastY.current = e.touches[0]?.clientY ?? touchLastY.current;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const start = touchStartY.current;
    const end = touchLastY.current;
    touchStartY.current = null;
    touchLastY.current = null;
    if (start == null || end == null) return;
    if (end - start > SWIPE_CLOSE_PX) onClose();
  }, [onClose]);

  const handleToolClick = (tool) => {
    onToolSelect?.(tool);
    onClose();
  };

  const node = (
    <div
      className={`fixed inset-0 z-[100] flex flex-col justify-end transition-opacity duration-300 ease-in-out ${
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/25 backdrop-blur-[2px]"
        aria-label="Close tools"
        onClick={onClose}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-0 pb-0 pt-[min(20vh,120px)]">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${brandName} tools`}
          className={`pointer-events-auto w-full overflow-hidden rounded-t-2xl bg-white shadow-[0_-8px_40px_rgba(15,23,42,0.12)] transition-transform duration-300 ease-in-out md:mx-auto md:max-w-[400px] ${
            open ? 'translate-y-0' : 'translate-y-full'
          }`}
          style={{ maxHeight: '70vh' }}
        >
          <div className="flex max-h-[70vh] flex-col">
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="shrink-0 touch-pan-y px-5 pb-2 pt-3"
            >
              <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" aria-hidden />
              <p className="sr-only">Swipe down from the top of this panel to close</p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 pt-0">
              <p className="mb-4 text-center text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gray-400">
                {brandName}
              </p>
              <ul className="flex flex-col gap-3">
                {tools.map((tool) => {
                  const Icon = tool.Icon || tool.icon || FileText;
                  return (
                    <li key={tool.id}>
                      <button
                        type="button"
                        onClick={() => handleToolClick(tool)}
                        className="flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left transition-colors duration-200 ease-out hover:bg-gray-50 active:bg-gray-100"
                      >
                        <span className="flex shrink-0 rounded-full bg-gray-100 p-3 text-gray-700">
                          <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium text-gray-900">{tool.label}</span>
                          {tool.description ? (
                            <span className="mt-1 block text-sm leading-6 text-gray-500">{tool.description}</span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(node, document.body);
}
