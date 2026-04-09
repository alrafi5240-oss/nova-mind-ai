import clsx from 'clsx';

export default function WorkspaceIntro({ onToolSelect, selectedToolId, workspaceTools }) {
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-[2rem] sm:leading-tight">
          What should we build today?
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-500 dark:text-slate-400">
          Pick a workspace tool or describe your goal. NOVA MIND AI keeps replies structured, fast, and easy to
          act on.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {workspaceTools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => onToolSelect(tool.id)}
            className={clsx(
              'group flex flex-col rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition duration-300 ease-out hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600',
              tool.id === selectedToolId && 'border-slate-900 ring-1 ring-slate-900/10 dark:border-white dark:ring-white/20'
            )}
          >
            <div className="mb-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 p-2 text-slate-700 transition group-hover:bg-gray-200/80 dark:bg-slate-800 dark:text-slate-200 dark:group-hover:bg-slate-700">
                <tool.icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{tool.label}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{tool.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
