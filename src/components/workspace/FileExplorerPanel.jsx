import { FileCode2, Loader2, MessageSquareDashed, PenSquare, Save, Wand2 } from 'lucide-react';
import clsx from 'clsx';

export default function FileExplorerPanel({
  files,
  selectedFileId,
  onSelectFile,
  onChangeFile,
  onAskAI,
  onModifyWithAI,
  onSaveFile,
  isLoadingFile = false,
  isSavingFile = false,
  dirtyFileIds = [],
}) {
  const selectedFile = files.find((file) => file.id === selectedFileId) || files[0] || null;
  const isDirty = selectedFile ? dirtyFileIds.includes(selectedFile.id) : false;

  return (
    <div className="workspace-panel rounded-[26px] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            File Explorer
          </div>
          <div className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
            Workspace Files
          </div>
        </div>

        <div className="workspace-card-icon">
          <FileCode2 className="h-[18px] w-[18px]" />
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
        <div className="space-y-2">
          {files.map((file) => {
            const isActive = file.id === selectedFile?.id;

            return (
              <button
                key={file.id}
                type="button"
                onClick={() => onSelectFile(file.id)}
                className={clsx('file-item w-full rounded-[18px] px-3 py-3 text-left', isActive && 'file-item-active')}
              >
                <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{file.name}</div>
                <div className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{file.path}</div>
              </button>
            );
          })}
        </div>

        {selectedFile && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedFile.name}</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{selectedFile.path}</div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={onAskAI} className="rail-action-button">
                  <MessageSquareDashed className="h-4 w-4" />
                  Ask AI about this file
                </button>
                <button type="button" onClick={onSaveFile} className="rail-action-button" disabled={!isDirty || isSavingFile}>
                  {isSavingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isSavingFile ? 'Saving…' : 'Save file'}
                </button>
                <button type="button" onClick={onModifyWithAI} className="rail-action-button rail-action-primary">
                  <Wand2 className="h-4 w-4" />
                  AI modify file
                </button>
              </div>
            </div>

            <div className="file-editor-shell">
              <div className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <PenSquare className="h-3.5 w-3.5" />
                {isLoadingFile ? 'Loading file…' : isDirty ? 'Unsaved workspace draft' : 'Editable working copy'}
              </div>
              <textarea
                value={selectedFile.content}
                onChange={(event) => onChangeFile(selectedFile.id, event.target.value)}
                className="file-editor"
                spellCheck={false}
                disabled={isLoadingFile}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
