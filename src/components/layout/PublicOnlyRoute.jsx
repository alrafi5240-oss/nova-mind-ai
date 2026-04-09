import { Navigate, useLocation } from 'react-router-dom';

export default function PublicOnlyRoute({ children }) {
  const location = useLocation();
  const token =
    typeof window === 'undefined'
      ? ''
      : (window.localStorage.getItem('auth_token') || '').trim();
  const searchParams = new URLSearchParams(location.search);
  const hashParams =
    typeof window === 'undefined'
      ? new URLSearchParams()
      : new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const hasAuthCallback =
    searchParams.has('token') ||
    searchParams.has('auth_token') ||
    searchParams.has('access_token') ||
    searchParams.has('error') ||
    hashParams.has('token') ||
    hashParams.has('auth_token') ||
    hashParams.has('access_token');

  if (hasAuthCallback) {
    return children;
  }

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
