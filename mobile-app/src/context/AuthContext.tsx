import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { loadAuthSession, clearAuthSession, saveAuthSession } from '../utils/token';
import { customerService } from '../services/customerService';
import { authService } from '../services/authService';

const isSuccessResponse = (response: any) => {
  return response?.success === true || (typeof response?.code === 'number' && response.code >= 1000 && response.code < 3000);
};

interface AuthState {
  user: any;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  setSession: (accessToken: string, refreshToken: string, user: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  setSession: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Sync context state when apiClient forces a logout (e.g. refresh token failure)
    const logoutSubscription = DeviceEventEmitter.addListener('onLogout', () => {
      setState({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    });

    return () => {
      logoutSubscription.remove();
    };
  }, []);

  useEffect(() => {
    const bootstrapAsync = async () => {
      let accessToken: string | null = null;
      let user: any = null;
      let isAuthenticated = false;

      try {
        const session = await loadAuthSession();
        if (session.accessToken) {
          accessToken = session.accessToken;
          user = session.profile;
          isAuthenticated = true;

          // Attempt to fetch fresh profile. If this fails due to 401, 
          // apiClient interceptor will catch it, try to refresh, and if that fails, 
          // it will emit 'onLogout' which clears our state.
          const profileRes = await customerService.getProfile();
          if (isSuccessResponse(profileRes)) {
            user = profileRes.data;
          }
        }
      } catch (e) {
        console.log('Failed to restore token', e);
      } finally {
        setState((prev) => {
          // If a forced logout happened during bootstrap (via DeviceEventEmitter), 
          // the listener will have set isLoading to false.
          // In that case, don't overwrite it with our local state.
          if (!prev.isLoading) {
             return prev; 
          }
          return {
            user,
            accessToken,
            isAuthenticated,
            isLoading: false,
          };
        });
      }
    };

    bootstrapAsync();
  }, []);

  const setSession = async (accessToken: string, refreshToken: string, baseUser: any) => {
    await saveAuthSession(accessToken, refreshToken, baseUser);
    
    // Set temporary state while we fetch the full profile
    setState({
      user: baseUser,
      accessToken,
      isAuthenticated: true,
      isLoading: true,
    });

    try {
      // Fetch full profile to get FullName, AvatarUrl, Gender, DateOfBirth, PhoneNumber
      const profileRes = await customerService.getProfile();
      if (isSuccessResponse(profileRes)) {
        const fullUser = { ...baseUser, ...profileRes.data };
        await saveAuthSession(accessToken, refreshToken, fullUser);
        
        setState({
          user: fullUser,
          accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }
    } catch (e) {
      console.log('Failed to fetch full profile during setSession', e);
    }

    // Fallback if profile fetch fails
    setState({
      user: baseUser,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const session = await loadAuthSession();
      if (session.refreshToken) {
         await authService.logout(session.refreshToken);
      }
    } catch (e) {
      console.log('Logout API error', e);
    } finally {
      await clearAuthSession();
      DeviceEventEmitter.emit('onLogout'); // Ensure all listeners (if any) are notified
      setState({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const refreshProfile = async () => {
    try {
      const profileRes = await customerService.getProfile();
      if (isSuccessResponse(profileRes)) {
        setState((prev) => ({ ...prev, user: profileRes.data }));
      }
    } catch (e) {
      console.log('Refresh profile failed', e);
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, setSession, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
