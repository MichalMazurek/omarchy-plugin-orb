# Changelog

## 0.1.1 — native installation fix

- Install, update and remove through the normal Omarchy plugin commands against `main`.
- Create missing settings on enable while retaining existing layouts and custom metadata.
- Own shortcut and optional desktop bindings for the enabled plugin’s lifetime, including compositor reload and unload cleanup.
- Show setup failures and Retry inside Orb; preserve conflicting user shortcuts.
- Migrate unchanged v0.1.0 installer files with backups and rollback; preserve modified files.

Portable lifecycle and migration fixtures pass. New live XPS lifecycle acceptance remains pending; v0.1.0 acceptance is retained as historical evidence.

## 0.1.0 — 2026-10-19

Orb brings a pointer-centred shortcut wheel to Omarchy's Quattro shell.

- Six default slots, expandable to eight, with a native settings panel for choosing apps, plugins and shortcuts.
- Circular Settings and installed-agent submenus; an optional Make something cool menu starts the native theme, plugin or app creation prompt.
- Pointer and keyboard selection, click/Enter activation, Escape/outside-click dismissal, and focus restoration.
- Configurable Super+Alt+O shortcut and optional right-click activation on empty desktop, preserving application context menus.
- Live shell colours, native application icons, Codex/Claude/Grok marks, animated opening, and captions that grow with the wheel.
- Monitor-edge clamping, including reserved bar space and the caption below the wheel.
- Repository-based local installation and removal that retains the user's Orb configuration.
- Failed shortcut installation restores existing files and removes newly created binding files, including reload and configuration-query failures.
- Selected action captions use the shell theme's text colour for light and dark backgrounds.

Tested on a Dell XPS 9320 at 1920×1200, scale 1. This targets the Quattro development contract documented in the acceptance evidence; older Omarchy releases are not claimed compatible. Physical multi-monitor/fractional-scale testing remains outstanding. Theme testing covers live shell palette changes, not full desktop retinting. See [acceptance evidence](docs/ACCEPTANCE.json) for the precise scope and remaining gaps.

Owner acceptance completed on 2026-10-19. Marketplace listing remains subject to maintainer review.
