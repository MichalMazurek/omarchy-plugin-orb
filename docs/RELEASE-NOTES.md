# Orb v0.1.1 — native installation fix

Install Orb directly from `main`:

```bash
omarchy plugin add https://github.com/tcballard/omarchy-plugin-orb.git --enable
```

Orb initializes missing settings and owns Super+Alt+O and optional desktop activation while enabled. Existing layouts are retained. Standard plugin update and remove commands work without a source checkout or a second terminal step. Setup failures appear in Orb with Retry; conflicting user shortcuts stay untouched. Unmodified v0.1.0 installer files migrate automatically with backups.

Portable tests cover initialization, conflicts, migration rollback, stale completions, repeated registration, compositor-state reset and owner-scoped cleanup. New live XPS lifecycle acceptance is pending. The owner authorized v0.1.1 publication with that live verification still outstanding. The previous owner acceptance remains evidence for v0.1.0 only.

Update:

```bash
omarchy plugin update io.github.tcballard.orb
```

Remove:

```bash
omarchy plugin remove io.github.tcballard.orb
```

If your v0.1.0 installation tracks a local source checkout, use the normal remove and add commands once to switch it to the public repository. Saved Orb settings survive; the unchanged legacy shortcut module migrates on enable.
