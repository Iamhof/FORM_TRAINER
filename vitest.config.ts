import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const projectRoot = path.resolve(fileURLToPath(import.meta.url), "..");

export default defineConfig({
  resolve: {
    alias: {
      "@": projectRoot,
    },
  },
  esbuild: {
    target: "es2020",
    format: "esm",
    // Handle JSX and TypeScript
    jsx: "transform",
    logLevel: "verbose",
    // Ensure TypeScript types are stripped
    tsconfigRaw: {
      compilerOptions: {
        // Use ES2020 to support modern syntax
        target: "ES2020",
      },
    },
  },
  plugins: [], // Temporarily disabled transformLogger due to typeof parsing issues
  test: {
    globals: true,
    environment: "node",
    setupFiles: ['./tests/setup/vitest-minimal.setup.ts'], // Using minimal setup to avoid typeof errors
    reporters: ["verbose"],
    bail: 1, // Stop on first error for easier debugging
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },
    include: ["tests/**/*.test.{ts,tsx}", "tests/**/*.bench.{ts,tsx}", "backend/**/*.test.{ts,tsx}"],
    watch: false,
    // Exclude React Native app files from test runs (but allow lib for benchmarks)
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.expo/**",
      "**/app/**",
      "**/components/**",
      "**/contexts/**",
      "**/hooks/**",
      "**/constants/**",
      "**/types/**",
    ],
  },
});

