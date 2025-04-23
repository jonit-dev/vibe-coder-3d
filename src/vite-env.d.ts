/// <reference types="vite/client" />

// This file contains type declarations for Vite-specific environment variables
// and other Vite-specific globals that may be used in the project.

interface ImportMeta {
  readonly env: {
    readonly MODE: string;
    readonly BASE_URL: string;
    readonly PROD: boolean;
    readonly DEV: boolean;
    readonly SSR: boolean;
    // Add more environment variables as needed
    [key: string]: string | boolean | undefined;
  };
}
