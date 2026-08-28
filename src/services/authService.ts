import type { UserAuthData } from '../components/AuthModal';

const BACKEND_AUTH_URL = 'http://localhost:3001/api/auth/oauth';

export const authService = {
  // Authenticate user via OAuth provider
  async loginWithOAuth(provider: 'Google' | 'Facebook' | 'Discord' | 'Apple' | 'X'): Promise<UserAuthData> {
    try {
      const response = await fetch(BACKEND_AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, authCode: 'mock_code_' + Date.now() }),
        signal: AbortSignal.timeout(3000)
      });

      if (response.ok) {
        const json = await response.json();
        if (json.user) {
          return {
            name: json.user.name,
            email: json.user.email,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${json.user.userId}`,
            provider,
            tier: 'Pro Preview'
          };
        }
      }
    } catch (e) {
      console.warn('Backend Auth offline, performing client OAuth authentication simulation', e);
    }

    // Client fallback OAuth simulation
    return {
      name: `User (${provider})`,
      email: `dev.${provider.toLowerCase()}@stockhometh.com`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider}_${Date.now()}`,
      provider,
      tier: 'Pro Preview'
    };
  }
};
