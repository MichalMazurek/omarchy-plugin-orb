# Orb v0.2.0 candidate

Prepared on `feature/settings-editor`, separate from `main`. The manifest and VERSION are 0.2.0. No v0.2.0 tag or GitHub release has been published.

[Acceptance evidence](ACCEPTANCE.json) binds the native and portable checks to the tested commit. [Release notes](RELEASE-NOTES.md) describe the user-visible changes. The previous release's [acceptance](history/v0.1.1-ACCEPTANCE.json), [release record](history/v0.1.1-RELEASE.md) and [notes](history/v0.1.1-RELEASE-NOTES.md) are retained separately.

Native checks use owned Omadev sessions with the Omarchy 4.0.6 source and the current development shell on this XPS. They share the installed Quickshell and Hyprland packages; this does not recreate the reporter's full historical OS. Installation checks use the real plugin manager and a private local Git origin, upgrading the published v0.1.1 source to the candidate, then testing a fresh configuration, disable/enable, reload, update and removal. They restore the test session's original configuration and leave the host installation alone.

Source archive preparation is exercised only in a disposable clone with a local annotated tag. The real repository and GitHub receive no v0.2.0 tag from this preparation. Candidate assets are local review artifacts, not a published release.

Before publication, review and merge the branch, require green CI on the final `main` commit, reconcile that commit against the accepted runtime, and dispatch the release workflow for the exact authorized SHA. The workflow creates an immutable annotated tag and a draft release with a source archive, source/release manifests, SPDX inventory and SHA-256 checksums. Download and verify those draft assets before publication. Marketplace snapshot updates remain a separate maintainer review.

Physical multi-monitor, hotplug, fractional scaling and other architectures remain unverified. A hard shell crash can leave runtime bindings until shell restart or compositor reload. Modified legacy files and unrelated configuration are preserved.
