import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Cpu,
  FolderKanban,
  FolderOpen,
  Mail,
  Menu,
  MoonStar,
  ShieldCheck,
  Sparkles,
  SunMedium,
  Wrench,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { streamOperatorRun } from '../utils/operatorStream';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import { API_ENDPOINTS } from '../config/api';
import Sidebar from '../components/Sidebar';
import ChatBubble from '../components/ChatBubble';
import InputBox from '../components/InputBox';
import ModeSelector from '../components/ModeSelector';
import AgentActionsPanel from '../components/workspace/AgentActionsPanel';
import FileExplorerPanel from '../components/workspace/FileExplorerPanel';
import QuickActionBar from '../components/workspace/QuickActionBar';
import TerminalControlPanel from '../components/workspace/TerminalControlPanel';
import ToolCatalogPanel from '../components/workspace/ToolCatalogPanel';
import RunHistoryPanel from '../components/workspace/RunHistoryPanel';
import WorkspaceOverview from '../components/workspace/WorkspaceOverview';
import SystemStatusPanel from '../components/workspace/SystemStatusPanel';
import MobileWorkspaceNav from '../components/workspace/MobileWorkspaceNav';
import Logo from '../components/ui/Logo';
import {
  playAudioBlob,
  stopAudioPlayback,
  synthesizeVoiceReply,
  transcribeVoiceBlob,
} from '../utils/voice';

const MODE_STORAGE_KEY = 'nova-workspace-mode';
const THEME_STORAGE_KEY = 'nova-workspace-theme';
const PANEL_STORAGE_KEY = 'nova-workspace-panel';
const OPERATOR_FINAL_STATES = new Set(['completed', 'failed']);
const OPERATOR_FALLBACK_POLL_INTERVAL = 5000;
const OPERATOR_FALLBACK_MAX_ATTEMPTS = 24;
const OFFICIAL_EMAIL = 'hellonovamindai@outlook.com';
const DEFAULT_AI_RUNTIME = {
  aiEnabled: false,
  aiMode: 'checking',
  aiLabel: 'Checking AI mode…',
  model: null,
};

const MODE_OPTIONS = [
  {
    id: 'chat',
    label: 'Chat Assistant',
    tabLabel: 'Chat',
    backendMode: 'chat',
    helper: 'Basic AI chat for text, code, ideas, and high-quality structured answers.',
    status: 'Chat live',
    placeholder: 'Ask anything...',
    placeholderHints: [
      'Write the cleanest launch brief for my AI platform',
      'Explain this architecture like a senior staff engineer',
      'Draft the first version of a new landing page headline',
    ],
    suggestions: [
      'Turn this product idea into a crisp one-page strategy memo.',
      'Explain the current workspace architecture and the next best refactor.',
      'Write a premium release note for the newest AI feature.',
    ],
    autoApply: false,
  },
  {
    id: 'agent',
    label: 'Agent',
    tabLabel: 'Agent',
    backendMode: 'agent',
    helper: 'Semi-autonomous planning with approval-first execution for important changes.',
    status: 'Approval-first Agent',
    placeholder: 'Ask anything...',
    placeholderHints: [
      'Inspect this repo and tell me the fastest upgrade path',
      'Read the selected file, prepare the best fix, and explain it',
      'Break this request into tasks and propose the safest execution plan',
    ],
    suggestions: [
      'Audit the current workspace and propose the three highest-value improvements.',
      'Read the focused file, prepare the best changes, and explain what should happen next.',
      'Plan a full login system implementation before applying any critical edits.',
    ],
    autoApply: false,
  },
  {
    id: 'super_agent',
    label: '⚡ Super Agent',
    tabLabel: 'Super Agent',
    backendMode: 'super_agent',
    helper: 'Full autonomy for files, terminal, debugging, and end-to-end execution.',
    status: '⚡ Super Agent',
    placeholder: 'Ask anything...',
    placeholderHints: [
      'Build a production-ready login system from scratch',
      'Refactor this feature across the frontend and backend and fix the errors',
      'Ship the missing feature end to end and summarize exactly what changed',
    ],
    suggestions: [
      'Build the missing feature end to end, run the necessary checks, and report completion.',
      'Refactor the active workspace into a cleaner architecture and fix any breakages.',
      'Implement the requested system fully with the best technical decisions and verify it.',
    ],
    autoApply: true,
  },
];

const resolveInitialMode = () => {
  const queryMode = new URLSearchParams(window.location.search).get('mode');
  if (MODE_OPTIONS.some((mode) => mode.id === queryMode)) {
    return queryMode;
  }

  const storedMode = localStorage.getItem(MODE_STORAGE_KEY);
  return MODE_OPTIONS.some((mode) => mode.id === storedMode) ? storedMode : 'chat';
};

const resolveInitialPanel = () => {
  const queryPanel = new URLSearchParams(window.location.search).get('panel');
  if (['workspace', 'agents', 'tools'].includes(queryPanel || '')) {
    return queryPanel;
  }

  const storedPanel = localStorage.getItem(PANEL_STORAGE_KEY);
  return ['workspace', 'agents', 'tools'].includes(storedPanel || '') ? storedPanel : 'workspace';
};

const QUICK_ACTIONS = [
  {
    id: 'build_website',
    label: 'Build website',
    modeId: 'super_agent',
    buildPrompt: (file) =>
      file
        ? `Use the focused file as context and build a premium production-ready website experience around it, then apply the best end-to-end implementation. File: ${file.path}`
        : 'Build a premium production-ready website experience for this workspace and implement the best end-to-end solution.',
  },
  {
    id: 'generate_logo',
    label: 'Generate logo',
    modeId: 'chat',
    buildPrompt: () =>
      'Design a premium logo concept system for NOVA MIND AI, including shape direction, color use, and brand application guidance.',
  },
  {
    id: 'write_ad_copy',
    label: 'Write ad copy',
    modeId: 'chat',
    buildPrompt: () =>
      'Write premium ad copy for NOVA MIND AI with a headline, supporting hook, three benefits, and a strong CTA.',
  },
];

const normalizeAIRuntime = (payload) => {
  const aiEnabled = Boolean(payload?.ai_enabled ?? payload?.aiEnabled);
  const aiMode = payload?.ai_mode || payload?.aiMode || (aiEnabled ? 'live' : 'demo');

  return {
    aiEnabled,
    aiMode,
    aiLabel:
      payload?.ai_label ||
      payload?.aiLabel ||
      (aiMode === 'live' ? 'Real AI Mode' : aiMode === 'checking' ? 'Checking AI mode…' : 'Demo Mode'),
    model: payload?.model || payload?.openai_model || payload?.openaiModel || null,
  };
};

const resolveSlashCommand = (rawInput, fallbackMode) => {
  const trimmed = rawInput.trim();
  const commandMatch = trimmed.match(/^\/(\w+)\s*(.*)$/s);

  if (!commandMatch) {
    return { mode: fallbackMode, content: trimmed };
  }

  const [, command, remainder] = commandMatch;
  const normalized = command.toLowerCase();
  const content = remainder.trim();

  if (normalized === 'code') return { mode: 'chat', content: content || 'Help me solve this coding task clearly and practically.' };
  if (normalized === 'agent') return { mode: 'agent', content: content || 'Inspect the workspace and prepare the best next steps.' };
  if (normalized === 'super') return { mode: 'super_agent', content: content || 'Execute the best end-to-end solution for this task.' };
  if (normalized === 'design') return { mode: 'chat', content: content || 'Design a premium interface solution for this workspace.' };

  return { mode: fallbackMode, content: trimmed };
};

const normalizeWorkspaceFile = (file) => ({
  ...file,
  id: file?.id || file?.path,
  content: typeof file?.content === 'string' ? file.content : '',
});

const mergeWorkspaceFiles = (currentFiles, incomingFiles) =>
  incomingFiles.map((file) => {
    const existing = currentFiles.find((item) => item.id === file.id);
    return normalizeWorkspaceFile({
      ...file,
      content: existing?.content ?? file.content ?? '',
    });
  });

const mapRunToActions = (run) =>
  Array.isArray(run?.steps)
    ? run.steps.map((step) => ({
        label: step.title,
        detail: step.detail,
        kind: step.kind,
        stepKey: step.step_key,
        command: step.command,
        output: step.output_excerpt,
        targetPath: step.target_path,
        state:
          step.status === 'active'
            ? 'active'
            : step.status === 'done'
              ? 'done'
              : step.status === 'failed'
                ? 'failed'
                : 'pending',
      }))
    : [];

const inferWorkspaceCwd = (selectedFile) => {
  const filePath = selectedFile?.path || '';
  if (filePath.startsWith('nova-mind-frontend/')) return 'nova-mind-frontend';
  if (filePath.startsWith('project/python-backend/')) return 'project/python-backend';
  return '.';
};

const getAccountInitials = (user) => {
  const source = user?.full_name || user?.email || 'NM';
  const parts = source
    .split(/[\s@._-]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() || '').join('') || 'NM';
};

function TypingIndicator({ pageTheme }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.985 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="flex justify-start"
    >
      <div className="max-w-[min(100%,860px)]">
        <div className="mb-2 flex items-center gap-2 px-1 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">
          <span>NOVA</span>
          <span className="rounded-full border border-white/10 bg-white/50 px-2.5 py-1 text-[10px] tracking-[0.18em] text-slate-500 backdrop-blur-lg dark:bg-white/5 dark:text-slate-400">
            thinking
          </span>
        </div>

        <div className="message-bubble message-assistant typing-shell">
          <div className="flex items-center gap-2.5">
            <span className={clsx('text-sm font-medium', pageTheme ? 'text-slate-200' : 'text-slate-700')}>
              Processing
            </span>
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className={clsx(
                    'typing-dot',
                    `typing-dot-${dot + 1}`,
                    pageTheme ? 'bg-slate-100/90' : 'bg-slate-900/80'
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ChatPage() {
  const { user, fetchMe } = useAuthStore();
  const {
    activeConversation,
    messages,
    isLoading,
    isStreaming,
    sendMessage,
    loadConversation,
    startNewConversation,
    beginExternalTurn,
    completeExternalTurn,
    failExternalTurn,
    setStreaming,
  } = useChatStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMode, setActiveMode] = useState(resolveInitialMode);
  const [activePanel, setActivePanel] = useState(resolveInitialPanel);
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || 'dark');
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [desktopWorkspacePath, setDesktopWorkspacePath] = useState('');
  const [voiceState, setVoiceState] = useState('idle');
  const [workspaceRoot, setWorkspaceRoot] = useState('');
  const [workspaceFiles, setWorkspaceFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [agentActions, setAgentActions] = useState([]);
  const [currentRun, setCurrentRun] = useState(null);
  const [operatorRuns, setOperatorRuns] = useState([]);
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(true);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [isSavingFile, setIsSavingFile] = useState(false);
  const [dirtyFileIds, setDirtyFileIds] = useState([]);
  const [terminalCommand, setTerminalCommand] = useState('npm run build');
  const [terminalResult, setTerminalResult] = useState(null);
  const [isRunningTerminal, setIsRunningTerminal] = useState(false);
  const [aiRuntime, setAiRuntime] = useState(DEFAULT_AI_RUNTIME);
  const [toolCatalog, setToolCatalog] = useState([]);
  const [safeguards, setSafeguards] = useState([]);

  const messagesEndRef = useRef(null);
  const audioPlaybackRef = useRef(null);
  const mountedRef = useRef(true);
  const runStreamAbortRef = useRef(null);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    let cancelled = false;

    const loadAIRuntime = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.health, {
          headers: { Accept: 'application/json' },
        });
        const payload = await response.json();
        if (!cancelled) {
          setAiRuntime(normalizeAIRuntime(payload));
        }
      } catch {
        if (!cancelled) {
          setAiRuntime({
            aiEnabled: false,
            aiMode: 'demo',
            aiLabel: 'Demo Mode',
            model: null,
          });
        }
      }
    };

    void loadAIRuntime();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming, agentActions]);

  useEffect(() => {
    localStorage.setItem(MODE_STORAGE_KEY, activeMode);
  }, [activeMode]);

  useEffect(() => {
    localStorage.setItem(PANEL_STORAGE_KEY, activePanel);
  }, [activePanel]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)');
    const updateStandalone = () => {
      setIsStandalone(Boolean(window.navigator.standalone) || media.matches);
    };

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event);
    };

    const handleInstalled = () => {
      setDeferredInstallPrompt(null);
      updateStandalone();
    };

    updateStandalone();
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    media.addEventListener?.('change', updateStandalone);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      media.removeEventListener?.('change', updateStandalone);
    };
  }, []);

  useEffect(() => {
    if (!window.novaMindDesktop?.onSelectedDirectory) return undefined;

    return window.novaMindDesktop.onSelectedDirectory((selectedPath) => {
      if (!selectedPath) return;
      setDesktopWorkspacePath(selectedPath);
      toast.success('Desktop workspace connected.');
    });
  }, []);

  useEffect(
    () => () => {
      mountedRef.current = false;
      runStreamAbortRef.current?.abort();
      runStreamAbortRef.current = null;
      stopAudioPlayback(audioPlaybackRef.current);
      audioPlaybackRef.current = null;
    },
    []
  );

  const loadWorkspaceSnapshot = async ({ preserveSelection = true } = {}) => {
    try {
      setIsWorkspaceLoading(true);
      const response = await api.get(API_ENDPOINTS.operator.workspace);
      const payload = response?.data;
      const files = Array.isArray(payload?.files) ? payload.files.map(normalizeWorkspaceFile) : [];
      setWorkspaceRoot(payload?.root || '');
      setWorkspaceFiles((current) => mergeWorkspaceFiles(current, files));
      setSelectedFileId((currentSelected) => {
        if (preserveSelection && currentSelected && files.some((file) => file.id === currentSelected)) {
          return currentSelected;
        }
        return files[0]?.id || null;
      });
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Workspace files could not be loaded.');
    } finally {
      if (mountedRef.current) {
        setIsWorkspaceLoading(false);
      }
    }
  };

  const loadWorkspaceFile = async (fileId) => {
    if (!fileId || dirtyFileIds.includes(fileId)) return;

    try {
      setIsFileLoading(true);
      const response = await api.get(API_ENDPOINTS.operator.file, { params: { path: fileId } });
      const file = normalizeWorkspaceFile(response?.data?.file || {});
      setWorkspaceFiles((current) => current.map((item) => (item.id === file.id ? { ...item, ...file } : item)));
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Failed to open the selected file.');
    } finally {
      if (mountedRef.current) {
        setIsFileLoading(false);
      }
    }
  };

  const loadOperatorCapabilities = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.operator.capabilities);
      setToolCatalog(Array.isArray(response?.data?.tools) ? response.data.tools : []);
      setSafeguards(Array.isArray(response?.data?.safeguards) ? response.data.safeguards : []);
    } catch (error) {
      console.error('Operator capabilities failed:', error);
    }
  };

  const loadOperatorRuns = async (sessionId = activeConversation?._id) => {
    try {
      const response = await api.get(API_ENDPOINTS.operator.runs, {
        params: sessionId ? { session_id: sessionId } : undefined,
      });
      setOperatorRuns(Array.isArray(response?.data?.runs) ? response.data.runs : []);
    } catch (error) {
      console.error('Operator runs failed:', error);
    }
  };

  useEffect(() => {
    void loadWorkspaceSnapshot();
    void loadOperatorCapabilities();
  }, []);

  useEffect(() => {
    void loadOperatorRuns();
  }, [activeConversation?._id]);

  useEffect(() => {
    if (!selectedFileId) return;
    const file = workspaceFiles.find((item) => item.id === selectedFileId);
    if (!file || file.content) return;
    void loadWorkspaceFile(selectedFileId);
  }, [selectedFileId, workspaceFiles, dirtyFileIds]);

  const speakReply = async (reply) => {
    const audioBlob = await synthesizeVoiceReply(reply);

    stopAudioPlayback(audioPlaybackRef.current);
    audioPlaybackRef.current = null;
    setVoiceState('speaking');

    audioPlaybackRef.current = await playAudioBlob(audioBlob, {
      onEnded: () => {
        audioPlaybackRef.current = null;
        setVoiceState('idle');
      },
      onError: () => {
        audioPlaybackRef.current = null;
        setVoiceState('idle');
        toast.error('Voice playback failed.');
      },
    });
  };

  const applyRunUpdate = (run) => {
    if (!run) return;
    setCurrentRun(run);
    setAgentActions(mapRunToActions(run));
    setOperatorRuns((current) => {
      const others = current.filter((item) => item.id !== run.id);
      return [run, ...others];
    });
  };

  const finalizeOperatorTurn = async (turn, run, options = {}) => {
    applyRunUpdate(run);
    await loadOperatorRuns(run?.session_id || turn.conversationId);

    if (run?.changed_files?.length) {
      await loadWorkspaceSnapshot();
      if (selectedFile && run.changed_files.includes(selectedFile.path)) {
        await loadWorkspaceFile(selectedFile.path);
      }
    }

    if (run?.status === 'completed' && run?.reply) {
      const result = completeExternalTurn({
        turn,
        reply: run.reply,
        payload: { session_id: run.session_id },
      });

      if (options.speakReply) {
        try {
          await speakReply(run.reply);
        } catch (error) {
          setVoiceState('idle');
          toast.error(error?.message || 'Voice response failed.');
        }
      }

      return result;
    }

    return failExternalTurn({
      turn,
      reply: run?.error_message || run?.reply || 'Operator run failed.',
    });
  };

  const fallbackPollOperatorRun = async (turn, runId, options = {}, initialRun = null) => {
    let latestRun = initialRun;

    for (let attempt = 0; attempt < OPERATOR_FALLBACK_MAX_ATTEMPTS; attempt += 1) {
      if (!mountedRef.current) {
        return { ok: false, reply: 'Operator monitoring stopped.' };
      }

      await new Promise((resolve) => window.setTimeout(resolve, OPERATOR_FALLBACK_POLL_INTERVAL));
      const response = await api.get(API_ENDPOINTS.operator.run(runId));
      const run = response?.data?.run;
      latestRun = run || latestRun;

      if (run) {
        applyRunUpdate(run);
      }

      if (OPERATOR_FINAL_STATES.has(run?.status)) {
        return finalizeOperatorTurn(turn, run, options);
      }
    }

    const timeoutResult = failExternalTurn({
      turn,
      reply: latestRun?.error_message || 'Operator run timed out before completion.',
    });
    setCurrentRun((current) =>
      current
        ? {
            ...current,
            status: 'failed',
            error_message: 'Operator run timed out before completion.',
          }
        : current
    );
    return timeoutResult;
  };

  const streamOperatorRunUpdates = async (turn, runId, options = {}) => {
    runStreamAbortRef.current?.abort();
    const controller = new AbortController();
    runStreamAbortRef.current = controller;

    let latestRun = null;
    let reachedFinal = false;

    try {
      await streamOperatorRun(API_ENDPOINTS.operator.runEvents(runId), {
        signal: controller.signal,
        onRun: (run) => {
          latestRun = run;
          applyRunUpdate(run);

          if (OPERATOR_FINAL_STATES.has(run?.status)) {
            reachedFinal = true;
            controller.abort();
          }
        },
      });
    } catch (error) {
      const wasAborted = controller.signal.aborted;
      if (!(wasAborted && reachedFinal)) {
        console.warn('Operator stream unavailable, falling back to polling.', error);
      }
      if (wasAborted && !reachedFinal) {
        return { ok: false, reply: 'Operator monitoring stopped.' };
      }
    } finally {
      if (runStreamAbortRef.current === controller) {
        runStreamAbortRef.current = null;
      }
    }

    if (reachedFinal && latestRun) {
      return finalizeOperatorTurn(turn, latestRun, options);
    }

    return fallbackPollOperatorRun(turn, runId, options, latestRun);
  };

  const runOperatorPrompt = async (payload, modeConfig, options = {}) => {
    const turn = beginExternalTurn(payload, user?.language || 'en');
    runStreamAbortRef.current?.abort();
    setCurrentRun({
      id: null,
      status: 'queued',
      goal: payload,
      summary: 'Preparing operator run.',
      steps: [],
    });
    setAgentActions([
      {
        label: 'Queued',
        detail: 'Operator task accepted and waiting for planning.',
        state: 'pending',
      },
    ]);
    setStreaming(true);
    setActivePanel('agents');

    try {
      const response = await api.post(API_ENDPOINTS.operator.execute, {
        goal: payload,
        mode: modeConfig.backendMode,
        session_id: turn.conversationId,
        focused_file_path: selectedFile?.path || undefined,
        auto_apply: modeConfig.autoApply,
      });

      const run = response?.data?.run;
      if (!run?.id) {
        throw new Error('Operator run could not be started.');
      }

      applyRunUpdate(run);
      await loadOperatorRuns(turn.conversationId);
      return await streamOperatorRunUpdates(turn, run.id, options);
    } catch (error) {
      setCurrentRun((current) => ({
        ...(current || {}),
        status: 'failed',
        error_message: error?.response?.data?.detail || error?.message || 'Operator request failed.',
      }));
      setAgentActions((current) =>
        current.length
          ? current
          : [
              {
                label: 'Operator error',
                detail: error?.response?.data?.detail || error?.message || 'Operator request failed.',
                state: 'failed',
              },
            ]
      );
      return failExternalTurn({
        turn,
        reply: error?.response?.data?.detail || error?.message || 'Operator request failed.',
      });
    } finally {
      setStreaming(false);
    }
  };

  const performSend = async (rawContent, options = {}) => {
    const fallbackMode = options.modeId || activeMode;
    const resolved = resolveSlashCommand(rawContent, fallbackMode);
    const modeConfig = MODE_OPTIONS.find((mode) => mode.id === resolved.mode) || MODE_OPTIONS[0];
    const payload = resolved.content.trim();

    if (!payload) return { ok: false, reply: '' };

    setActiveMode(modeConfig.id);
    if (modeConfig.id !== 'chat') {
      setActivePanel('agents');
    }

    if (modeConfig.id === 'chat') {
      const result = await sendMessage(payload, user?.language || 'en', modeConfig.backendMode);
      if (result?.payload) {
        setAiRuntime(normalizeAIRuntime(result.payload));
      }
      if (options.speakReply) {
        if (!result?.ok || !result.reply) {
          setVoiceState('idle');
          if (result?.reply) toast.error(result.reply);
          return result;
        }

        try {
          await speakReply(result.reply);
        } catch (error) {
          setVoiceState('idle');
          toast.error(error?.message || 'Voice response failed.');
        }
      }
      return result;
    }

    const result = await runOperatorPrompt(payload, modeConfig, options);
    if (options.speakReply && !result?.ok) {
      setVoiceState('idle');
    }
    return result;
  };

  const handleVoiceRecordingComplete = async (audioBlob) => {
    try {
      setVoiceState('processing');
      const transcript = await transcribeVoiceBlob(audioBlob);
      await performSend(transcript, { speakReply: true, modeId: activeMode });
    } catch (error) {
      setVoiceState('idle');
      toast.error(error?.response?.data?.detail || error?.message || 'Voice request failed.');
    }
  };

  const handleFileChange = (fileId, content) => {
    setWorkspaceFiles((current) => current.map((file) => (file.id === fileId ? { ...file, content } : file)));
    setDirtyFileIds((current) => (current.includes(fileId) ? current : [...current, fileId]));
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;

    try {
      setIsSavingFile(true);
      const response = await api.put(API_ENDPOINTS.operator.file, {
        path: selectedFile.path,
        content: selectedFile.content,
      });
      const savedFile = normalizeWorkspaceFile(response?.data?.file || {});
      setWorkspaceFiles((current) => current.map((file) => (file.id === savedFile.id ? { ...file, ...savedFile } : file)));
      setDirtyFileIds((current) => current.filter((fileId) => fileId !== savedFile.id));
      toast.success(`${savedFile.name} saved to the workspace.`);
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Saving the file failed.');
    } finally {
      if (mountedRef.current) {
        setIsSavingFile(false);
      }
    }
  };

  const handleAskAIAboutFile = async () => {
    if (!selectedFile) return;
    await performSend(`Analyze the selected file and explain the best next improvement. File: ${selectedFile.path}`, {
      modeId: 'chat',
    });
  };

  const handleModifyFileWithAI = async () => {
    if (!selectedFile) return;
    const targetMode = activeMode === 'super_agent' ? 'super_agent' : 'agent';
    const result = await performSend(
      `Read the selected file, improve it for this workspace, ${
        targetMode === 'super_agent' ? 'apply the best update' : 'prepare the best update without critical edits first'
      }, and summarize what changed. File: ${selectedFile.path}`,
      { modeId: targetMode }
    );

    if (result?.ok) {
      await loadWorkspaceFile(selectedFile.path);
      setDirtyFileIds((current) => current.filter((fileId) => fileId !== selectedFile.id));
      toast.success(
        targetMode === 'super_agent'
          ? `${selectedFile.name} was updated through Super Agent.`
          : `${selectedFile.name} was prepared through Agent mode.`
      );
    }
  };

  const handleQuickAction = async (action) => {
    setActiveMode(action.modeId);
    if (action.modeId !== 'chat') {
      setActivePanel('agents');
    }
    await performSend(action.buildPrompt(selectedFile), { modeId: action.modeId });
  };

  const handleOpenDesktopWorkspace = async () => {
    if (!window.novaMindDesktop?.selectDirectory) return;

    try {
      const selectedPath = await window.novaMindDesktop.selectDirectory();
      if (!selectedPath) return;
      setDesktopWorkspacePath(selectedPath);
      toast.success('Desktop workspace connected.');
    } catch (error) {
      toast.error(error?.message || 'Desktop workspace picker failed.');
    }
  };

  const handleRunTerminalCommand = async () => {
    const command = terminalCommand.trim();
    if (!command) return;

    try {
      setIsRunningTerminal(true);
      setTerminalResult(null);
      const response = await api.post(API_ENDPOINTS.operator.command, {
        command,
        cwd: inferWorkspaceCwd(selectedFile),
        session_id: activeConversation?._id || undefined,
        mode: activeMode === 'super_agent' ? 'super_agent' : 'agent',
      });
      setTerminalResult(response?.data?.result || null);
      if (response?.data?.result?.success) {
        toast.success('Command completed.');
        if (/build|test|install|pip|npm|pnpm|yarn|cargo|go/.test(command)) {
          await loadWorkspaceSnapshot();
        }
      } else {
        toast.error('Command failed.');
      }
    } catch (error) {
      const detail = error?.response?.data?.detail || error?.message || 'Command failed.';
      setTerminalResult({
        success: false,
        command,
        cwd: inferWorkspaceCwd(selectedFile),
        exit_code: 1,
        stdout: '',
        stderr: detail,
        combined_output: detail,
        duration_ms: 0,
      });
      toast.error(detail);
    } finally {
      if (mountedRef.current) {
        setIsRunningTerminal(false);
      }
    }
  };

  const handleModeChange = (modeId) => {
    setActiveMode(modeId);
    setActivePanel(modeId === 'chat' ? 'workspace' : 'agents');
  };

  const handleInstallApp = async () => {
    if (!deferredInstallPrompt) return;
    await deferredInstallPrompt.prompt();
    setDeferredInstallPrompt(null);
  };

  const handleSelectRun = (run) => {
    applyRunUpdate(run);
    setActivePanel('agents');
  };

  const handleNewWorkspaceThread = () => {
    startNewConversation();
    setCurrentRun(null);
    setAgentActions([]);
    setOperatorRuns([]);
    setSidebarOpen(false);
  };

  const usageCount = user?.usage?.messagesThisMonth ?? 0;
  const messageLimit =
    typeof user?.messageLimit === 'number' && Number.isFinite(user.messageLimit)
      ? user.messageLimit
      : null;
  const isLimitReached = messageLimit !== null && usageCount >= messageLimit;
  const activeModeConfig = MODE_OPTIONS.find((mode) => mode.id === activeMode) || MODE_OPTIONS[0];
  const selectedFile = workspaceFiles.find((file) => file.id === selectedFileId) || workspaceFiles[0] || null;
  const accountInitials = getAccountInitials(user);
  const accountLabel = user?.full_name || user?.email || 'Workspace Guest';
  const pageTheme = theme === 'dark';
  const hasMessages = messages.length > 0;
  const isDesktopShell = Boolean(window.novaMindDesktop?.isDesktop);
  const isMobileShell = /android|iphone|ipad|ipod/i.test(window.navigator.userAgent || '');
  const platformShell = isDesktopShell
    ? 'Desktop app'
    : isStandalone
      ? 'Installed app'
      : isMobileShell
        ? 'Mobile web app'
        : 'Web workspace';
  const platformDetail = isDesktopShell
    ? desktopWorkspacePath
      ? `Native desktop shell is active with local folder access enabled. Connected path: ${desktopWorkspacePath}.`
      : 'Native desktop shell is active with local file system access, resizable windows, and the Electron workspace bridge.'
    : isStandalone
      ? 'Installed from the browser with standalone app chrome, offline caching, and full-screen workspace behavior.'
      : isMobileShell
        ? 'Mobile browser shell with installable PWA support, touch-friendly navigation, and a native-style attach flow.'
        : 'Browser workspace optimized for custom domains, install prompts, and the shared web operating system experience.';
  const conversationTitle = activeConversation?.title || 'NOVA MIND AI Workspace';
  const isVoiceProcessing = voiceState === 'processing';
  const isVoiceSpeaking = voiceState === 'speaking';
  const aiRuntimeSummary =
    aiRuntime.aiMode === 'checking'
      ? 'Checking whether real GPT-4o-mini chat is available.'
      : aiRuntime.aiEnabled
        ? `${aiRuntime.model || 'gpt-4o-mini'} is active for real OpenAI responses.`
        : 'No backend OpenAI API key was found, so chat is running in Demo Mode.';
  const shellClasses = useMemo(
    () => (pageTheme ? 'text-white' : 'text-slate-900'),
    [pageTheme]
  );

  const helperText = isVoiceProcessing
    ? 'Processing your voice request and syncing it into the workspace…'
    : isVoiceSpeaking
      ? 'Playing NOVA MIND AI’s voice response while the workspace stays live.'
      : activeMode === 'super_agent'
        ? 'Super Agent can analyze the workspace, create or edit multiple files, run safe terminal commands, debug failures automatically, and complete tasks end to end.'
        : activeMode === 'agent'
          ? 'Agent mode inspects the workspace and prepares critical execution behind approval-first safeguards.'
          : aiRuntime.aiMode === 'checking'
            ? 'Checking AI mode. Press Enter to send. Shift + Enter creates a new line.'
            : aiRuntime.aiEnabled
              ? `Real AI Mode is active with ${aiRuntime.model || 'gpt-4o-mini'}. Press Enter to send. Shift + Enter creates a new line.`
              : 'Demo Mode is active because OPENAI_API_KEY is missing on the backend. Press Enter to send. Shift + Enter creates a new line.';

  const systemStatusPanel = (
    <SystemStatusPanel
      activeMode={activeMode}
      activeModeLabel={activeModeConfig.label}
      workspaceRoot={workspaceRoot}
      aiRuntime={aiRuntime}
      tools={toolCatalog}
      platformShell={platformShell}
      platformDetail={platformDetail}
    />
  );

  const railPanels =
    activePanel === 'workspace' ? (
      <>
        {systemStatusPanel}
        <WorkspaceOverview
          selectedFile={selectedFile}
          activeModeLabel={activeModeConfig.label}
          toolCount={toolCatalog.length}
          runCount={operatorRuns.length}
          usageCount={usageCount}
        />
        <FileExplorerPanel
          files={workspaceFiles}
          selectedFileId={selectedFileId}
          onSelectFile={setSelectedFileId}
          onChangeFile={handleFileChange}
          onAskAI={handleAskAIAboutFile}
          onModifyWithAI={handleModifyFileWithAI}
          onSaveFile={handleSaveFile}
          isLoadingFile={isFileLoading || isWorkspaceLoading}
          isSavingFile={isSavingFile}
          dirtyFileIds={dirtyFileIds}
        />
      </>
    ) : activePanel === 'agents' ? (
      <>
        {systemStatusPanel}
        <AgentActionsPanel
          mode={activeMode}
          actions={agentActions}
          isStreaming={isStreaming}
          runStatus={currentRun?.status || 'idle'}
          runSummary={currentRun?.summary || ''}
          runGoal={currentRun?.goal || ''}
          currentRunId={currentRun?.id || null}
        />
        <RunHistoryPanel runs={operatorRuns} onSelectRun={handleSelectRun} />
        <TerminalControlPanel
          command={terminalCommand}
          onCommandChange={setTerminalCommand}
          onRunCommand={handleRunTerminalCommand}
          isRunning={isRunningTerminal}
          result={terminalResult}
        />
      </>
    ) : (
      <>
        {systemStatusPanel}
        <ToolCatalogPanel tools={toolCatalog} />
        <div className="workspace-panel rounded-[26px] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Safeguards
              </div>
              <div className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
                Execution guardrails
              </div>
            </div>

            <div className="workspace-card-icon">
              <Wrench className="h-[18px] w-[18px]" />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {safeguards.map((item) => (
              <div
                key={item}
                className="rounded-[20px] border border-white/10 bg-white/[0.06] px-4 py-4 text-sm leading-7 text-slate-600 dark:text-slate-300"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </>
    );

  return (
    <div className={clsx('app-shell min-h-screen transition-[background,color,filter] duration-500 ease-out', shellClasses)}>
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNewChat={handleNewWorkspaceThread}
          onSelectConversation={loadConversation}
          activeId={activeConversation?._id}
          activePanel={activePanel}
          onSelectPanel={setActivePanel}
          activeMode={activeMode}
          onSelectMode={handleModeChange}
          modes={MODE_OPTIONS}
          tools={toolCatalog}
        />

        <div className="relative flex min-h-screen min-w-0 flex-1 p-4 sm:p-5 lg:p-6">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
              animate={
                activeMode === 'super_agent'
                  ? { x: [0, 24, -12, 0], y: [0, -18, 10, 0], opacity: [0.24, 0.4, 0.28, 0.24] }
                  : activeMode === 'agent'
                    ? { x: [0, 14, -10, 0], y: [0, -10, 8, 0], opacity: [0.18, 0.3, 0.22, 0.18] }
                    : { opacity: 0.12 }
              }
              transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
              className={clsx(
                'absolute left-[-8%] top-10 h-80 w-80 rounded-full blur-[120px]',
                pageTheme ? 'bg-violet-500/16' : 'bg-violet-300/18'
              )}
            />
            <motion.div
              animate={
                activeMode === 'super_agent'
                  ? { x: [0, -28, 22, 0], y: [0, 16, -12, 0], opacity: [0.18, 0.32, 0.22, 0.18] }
                  : activeMode === 'agent'
                    ? { x: [0, -18, 12, 0], y: [0, 12, -8, 0], opacity: [0.14, 0.26, 0.18, 0.14] }
                    : { opacity: 0.1 }
              }
              transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
              className={clsx(
                'absolute bottom-8 right-[8%] h-96 w-96 rounded-full blur-[120px]',
                pageTheme ? 'bg-blue-500/14' : 'bg-sky-300/16'
              )}
            />
            <motion.div
              animate={
                activeMode === 'super_agent'
                  ? { x: [0, 12, -8, 0], y: [0, -14, 8, 0], opacity: [0.12, 0.2, 0.14, 0.12] }
                  : { x: [0, 8, -6, 0], y: [0, -8, 6, 0], opacity: [0.08, 0.14, 0.1, 0.08] }
              }
              transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
              className={clsx(
                'absolute left-[34%] top-[16%] h-72 w-72 rounded-full blur-[120px]',
                pageTheme ? 'bg-pink-500/12' : 'bg-pink-300/16'
              )}
            />
          </div>

          <div className="chat-stage relative flex min-h-[calc(100vh-2rem)] flex-1 flex-col overflow-hidden rounded-[36px] lg:min-h-[calc(100vh-3rem)]">
            <header className="page-header border-b px-5 py-5 sm:px-7 lg:px-10">
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto flex max-w-[1400px] flex-col gap-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSidebarOpen(true)}
                      className={clsx(
                        'glass-button inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition lg:hidden',
                        pageTheme
                          ? 'border-white/10 bg-white/5 text-slate-100'
                          : 'border-slate-200 bg-white text-slate-900'
                      )}
                      aria-label="Open sidebar"
                    >
                      <Menu className="h-5 w-5" />
                    </button>

                    <div className="min-w-0">
                      <Logo size="nav" tone={pageTheme ? 'light' : 'dark'} className="min-w-0" />
                      <div className="ui-muted mt-1 truncate text-xs font-medium uppercase tracking-[0.18em]">
                        {conversationTitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="glass-button inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200">
                      <Mail className="h-3.5 w-3.5" />
                      {OFFICIAL_EMAIL}
                    </div>
                    {isDesktopShell && (
                      <button
                        type="button"
                        onClick={() => {
                          void handleOpenDesktopWorkspace();
                        }}
                        className="glass-button inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-slate-700 transition-all duration-300 hover:-translate-y-0.5 dark:text-slate-100"
                      >
                        <FolderOpen className="h-4 w-4" />
                        {desktopWorkspacePath ? 'Switch Folder' : 'Open Folder'}
                      </button>
                    )}
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-500 backdrop-blur-lg dark:text-slate-300">
                      <FolderKanban className="h-3.5 w-3.5" />
                      {selectedFile?.name || (isWorkspaceLoading ? 'Loading workspace…' : 'No file selected')}
                    </div>
                    <motion.button
                      type="button"
                      onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className={clsx(
                        'glass-button interactive-ripple inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-medium transition',
                        pageTheme
                          ? 'border-white/10 bg-white/5 text-slate-100 hover:bg-white/10'
                          : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-100'
                      )}
                    >
                      {pageTheme ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
                      {pageTheme ? 'Light' : 'Dark'}
                    </motion.button>
                    {!isDesktopShell && !isStandalone && deferredInstallPrompt && (
                      <button
                        type="button"
                        onClick={() => {
                          void handleInstallApp();
                        }}
                        className="glass-button inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-slate-700 transition-all duration-300 hover:-translate-y-0.5 dark:text-slate-100"
                      >
                        <Sparkles className="h-4 w-4" />
                        Install App
                      </button>
                    )}
                    <button
                      type="button"
                      className="glass-button inline-flex h-11 items-center gap-2 rounded-full px-3.5 text-sm font-medium text-slate-700 transition-all duration-300 hover:-translate-y-0.5 dark:text-slate-100"
                      aria-label="Account"
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/15 text-xs font-semibold text-slate-900 dark:text-white">
                        {accountInitials}
                      </span>
                      <span className="hidden max-w-[9rem] truncate sm:inline">{accountLabel}</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div
                    className={clsx(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium backdrop-blur-lg',
                      aiRuntime.aiMode === 'checking'
                        ? 'border-white/10 bg-white/5 text-slate-300'
                        : aiRuntime.aiEnabled
                          ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100'
                          : 'border-amber-400/20 bg-amber-400/10 text-amber-100'
                    )}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {aiRuntime.aiLabel}
                    {aiRuntime.aiEnabled && aiRuntime.model ? ` · ${aiRuntime.model}` : ''}
                  </div>
                  <div className="glass-button inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {activeMode === 'super_agent' ? 'Autonomous delivery' : activeMode === 'agent' ? 'Approval-first agent' : 'Direct chat'}
                  </div>
                  <div className="glass-button inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200">
                    <FolderKanban className="h-3.5 w-3.5" />
                    {platformShell}
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-end">
                  <ModeSelector options={MODE_OPTIONS} value={activeMode} onChange={handleModeChange} />

                  <div
                    className={clsx(
                      'workspace-card rounded-[24px] p-4',
                      activeMode === 'super_agent' ? 'super-agent-glow super-agent-pulse workspace-card-strong' : 'workspace-card-soft'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="workspace-card-icon">
                        {activeMode === 'super_agent' ? <Cpu className="h-[18px] w-[18px]" /> : <Bot className="h-[18px] w-[18px]" />}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                          {activeModeConfig.status}
                        </div>
                        <div className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">
                          {activeModeConfig.helper}
                          {workspaceRoot ? ` Workspace: ${workspaceRoot}` : ''}
                        </div>
                        <div className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                          {aiRuntimeSummary}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </header>

            <main className="premium-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-6 sm:px-7 lg:px-10">
              <div className="mx-auto grid w-full max-w-[1400px] gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
                <section className={clsx('min-w-0', activePanel !== 'workspace' && 'hidden xl:block')}>
                  <div className="workspace-panel relative overflow-hidden rounded-[30px] p-5 sm:p-6">
                    {activeMode !== 'chat' && <div className="agent-mesh absolute inset-0 opacity-80" />}

                    <div className="relative z-[1] flex min-h-[720px] flex-col">
                      {hasMessages ? (
                        <>
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                            <div>
                              <div className="ui-label">
                                Workspace Feed
                              </div>
                              <div className="ui-heading mt-2">
                                Conversation, context, and execution
                              </div>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-500 backdrop-blur-lg dark:text-slate-300">
                              <Sparkles className="h-3.5 w-3.5" />
                              {activeModeConfig.label}
                            </div>
                          </div>

                          <div className="premium-scroll mt-5 min-h-0 flex-1 space-y-8 overflow-y-auto pr-1">
                            <AnimatePresence initial={false}>
                              {messages.map((message, index) => (
                                <ChatBubble key={message.timestamp || `${message.role}-${index}`} message={message} />
                              ))}

                              {isStreaming && <TypingIndicator key="typing-indicator" pageTheme={pageTheme} />}
                            </AnimatePresence>

                            {isLoading && !messages.length && (
                              <div className={clsx('text-sm', pageTheme ? 'text-slate-400' : 'text-slate-500')}>
                                Loading conversation...
                              </div>
                            )}

                            <div ref={messagesEndRef} />
                          </div>

                          <div className="mt-6 border-t border-white/10 pt-5">
                            <div className="mb-4">
                              <QuickActionBar actions={QUICK_ACTIONS} onTrigger={handleQuickAction} />
                            </div>
                            <InputBox
                              onSend={(content) => {
                                void performSend(content);
                              }}
                              onVoiceRecordingComplete={handleVoiceRecordingComplete}
                              isStreaming={isStreaming}
                              disabled={isLimitReached || isVoiceProcessing}
                              isVoiceProcessing={isVoiceProcessing}
                              isVoiceSpeaking={isVoiceSpeaking}
                              placeholder={activeModeConfig.placeholder}
                              placeholderHints={activeModeConfig.placeholderHints}
                              helperText={helperText}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-1 flex-col justify-between">
                          <div className="mx-auto flex w-full max-w-[1040px] flex-1 flex-col items-center justify-center text-center">
                            <motion.div
                              initial={{ opacity: 0, scale: 0.96 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.35, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
                              className="glass-badge inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium"
                            >
                              <Sparkles className="h-4 w-4" />
                              Premium AI Workspace
                            </motion.div>

                            <motion.h1
                              initial={{ opacity: 0, y: 18, scale: 0.965 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ duration: 0.42, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                              className="hero-title mt-7 max-w-[920px] text-balance text-[52px] font-extrabold leading-[0.9] tracking-[-0.065em] sm:text-[72px]"
                            >
                              One workspace for chat, approval-first agents, and autonomous delivery.
                            </motion.h1>

                            <motion.p
                              initial={{ opacity: 0, y: 18 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.42, delay: 0.13, ease: [0.22, 1, 0.36, 1] }}
                              className="hero-subtitle mt-5 max-w-[760px] text-[18px] leading-8"
                            >
                              NOVA MIND AI is a full AI operating workspace with live files, guarded commands, tracked runs, and execution layers.
                            </motion.p>

                            <div className="mt-8 flex justify-center">
                              <QuickActionBar actions={QUICK_ACTIONS} onTrigger={handleQuickAction} />
                            </div>

                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.44, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
                              className="mt-10 w-full max-w-[980px]"
                            >
                              <InputBox
                                onSend={(content) => {
                                  void performSend(content);
                                }}
                                onVoiceRecordingComplete={handleVoiceRecordingComplete}
                                isStreaming={isStreaming}
                                disabled={isLimitReached || isVoiceProcessing}
                                isVoiceProcessing={isVoiceProcessing}
                                isVoiceSpeaking={isVoiceSpeaking}
                                variant="hero"
                                placeholder={activeModeConfig.placeholder}
                                placeholderHints={activeModeConfig.placeholderHints}
                                helperText={helperText}
                              />
                            </motion.div>

                            <div className="mt-8 grid w-full max-w-[980px] gap-3 sm:grid-cols-3">
                              {activeModeConfig.suggestions.map((suggestion, index) => (
                                <motion.button
                                  key={suggestion}
                                  type="button"
                                  initial={{ opacity: 0, y: 18 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{
                                    duration: 0.38,
                                    delay: 0.22 + index * 0.06,
                                    ease: [0.22, 1, 0.36, 1],
                                  }}
                                  onClick={() => {
                                    void performSend(suggestion, { modeId: activeMode });
                                  }}
                                  className="suggestion-card rounded-[22px] border px-5 py-4 text-left text-sm leading-6 text-slate-800 transition-all duration-300 dark:text-slate-100"
                                >
                                  {suggestion}
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <aside className={clsx('space-y-6', activePanel === 'workspace' ? 'hidden xl:block' : 'block')}>{railPanels}</aside>
              </div>
            </main>

            <MobileWorkspaceNav activePanel={activePanel} onSelectPanel={setActivePanel} />
          </div>
        </div>
      </div>
    </div>
  );
}
