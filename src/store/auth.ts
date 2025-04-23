import { atom } from 'jotai';
import traktService from '../api/traktService';

// Types
export interface DeviceCodeState {
  userCode: string;
  verificationUrl: string;
}

// Atoms
export const isAuthenticatedAtom = atom<boolean>(traktService.isAuthenticated());
export const authLoadingAtom = atom<boolean>(false);
export const authErrorAtom = atom<string | null>(null);
export const deviceCodeAtom = atom<DeviceCodeState | null>(null);

// Actions
export const loginWithDeviceCode = async (
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  setDeviceCode: (code: DeviceCodeState | null) => void
): Promise<boolean> => {
  setLoading(true);
  setError(null);
  
  try {
    // Start device authentication
    const { userCode, verificationUrl } = await traktService.startDeviceAuth();
    setDeviceCode({ userCode, verificationUrl });
    
    // Poll for authentication completion
    await traktService.pollDeviceAuth();
    
    return true;
  } catch (error) {
    console.error('Authentication error:', error);
    setError(error instanceof Error ? error.message : 'Authentication failed');
    return false;
  } finally {
    setLoading(false);
  }
};

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