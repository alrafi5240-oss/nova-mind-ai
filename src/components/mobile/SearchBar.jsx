import { Search, X } from 'lucide-react';
import GlassPanel from './GlassPanel';

export default function SearchBar({ query, onChange }) {
  return (
    <GlassPanel className="rounded-[30px]" innerClassName="flex items-center gap-3 px-4 py-4">
      <Search className="h-[1.125rem] w-[1.125rem] shrink-0 text-slate-600/75 dark:text-white/60" />

      <input
        type="text"
        value={query}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search tools, prompts, or notes"
        className="w-full bg-transparent text-[0.96rem] font-medium text-slate-900 placeholder:text-slate-600/68 outline-none dark:text-white dark:placeholder:text-white/48"
      />

      {query ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/38 text-slate-700 shadow-[0_10px_24px_rgba(255,255,255,0.18)] transition hover:bg-white/54 dark:bg-white/[0.08] dark:text-white/68 dark:hover:bg-white/[0.12]"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </GlassPanel>
  );
}
