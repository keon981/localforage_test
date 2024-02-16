/// <reference types="vitest" />
import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from 'vite-tsconfig-paths'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    includeSource: ["src/__tests__/*.{js,tsx,ts}"],
    setupFiles: 'src/__tests__/setup.ts',
  },
  server: {
    host: "0.0.0.0",
    port: 8080
  },
  envDir: "env"
})
