// Centralized Admin Secret Path Configuration
// Changes the default predictable "/admin" route to an unguessable secure path
export const ADMIN_PORTAL_PATH = process.env.NEXT_PUBLIC_ADMIN_PORTAL_PATH || '/hq-master-88';
