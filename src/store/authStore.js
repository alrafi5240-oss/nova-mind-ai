import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { API_ENDPOINTS } from '../config/api';
import api, { clearStoredAuth } from '../utils/api';
import {
  clearStoredSessionUser,
  getStoredApiKey,
  getStoredOwnerKey,
  getStoredSessionToken,
  getStoredSessionUser,
  setStoredApiKey,
  setStoredOwnerKey,
  setStoredSessionToken,
  setStoredSessionUser,
  syncAuthStorage,
} from '../utils/authStorage';

syncAuthStorage();

const initialApiKey = getStoredApiKey();
const initialAccessToken = getStoredSessionToken();
const initialOwnerKey = getStoredOwnerKey();
const initialUser = getStoredSessionUser();
const REFERRAL_STORAGE_KEY = 'nova-referral-code';

const resolveApiErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.detail ||
  error?.response?.data?.error ||
  fallback;

const getStoredReferralCode = () => {
  if (typeof window === 'undefined') return '';
  return (window.localStorage.getItem(REFERRAL_STORAGE_KEY) || '').trim().toUpperCase();
};

const clearStoredReferralCode = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
};

const claimPendingReferral = async () => {
  const referralCode = getStoredReferralCode();
  if (!referralCode) return;

  try {
    await api.post(API_ENDPOINTS.growth.claimReferral, {
      referral_code: referralCode,
    });
    clearStoredReferralCode();
  } catch (error) {
    if ([400, 404, 409].includes(error?.response?.status)) {
      clearStoredReferralCode();
    }
  }
};

const normalizeSessionUser = (rawUser) => {
  const isGuest = Boolean(rawUser?.is_guest);
  const fullName = rawUser?.full_name || (isGuest ? 'Guest User' : 'Nova User');
  const email = rawUser?.email || (isGuest ? 'Guest mode' : '');
  const provider = rawUser?.provider || (isGuest ? 'guest' : 'email_otp');

  return {
    id: String(rawUser?.id || ''),
    name: fullName,
    full_name: fullName,
    email,
    phone: rawUser?.phone || null,
    provider,
    avatar_url: rawUser?.avatar_url || null,
    is_guest: isGuest,
    is_owner: Boolean(rawUser?.is_owner),
    role: rawUser?.is_owner ? 'admin' : 'user',
    language: 'en',
    subscription: {
      plan: isGuest ? 'guest' : 'starter',
      status: 'active',
    },
    usage: {
      messagesThisMonth: 0,
      totalMessages: 0,
    },
    messageLimit: isGuest ? 20 : Infinity,
    isSubscriptionActive: true,
    createdAt: null,
    updatedAt: null,
  };
};

const fetchProfile = async () => {
  const { data } = await api.get(API_ENDPOINTS.auth.me);
  return normalizeSessionUser(data?.user || data);
};

const commitSession = (accessToken, set) => {
  setStoredSessionToken(accessToken);
  set({
    apiKey: getStoredApiKey(),
    accessToken,
    ownerKey: getStoredOwnerKey(),
    isAuthenticated: true,
    isLoading: false,
  });
};

const applyAuthSuccess = async ({ accessToken, user }, set) => {
  if (!accessToken) {
    throw new Error('Authentication token missing from response.');
  }

  commitSession(accessToken, set);
  const normalizedUser = user ? normalizeSessionUser(user) : await fetchProfile();
  setStoredSessionUser(normalizedUser);

  set({
    user: normalizedUser,
    isLoading: false,
  });

  await claimPendingReferral();

  return normalizedUser;
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: initialUser,
      apiKey: initialApiKey,
      accessToken: initialAccessToken,
      ownerKey: initialOwnerKey,
      isLoading: false,
      isAuthenticated: Boolean(initialAccessToken),
      hasHydrated: false,
      otpEmail: '',
      otpPreview: null,

      hydrateFromStorage: () => {
        const apiKey = getStoredApiKey();
        const accessToken = getStoredSessionToken();
        const ownerKey = getStoredOwnerKey();
        const user = getStoredSessionUser();
        set((state) => ({
          user: user || state.user,
          apiKey,
          accessToken,
          ownerKey,
          isAuthenticated: Boolean(accessToken) || state.isAuthenticated,
        }));
        return { apiKey, accessToken, ownerKey, user };
      },

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      setUser: (user) => {
        if (user) {
          setStoredSessionUser(user);
        } else {
          clearStoredSessionUser();
        }
        set({ user, isAuthenticated: !!user || !!getStoredSessionToken() });
      },

      setApiKey: (apiKey) => {
        setStoredApiKey(apiKey);
        set({ apiKey: getStoredApiKey() });
      },

      setOwnerKey: (ownerKey) => {
        setStoredOwnerKey(ownerKey);
        set({ ownerKey: getStoredOwnerKey() });
      },

      requestEmailOtp: async (email, fullName = '') => {
        set({ isLoading: true });
        try {
          const { data } = await api.post(API_ENDPOINTS.auth.emailRequestOtp, {
            email,
            full_name: fullName || null,
          });

          set({
            isLoading: false,
            otpEmail: data?.email || email,
            otpPreview: data?.otp_preview || null,
          });

          return {
            success: true,
            email: data?.email || email,
            otpPreview: data?.otp_preview || null,
            delivery: data?.delivery || 'console',
          };
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            message: resolveApiErrorMessage(error, 'Unable to send OTP.'),
          };
        }
      },

      verifyEmailOtp: async (email, otp, fullName = '') => {
        set({ isLoading: true });
        try {
          const { data } = await api.post(API_ENDPOINTS.auth.emailVerify, {
            email,
            otp,
            full_name: fullName || null,
          });

          await applyAuthSuccess(
            {
              accessToken: data?.access_token,
              user: data?.user,
            },
            set
          );

          set({ otpEmail: '', otpPreview: null });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            message: resolveApiErrorMessage(error, 'OTP verification failed.'),
          };
        }
      },

      loginWithGuest: async (fullName = '') => {
        set({ isLoading: true });
        try {
          const { data } = await api.post(API_ENDPOINTS.auth.guest, {
            full_name: fullName || null,
          });

          await applyAuthSuccess(
            {
              accessToken: data?.access_token,
              user: data?.user,
            },
            set
          );

          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            message: resolveApiErrorMessage(error, 'Guest login failed.'),
          };
        }
      },

      getOAuthUrl: async (provider) => {
        const { data } = await api.get(API_ENDPOINTS.auth.oauthUrl(provider));
        return data?.auth_url;
      },

      consumeAuthToken: async (token) => {
        set({ isLoading: true });
        try {
          commitSession(token, set);
          try {
            const user = await fetchProfile();
            setStoredSessionUser(user);
            set({ user, isAuthenticated: true, isLoading: false });
            await claimPendingReferral();
          } catch (profileError) {
            if (profileError?.response?.status === 401) {
              throw profileError;
            }
            console.warn('Auth token accepted but profile fetch failed:', profileError);
            set({ user: getStoredSessionUser(), isAuthenticated: true, isLoading: false });
          }
          return { success: true };
        } catch (error) {
          clearStoredAuth();
          set({
            user: null,
            apiKey: getStoredApiKey(),
            accessToken: null,
            ownerKey: getStoredOwnerKey(),
            isAuthenticated: false,
            isLoading: false,
          });
          return {
            success: false,
            message: resolveApiErrorMessage(error, 'Unable to complete sign in.'),
          };
        }
      },

      logout: async () => {
        clearStoredAuth();
        set({
          user: null,
          apiKey: getStoredApiKey(),
          accessToken: null,
          ownerKey: getStoredOwnerKey(),
          isAuthenticated: false,
          otpEmail: '',
          otpPreview: null,
        });
      },

      refreshAccessToken: async () => Boolean(get().accessToken),

      updateUser: (updates) => {
        set((state) => {
          const nextUser = state.user ? { ...state.user, ...updates } : state.user;
          if (nextUser) {
            setStoredSessionUser(nextUser);
          }
          return { user: nextUser };
        });
      },

      fetchMe: async () => {
        const accessToken = get().accessToken || getStoredSessionToken();
        if (!accessToken) {
          clearStoredSessionUser();
          set({ isAuthenticated: false, user: null });
          return null;
        }

        if (!get().accessToken || !get().isAuthenticated) {
          set({
            apiKey: getStoredApiKey(),
            accessToken,
            ownerKey: getStoredOwnerKey(),
            isAuthenticated: true,
          });
        }

        try {
          const user = await fetchProfile();
          setStoredSessionUser(user);
          set({ user, isAuthenticated: true });
          return user;
        } catch (error) {
          if (error?.response?.status === 401) {
            clearStoredAuth();
            set({
              user: null,
              apiKey: getStoredApiKey(),
              accessToken: null,
              ownerKey: getStoredOwnerKey(),
              isAuthenticated: false,
            });
          }
          return null;
        }
      },
    }),
    {
      name: 'nova-mind-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        apiKey: state.apiKey,
        accessToken: state.accessToken,
        ownerKey: state.ownerKey,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        otpEmail: state.otpEmail,
        otpPreview: state.otpPreview,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState || {};
        const apiKey = getStoredApiKey() || persisted.apiKey || currentState.apiKey || null;
        const accessToken = getStoredSessionToken() || persisted.accessToken || currentState.accessToken || null;
        const ownerKey = getStoredOwnerKey() || persisted.ownerKey || currentState.ownerKey || null;
        const user = getStoredSessionUser() || persisted.user || currentState.user || null;

        return {
          ...currentState,
          ...persisted,
          apiKey,
          accessToken,
          ownerKey,
          user,
          isAuthenticated: Boolean(accessToken) || Boolean(persisted.isAuthenticated),
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.hydrateFromStorage?.();
        state?.setHasHydrated?.(true);
      },
    }
  )
);

export default useAuthStore;
