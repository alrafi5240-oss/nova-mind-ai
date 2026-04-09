import clsx from 'clsx';
import { X } from 'lucide-react';
import { SidebarContent } from './AppSidebar';

export default function MobileSidebar({ open, onClose, ...props }) {
  return (
    <div
      className={clsx(
        'fixed inset-0 z-40 transition duration-300 ease-out lg:hidden',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      )}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] transition-opacity duration-300 ease-out"
        aria-label="Close sidebar"
      />

      <div
        className={clsx(
          'absolute inset-y-0 left-0 flex w-[260px] max-w-[min(260px,calc(100vw-3rem))] flex-col border-r border-slate-200 bg-white shadow-xl transition duration-300 ease-out dark:border-slate-800 dark:bg-slate-950',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-end border-b border-slate-100 px-3 py-2 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden px-4 py-4">
          <SidebarContent {...props} mobile onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
