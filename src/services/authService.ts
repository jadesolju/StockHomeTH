export interface AuthUser { id: string; name: string; email: string; plan: 'free' | 'pro' | 'team'; subscriptionStatus: 'inactive' | 'active' | 'past_due'; createdAt: string; }
const request = async (path: string, init: RequestInit = {}) => {
  const response = await fetch(path, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...init.headers }, ...init });
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error || 'Something went wrong. Please try again.'); }
  return response.status === 204 ? null : response.json();
};
export const authService = {
  register: (name: string, email: string, password: string) => request('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }) as Promise<{ user: AuthUser }>,
  login: (email: string, password: string) => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }) as Promise<{ user: AuthUser }>,
  me: () => request('/api/auth/me') as Promise<{ user: AuthUser }>,
  logout: () => request('/api/auth/logout', { method: 'POST' }),
};
