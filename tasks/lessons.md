# Learned Rules

Rules discovered during development. Claude reads this at session start. Developer approves all entries.

<!-- Format: NEVER/ALWAYS [specific behaviour] — YYYY-MM-DD -->
<!-- Example: NEVER modify existing migration files — create new ones instead — 2026-03-13 -->
<!-- Example: ALWAYS check for __isInvalid state on Supabase client before DB calls — 2026-03-13 -->

ALWAYS set expo-updates checkAutomatically to "NEVER" unless OTA updates are actively published — a crash during error recovery with no published update causes an unrecoverable native SIGABRT loop — 2026-03-18
