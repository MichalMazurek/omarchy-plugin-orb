# Orb v0.1.0 preparation

Orb and its review fixes are merged into `main`. `VERSION` and `manifest.json` both specify `0.1.0`. The reviewed runtime/workflow source is `583fcc84c3527d48e47b8671236f9cd4d0ed437a`; these preparation changes affect documentation only. [Release notes](RELEASE-NOTES.md) and the [marketplace issue draft](MARKETPLACE-ISSUE.md) are ready for review. No tag, release or marketplace issue has been published.

## Before tagging

1. Run `./tests/native` on the intended Omarchy installation and review [ACCEPTANCE.json](ACCEPTANCE.json). Historical launch/theme checks and later focused checks identify their own tested commits.
2. Finish the uninterrupted six → seven → eight → six slot Save flow. The real XPS removal/reinstall check has passed: Orb unloads and its checkout/module/bindings disappear; fresh Git reinstall and repeated installation preserve eight saved slots, size, animation and unrelated settings. Three summon/Escape cycles and focus restoration passed after reinstall. See `removal_reinstall` in the acceptance record.
3. Check the physical Super+Alt+O shortcut, action launch, Escape/outside-click focus restoration, and the selected caption on both a dark and a light shell palette after loading the merged colour fix. Restore the original palette afterwards. Multi-monitor, hotplug, fractional scaling and other architectures remain unverified. Do not execute an agent creation task solely to verify its starter prompt.
4. Review a current still preview and its source identity. The existing real XPS preview is recorded at `ca112249cf16e710808ebab72eeafd37071fa224`; an owner-produced GIF can be added later. `node tests/preview-live.cjs` captures an empty-workspace still under `artifacts/` and restores focus/workspace/pointer; inspect it before copying it to `preview.png`. Concurrent desktop activity can invalidate a capture. Recheck the affected installer lifecycle using `node tests/lifecycle-live.cjs` on the idle XPS; it deliberately removes/reinstalls Orb and retains backups.
5. Record release acceptance at the final tested commit, including commands, results, limitations and the full Omarchy SHA. The archive gate deliberately rejects the current historical `passed-with-limitations` record: do not silently change it to `passed`. A new explicit release acceptance entry is required, preserving historical evidence.
6. Merge release preparation and final source-bound acceptance after CI passes. Record the final full SHA and require a clean tree. Reconcile runtime/build changes with acceptance; documentation-only evidence commits may follow the tested commit. The original four PRs are already merged and CI passed on `583fcc84c3527d48e47b8671236f9cd4d0ed437a`.

## Tag and draft assets, when authorized

Create an annotated `v0.1.0` tag on the accepted default-branch HEAD and push it. Never move a published tag. The manual **Release source** workflow accepts that existing tag, reruns portable checks, verifies version/evidence identity, and creates a draft GitHub release.

Assets include the complete tracked source archive, `SOURCE-MANIFEST.json`, `RELEASE-MANIFEST.json`, an SPDX 2.3 source-package inventory (`SBOM.spdx.json`) and `SHA256SUMS`. The manifests bind the repository, commit and tree, and the checksum list covers every release file except itself. The SBOM is a source-package inventory, not a transitive inventory of the host Omarchy system.

Download the draft assets and verify their manifests, exact sizes and SHA-256 digests before publishing. The source archive includes development checks and starter provenance; it is not a binary or a standalone installer. Install from a Git checkout with `./install`, update with `git pull --ff-only` followed by `./install`, and remove with `./uninstall`. Source tarballs lack the Git metadata required by the installer.

The trusted release preflight is a development check; it adds no Python runtime dependency to Orb. It is separate from the official installed validator and live-shell acceptance. Static checks are not a security audit or a compatibility guarantee. Omakit and the live Omarchy/Qt environment are unavailable in this preparation environment.

Publishing the tag, GitHub release and marketplace listing are separate actions. None is performed by this preparation PR.

## Marketplace preparation

Destination: `omacom/omarchy-plugin-marketplace`. Title: **[Plugin]: Orb**. Category: **Desktop**. Tags: **Launcher, Quickshell, Hyprland**. The complete [issue body](MARKETPLACE-ISSUE.md) retains unchecked boxes until the owner confirms all five statements, including rights to the screenshot's visible wallpaper. Show the exact body before posting; an instruction to prepare a release is not an ownership attestation.

The current upstream form and CLI guide were reviewed at `97167fc2752009149ea456d6fe1b79a1dc9fe224`. Repository-URL and plugin-ID issue searches found no existing Orb request; marketplace code search returned no match for `io.github.tcballard.orb`. Recheck default HEAD, duplicates, the form and the exact accepted source before submission. A new listing requires fresh exact-commit reports and maintainer approval.

The installer must be reviewed for listing presentation: `./install` registers the owned shortcut, whereas standard plugin-manager installation alone does not. Other review surfaces are local process execution and collected output, the installer/uninstaller, and distributed authoring instructions. These require manual review; a static preflight pass does not grant marketplace approval.
