import { Suspense, lazy, useEffect, useState } from 'react';
import { Bot, Loader2, RefreshCcw } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';

const ChatPage = lazy(() => import('./pages/ChatPage'));

function WorkspaceSplash({ error, isBootstrapping, onRetry }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_14%,rgba(168,85,247,0.24),transparent_24%),radial-gradient(circle_at_84%_14%,rgba(244,114,182,0.18),transparent_22%),radial-gradient(circle_at_78%_78%,rgba(59,130,246,0.18),transparent_26%),linear-gradient(150deg,#0a0714_0%,#0f1223_32%,#121830_62%,#121d38_100%)] px-6 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl items-center justify-center">
        <div className="w-full max-w-xl rounded-[36px] border border-white/14 bg-[linear-gradient(145deg,rgba(255,255,255,0.14),rgba(255,255,255,0.08)_55%,rgba(168,85,247,0.08))] p-8 shadow-[0_34px_100px_rgba(2,6,23,0.38)] backdrop-blur-[16px] sm:p-10">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-[22px] border border-white/16 bg-[linear-gradient(135deg,rgba(168,85,247,0.32),rgba(244,114,182,0.22),rgba(59,130,246,0.22))] text-cyan-50 shadow-[0_20px_52px_rgba(168,85,247,0.18)] backdrop-blur-lg">
            {isBootstrapping ? <Loader2 className="h-6 w-6 animate-spin" /> : <Bot className="h-6 w-6" />}
          </div>

          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
            NOVA MIND AI
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
            Launching your AI workspace
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Chat Assistant, Agent, and Super Agent are being connected to the live workspace so you can reason, inspect, edit, and execute from one place.
          </p>

          {error ? (
            <div className="mt-6 rounded-[24px] border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm leading-7 text-rose-100">
              {error}
            </div>
          ) : (
            <div className="mt-6 rounded-[24px] border border-white/12 bg-[linear-gradient(145deg,rgba(255,255,255,0.12),rgba(255,255,255,0.06)_55%,rgba(59,130,246,0.06))] px-5 py-4 text-sm leading-7 text-slate-300 backdrop-blur-lg">
              Preparing a secure guest session and hydrating the workspace state.
            </div>
          )}

          {!isBootstrapping && error && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-6 inline-flex items-center gap-2 rounded-[22px] border border-white/14 bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.08)_55%,rgba(168,85,247,0.08))] px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,rgba(255,255,255,0.18),rgba(255,255,255,0.10)_55%,rgba(59,130,246,0.12))]"
            >
              <RefreshCcw className="h-4 w-4" />
              Retry launch
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AppBootstrap() {
  const { accessToken, hasHydrated, loginWithGuest } = useAuthStore();
  const [bootKey, setBootKey] = useState(0);
  const [bootState, setBootState] = useState({
    ready: false,
    isBootstrapping: true,
    error: '',
  });

  useEffect(() => {
    if (!hasHydrated) return;

    let cancelled = false;

    const bootstrap = async () => {
      setBootState({ ready: false, isBootstrapping: true, error: '' });

      try {
        if (!accessToken) {
          const result = await loginWithGuest('Workspace Guest');
          if (!result?.success) {
            throw new Error(result?.message || 'Guest workspace launch failed.');
          }
        }

        if (!cancelled) {
          setBootState({ ready: true, isBootstrapping: false, error: '' });
        }
      } catch (error) {
        if (!cancelled) {
          setBootState({
            ready: false,
            isBootstrapping: false,
            error: error?.message || 'NOVA MIND AI could not open the workspace session.',
          });
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [accessToken, bootKey, hasHydrated, loginWithGuest]);

  if (!hasHydrated || !bootState.ready) {
    return (
      <WorkspaceSplash
        error={bootState.error}
        isBootstrapping={bootState.isBootstrapping || !hasHydrated}
        onRetry={() => setBootKey((current) => current + 1)}
      />
    );
  }

  return (
    <Suspense fallback={<WorkspaceSplash error="" isBootstrapping onRetry={() => setBootKey((current) => current + 1)} />}>
      <ChatPage />
    </Suspense>
  );
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '22px',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.16), rgba(15,23,42,0.82))',
            color: '#f8fafc',
            border: '1px solid rgba(255,255,255,0.14)',
            backdropFilter: 'blur(22px)',
            boxShadow: '0 24px 60px rgba(15, 23, 42, 0.28)',
          },
        }}
      />
      <AppBootstrap />
    </>
  );
}
