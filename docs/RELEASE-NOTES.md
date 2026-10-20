# Orb v0.1.0 — prepared release notes

Launch apps, change themes and open installed coding agents from a shortcut wheel near your pointer.

- Six configurable slots, expandable to eight, with an installed-app picker.
- Circular Settings and Agents menus, plus optional theme, plugin and app creation prompts through your default Omarchy agent.
- Mouse and keyboard selection, focus restoration, theme colours and captions that scale with the wheel.
- Super+Alt+O activation and optional right-click on empty desktop.
- Git-based installation, settings-preserving removal and rollback when shortcut installation fails.

Install from a fresh directory after publication:

```bash
git clone --branch v0.1.0 https://github.com/tcballard/omarchy-plugin-orb.git && cd omarchy-plugin-orb && ./install
```

The tag-based command becomes available when the release is published. Press **Super+Alt+O** to open Orb and click its centre to configure it. Remove it from the source checkout with `./uninstall`.

Requires the Quattro shell APIs documented in the README and the standard Omarchy launchers, Bash, Git, jq and libnotify. Optional integrations require their corresponding apps or plugins. Orb does not install agents or change the default agent.

Historical live evidence covers the recorded Dell XPS 9320 at 1920×1200, scale 1. Physical multi-monitor, hotplug, fractional scaling and other architectures remain unverified. The settings panel does not edit custom command arguments, submenu contents or the activation shortcut. See [acceptance evidence](ACCEPTANCE.json) and [release preparation](RELEASE.md) for source identities and outstanding final checks.

Assets will include a source archive, source/release manifests, an SPDX source-package inventory and SHA-256 checksums. Installation requires Git metadata; the tarball is not an installer. Third-party marks and screenshot provenance are documented in [CREDITS.md](../CREDITS.md).
