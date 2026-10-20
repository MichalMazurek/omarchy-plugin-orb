# Orb v0.1.0

Launch apps, change themes and open installed coding agents from a shortcut wheel near your pointer.

- Six configurable slots, expandable to eight, with an installed-app picker.
- Circular Settings and Agents menus, plus optional theme, plugin and app creation prompts through your default Omarchy agent.
- Mouse and keyboard selection, focus restoration, theme colours and captions that scale with the wheel.
- Super+Alt+O activation and optional right-click on empty desktop.
- Git-based installation, settings-preserving removal and rollback when shortcut installation fails.

Install from a fresh directory:

```bash
git clone --branch v0.1.0 https://github.com/tcballard/omarchy-plugin-orb.git && cd omarchy-plugin-orb && ./install
```

Press **Super+Alt+O** to open Orb and click its centre to configure it. Remove it from the source checkout with `./uninstall`.

Requires the Quattro shell APIs documented in the README and the standard Omarchy launchers, Bash, Git, jq and libnotify. Optional integrations require their corresponding apps or plugins. Orb does not install agents or change the default agent.

The owner confirmed final acceptance on the XPS on 2026-10-19, including native validation, the saved six-to-eight-to-six slot flow, physical shortcut/focus behaviour, light/dark captions and reinstall. Historical instrumented evidence covers a Dell XPS 9320 at 1920×1200, scale 1. Physical multi-monitor, hotplug, fractional scaling and other architectures remain unverified. The settings panel does not edit custom command arguments, submenu contents or the activation shortcut. See [acceptance evidence](https://github.com/tcballard/omarchy-plugin-orb/blob/v0.1.0/docs/ACCEPTANCE.json) for source identities and the distinction between owner-reported and automated results.

Assets include a source archive, source/release manifests, an SPDX source-package inventory and SHA-256 checksums. Installation requires Git metadata; the tarball is not an installer. Third-party marks and screenshot provenance are documented in [CREDITS.md](https://github.com/tcballard/omarchy-plugin-orb/blob/v0.1.0/CREDITS.md).
