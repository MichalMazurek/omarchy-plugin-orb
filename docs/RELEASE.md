# Orb v0.1.0 release record

The owner confirmed all final XPS tests and all five marketplace checklist statements on 2026-10-19 (2026-10-20T01:17:46Z). He also confirmed that he made the wallpaper visible in the preview.

## Accepted source

Owner-tested main: `2d271b065ce1ebc78eb314c1bd680479e78e684e`. Release documentation source: `386e5b4f632de25492b2273b59d532090e148c63`. The intervening changes are README, changelog, credits and release/submission drafts; runtime and workflow content is unchanged. Portable checks were rerun against that document tree. [ACCEPTANCE.json](ACCEPTANCE.json) records the distinction between owner-reported results and independently observed automation, and preserves the complete historical evidence.

The owner-confirmed final checks cover native validation, saving six → seven → eight → six slots, physical Super+Alt+O/action/focus behaviour, selected captions on light/dark palettes and the affected reinstall lifecycle. No new native logs or full current Omarchy SHA were independently collected here. Historical instrumented evidence covers the Dell XPS 9320 at 1920×1200, scale 1; physical multi-monitor, hotplug, fractional scaling and other architectures remain unverified.

## Publish

1. Merge this documentation-only acceptance record after green CI. Record final default-branch HEAD and require a clean checkout.
2. Create an immutable annotated `v0.1.0` tag on that HEAD. The archive gate binds it to acceptance and rejects intervening runtime/build changes.
3. Run portable checks and generate the complete source archive, source/release manifests, SPDX source-package inventory and SHA-256 checksums. Create draft assets with [RELEASE-NOTES.md](RELEASE-NOTES.md).
4. Download the draft assets and verify source identities, exact sizes, digests and complete checksum coverage using the trusted release preflight, then publish the GitHub release.
5. Recheck the live marketplace form, duplicates and default HEAD. Submit the approved title **[Plugin]: Orb** with [MARKETPLACE-ISSUE.md](MARKETPLACE-ISSUE.md), then read back the issue and exact-commit validation results. Listing approval belongs to marketplace maintainers.

The source tarball lacks Git metadata; installation uses a Git checkout and `./install`. Update a main-branch source checkout with `git pull --ff-only` followed by `./install`; remove completely with `./uninstall`. A checkout pinned to the release tag stays pinned until the user deliberately selects a later version.

## Marketplace

Destination: `omacom/omarchy-plugin-marketplace`. Category: **Desktop**. Tags: **Launcher, Quickshell, Hyprland**. The current form was rechecked before publication. The approved body explains why the repository installer is needed for the shortcut; listing installation presentation remains a maintainer decision.

The trusted static release preflight is a development check and adds no Python runtime dependency to Orb. Omakit and live Omarchy/Qt are unavailable in this preparation environment. Installer surfaces, local process execution/collection and distributed authoring instructions require manual review. Static checks do not establish marketplace approval or a security audit.
