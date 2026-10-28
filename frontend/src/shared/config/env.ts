export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  wsUrl: import.meta.env.VITE_WS_URL ?? 'ws://localhost:3000',
  /** Serves canned hierarchy/auth data from memory instead of hitting a real backend — see `shared/api/mock-backend.ts`. */
  mockAuth: import.meta.env.VITE_MOCK_AUTH === 'true',
} as const
