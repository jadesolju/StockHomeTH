import type { StockNewsItem } from '../lib/schemas/newsSchema';
import type { UserAuthData } from '../lib/schemas/authSchema';

// Discriminated Union for Async Data States
export type AsyncState<TData, TError = string> =
  | { readonly status: 'idle'; readonly data: null; readonly error: null }
  | { readonly status: 'loading'; readonly data: TData | null; readonly error: null }
  | { readonly status: 'success'; readonly data: TData; readonly error: null }
  | { readonly status: 'error'; readonly data: null; readonly error: TError };

// Discriminated Union for Global Modals
export type ModalState =
  | { readonly type: 'none' }
  | { readonly type: 'auth'; readonly initialTab: 'login' | 'register' }
  | { readonly type: 'apiKey' }
  | { readonly type: 'newsDetail'; readonly article: StockNewsItem }
  | { readonly type: 'subscription' };

// Discriminated Union for Auth State
export type AuthState =
  | { readonly status: 'unauthenticated'; readonly user: null }
  | { readonly status: 'authenticating'; readonly user: null }
  | { readonly status: 'authenticated'; readonly user: UserAuthData };
