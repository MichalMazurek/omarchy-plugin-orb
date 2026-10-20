# Orb v0.1.1 — native installation fix

Install Orb directly from `main`:

```bash
omarchy plugin add https://github.com/tcballard/omarchy-plugin-orb.git --enable
```

Orb initializes missing settings and owns Super+Alt+O and optional desktop activation while enabled. Existing layouts are retained. Standard plugin update and remove commands work without a source checkout or a second terminal step. Setup failures appear in Orb with Retry; conflicting user shortcuts stay untouched. Unmodified v0.1.0 installer files migrate automatically with backups.

Portable tests cover initialization, conflicts, migration rollback, stale completions, repeated registration, compositor-state reset and owner-scoped cleanup. New live XPS lifecycle acceptance is pending. The previous owner acceptance remains evidence for v0.1.0 only; this candidate is not yet tagged or published.
