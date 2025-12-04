'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/lib/auth';

export function useAuth() {
  const router = useRouter();
  const { user, token, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on mount
    const storedToken = authService.getToken();
    if (storedToken && !token) {
      setAuth(null, storedToken);
    }
    setIsLoading(false);
  }, [token, setAuth]);

  const logout = async () => {
    await authService.logout();
    clearAuth();
    router.push('/login');
  };

  const requireAuth = () => {
    if (!isAuthenticated && !isLoading) {
      router.push('/login');
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    logout,
    requireAuth,
    setAuth,
    clearAuth,
  };
}
