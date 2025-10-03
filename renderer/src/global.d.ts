export {};

declare global {
  interface Window {
    Spotify: typeof Spotify;
    electron: {
      send: (channel: string, data?: unknown) => void;
      invoke: (channel: string, data?: unknown) => Promise<unknown>;
      on: (channel: string, func: (...args: unknown[]) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}
