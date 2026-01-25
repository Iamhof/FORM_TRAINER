import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig } from "vitest/config";
import type { Plugin } from "vite";

const projectRoot = path.resolve(fileURLToPath(import.meta.url), "..");

// Plugin to log files being transformed that contain typeof
const transformLogger: Plugin = {
  name: "transform-logger",
  transform(code, id) {
    // Only log files from our source code
    if (
      (id.includes("backend") || id.includes("lib") || id.includes("tests")) &&
      !id.includes("node_modules") &&
      code.includes("typeof")
    ) {
      const lines = code.split("\n");
      const typeofLines: string[] = [];
      lines.forEach((line, idx) => {
        if (line.includes("typeof") && !line.trim().startsWith("//")) {
          typeofLines.push(`  Line ${idx + 1}: ${line.trim()}`);
        }
      });
      if (typeofLines.length > 0) {
        console.error(`\n[TRANSFORM LOGGER] File with typeof: ${id}`);
        console.error(typeofLines.slice(0, 5).join("\n")); // Show first 5 occurrences
        if (typeofLines.length > 5) {
          console.error(`  ... and ${typeofLines.length - 5} more`);
        }
      }
    }
    return null; // Don't transform, just log
  },
};

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
        module: "ESNext",
        // Ensure types are stripped
        removeComments: false,
      },
    },
  },
  plugins: [transformLogger],
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    reporters: ["verbose"],
    bail: 1, // Stop on first error for easier debugging
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },
    include: ["tests/**/*.test.{ts,tsx}", "backend/**/*.test.{ts,tsx}"],
    watch: false,
    // Exclude React Native app files from test runs
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
      "**/lib/**",
    ],
  },
});

