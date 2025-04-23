import { atom } from 'jotai';
import traktService from '../api/traktService';

// Types
export const isAuthenticatedAtom = atom<boolean>(traktService.isAuthenticated());
export const authLoadingAtom = atom<boolean>(false);
export const authErrorAtom = atom<string | null>(null);

export const logout = async (
  setIsAuthenticated: (authenticated: boolean) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
): Promise<void> => {
  setLoading(true);
  setError(null);
  
  try {
    await traktService.logout();
    setIsAuthenticated(false);
  } catch (error) {
    console.error('Logout error:', error);
    setError(error instanceof Error ? error.message : 'Logout failed');
  } finally {
    setLoading(false);
  }
};