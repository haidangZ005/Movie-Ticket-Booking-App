import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'accessToken'; // SecureStore keys should avoid special characters if possible
const REFRESH_TOKEN_KEY = 'refreshToken';
const PROFILE_KEY = '@profile'; // AsyncStorage key

// Fallback cleanup in case old tokens exist in AsyncStorage
const cleanupLegacyTokens = async () => {
  try {
    await AsyncStorage.multiRemove(['@accessToken', '@refreshToken']);
  } catch (e) {
    // ignore
  }
};

export const saveAuthSession = async (accessToken: string, refreshToken: string, profile?: any) => {
  if (!accessToken || typeof accessToken !== 'string') {
    throw new Error('Cannot save auth session: missing or invalid accessToken');
  }
  if (!refreshToken || typeof refreshToken !== 'string') {
    throw new Error('Cannot save auth session: missing or invalid refreshToken');
  }

  try {
    await cleanupLegacyTokens(); // Clean up on new login just in case
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    
    if (profile) {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    }
  } catch (error) {
    console.error('Error saving auth session', error);
    throw error;
  }
};

export const loadAuthSession = async () => {
  try {
    const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    const profileString = await AsyncStorage.getItem(PROFILE_KEY);
    
    // Attempt to fallback to AsyncStorage if tokens are not in SecureStore (Migration path)
    let fallbackAccessToken = accessToken;
    let fallbackRefreshToken = refreshToken;
    
    if (!accessToken && !refreshToken) {
      fallbackAccessToken = await AsyncStorage.getItem('@accessToken');
      fallbackRefreshToken = await AsyncStorage.getItem('@refreshToken');
      
      // If found in legacy storage, migrate them
      if (fallbackAccessToken && fallbackRefreshToken) {
        await saveAuthSession(fallbackAccessToken, fallbackRefreshToken);
      }
    }

    return {
      accessToken: fallbackAccessToken,
      refreshToken: fallbackRefreshToken,
      profile: profileString ? JSON.parse(profileString) : null,
    };
  } catch (error) {
    console.error('Error loading auth session', error);
    return { accessToken: null, refreshToken: null, profile: null };
  }
};

export const clearAuthSession = async () => {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await AsyncStorage.removeItem(PROFILE_KEY);
    await cleanupLegacyTokens();
  } catch (error) {
    console.error('Error clearing auth session', error);
  }
};

export const getAccessToken = async () => {
  try {
    let token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    if (!token) token = await AsyncStorage.getItem('@accessToken'); // fallback
    return token;
  } catch (error) {
    return null;
  }
};

export const getRefreshToken = async () => {
  try {
    let token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (!token) token = await AsyncStorage.getItem('@refreshToken'); // fallback
    return token;
  } catch (error) {
    return null;
  }
};
