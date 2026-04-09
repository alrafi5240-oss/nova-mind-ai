import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, MessageSquareText, Plus, Trash2, X } from 'lucide-react';
import clsx from 'clsx';
import useChatStore from '../../store/chatStore';
import useAuthStore from '../../store/authStore';
import Logo from '../ui/Logo';

export default function Sidebar({ isOpen, onClose, onNewChat, onSelectConversation, activeId }) {
  const navigate = useNavigate();
  const { conversations, fetchConversations, deleteConversation } = useChatStore();
  const { logout, user } = useAuthStore();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={clsx(
          'app-sidebar fixed inset-y-0 left-0 z-40 w-[min(88vw,320px)] shrink-0 p-3 sm:w-[320px] sm:p-4 transition-transform duration-200 lg:static lg:translate-x-0 lg:p-6',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="sidebar-panel flex h-full flex-col rounded-[28px] p-5 sm:rounded-[32px] sm:p-7">
          <div className="relative z-10 flex items-start justify-between gap-3 sm:items-center">
            <Logo size="sm" tone="light" responsiveText className="min-w-0 flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost-light !h-9 !w-9 !p-0 lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="btn-primary mt-8 w-full justify-center rounded-2xl px-4 py-3"
          >
            <Plus className="h-4 w-4" />
            New chat
          </button>

          <div className="relative z-10 mt-9 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#91A4C3]">
            Recent
          </div>

          <div className="relative z-10 mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
            {conversations.length === 0 ? (
              <div className="px-3 py-5 text-sm leading-7 text-[#91A4C3]">
                Recent conversations appear here as your workspace builds up.
              </div>
            ) : (
              <div className="space-y-2.5">
                {conversations.map((conversation) => {
                  const isActive = activeId === conversation._id;

                  return (
                    <div
                      key={conversation._id}
                      className={clsx(
                        'sidebar-card group flex items-center gap-2 rounded-[22px] px-2.5 py-1.5',
                        isActive && 'sidebar-card-active'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectConversation(conversation._id);
                          onClose();
                        }}
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-[18px] px-3.5 py-3.5 text-left"
                      >
                        <div
                          className={clsx(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all duration-300',
                            isActive
                              ? 'bg-[rgba(255,255,255,0.14)] text-[#7CEBFF] shadow-[0_0_16px_rgba(56,189,248,0.14)]'
                              : 'bg-[rgba(255,255,255,0.06)] text-[#9DB5D5]'
                          )}
                        >
                          <MessageSquareText className="h-4 w-4" />
                        </div>
                        <div
                          className={clsx(
                            'truncate text-sm font-medium',
                            isActive ? 'text-[#F8FBFF]' : 'text-[#D9E5F7]'
                          )}
                        >
                          {conversation.title || 'New chat'}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteConversation(conversation._id);
                        }}
                        className="rounded-xl p-2.5 text-[#7B8DA8] opacity-0 transition-all duration-150 hover:bg-[rgba(255,255,255,0.1)] hover:text-[#F8FBFF] group-hover:opacity-100"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="relative z-10 mt-6 border-t border-[rgba(255,255,255,0.08)] pt-6">
            {user?.email && <div className="px-3 text-xs text-[#91A4C3]">{user.email}</div>}
            <Link to="/dashboard" className="btn-secondary mt-2 w-full justify-center">
              Growth dashboard
            </Link>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="btn-ghost-light mt-2 w-full justify-start"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
