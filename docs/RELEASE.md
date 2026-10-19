# Orb v0.1.0 preparation

The candidate is on `feature/shortcut-wheel`. `VERSION` and `manifest.json` both specify `0.1.0`. Release notes are in [CHANGELOG.md](../CHANGELOG.md). No tag or release has been published.

## Before tagging

1. Run `./tests/native` on the intended Omarchy installation and review [ACCEPTANCE.json](ACCEPTANCE.json). Historical launch/theme checks and later focused checks identify their own tested commits.
2. Finish live removal/reinstall acceptance and the uninterrupted six → seven → eight → six slot Save flow. Existing evidence covers installation/updates, eight-slot selection, removal/Cancel and model persistence checks; it does not establish these complete lifecycle checks.
3. Check the physical Super+Alt+O shortcut. Multi-monitor, hotplug and fractional scaling remain explicit v0.1.0 limitations. Do not execute an agent creation task solely to verify its starter prompt.
4. Review a current still preview and its source identity. Video recording remains on hold. `node tests/preview-live.cjs` captures an empty-workspace still under `artifacts/` and restores focus/workspace/pointer; inspect it before copying it to `preview.png`. Concurrent desktop activity can invalidate a capture.
5. Record release acceptance at the final tested commit, including commands, results, limitations and the full Omarchy SHA. The archive gate deliberately rejects the current historical `passed-with-limitations` record: do not silently change it to `passed`. A new explicit release acceptance entry is required, preserving historical evidence.
6. Merge the candidate PR after CI passes. Record the final full SHA and require a clean tree. Reconcile runtime/build changes with acceptance; documentation-only evidence commits may follow the tested commit.

## Tag and draft assets, when authorized

Create an annotated `v0.1.0` tag on the accepted default-branch HEAD and push it. Never move a published tag. The manual **Release source** workflow accepts that existing tag, reruns portable checks, verifies version/evidence identity, and creates a draft GitHub release.

Assets include the complete tracked source archive, `SOURCE-MANIFEST.json`, `RELEASE-MANIFEST.json`, an SPDX 2.3 source-package inventory (`SBOM.spdx.json`) and `SHA256SUMS`. The manifests bind the repository, commit and tree, and the checksum list covers every release file except itself. The SBOM is a source-package inventory, not a transitive inventory of the host Omarchy system.

Download the draft assets and verify their manifests, exact sizes and SHA-256 digests before publishing. The source archive includes development checks and starter provenance; it is not a binary or a standalone installer. Install from a Git checkout with `./install`, update with `git pull --ff-only` followed by `./install`, and remove with `./uninstall`. Source tarballs lack the Git metadata required by the installer.

The release skill's bundled preflight uses Python; it was inspected but not executed because this project was requested without Python. Native/Node validation is separate evidence, not a claim that that preflight passed. Static checks are not a security audit or a compatibility guarantee.

Publishing the tag, GitHub release and marketplace listing are separate actions. None is performed by this preparation PR.
