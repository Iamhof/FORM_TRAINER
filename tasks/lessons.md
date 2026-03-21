# Learned Rules

Rules discovered during development. Claude reads this at session start. Developer approves all entries.

<!-- Format: NEVER/ALWAYS [specific behaviour] — YYYY-MM-DD -->
<!-- Example: NEVER modify existing migration files — create new ones instead — 2026-03-13 -->
<!-- Example: ALWAYS check for __isInvalid state on Supabase client before DB calls — 2026-03-13 -->

ALWAYS set expo-updates checkAutomatically to "NEVER" unless OTA updates are actively published — a crash during error recovery with no published update causes an unrecoverable native SIGABRT loop — 2026-03-18
NEVER assume react/jsx-runtime resolves correctly in EAS production builds — the entry file branches on process.env.NODE_ENV which can fail in Hermes bundles. Use a postinstall script to patch the source file directly; Metro resolveRequest alone is not sufficient — 2026-03-21
NEVER rely solely on Metro resolveRequest to fix module resolution in EAS builds — use a postinstall script to patch the source file directly for guaranteed results — 2026-03-21
