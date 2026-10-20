# Orb v0.1.1 native-install correction

The corrected installation uses `omarchy plugin add https://github.com/tcballard/omarchy-plugin-orb.git --enable` from the default `main` branch. Update and removal use the normal plugin manager. First enable initializes missing settings and registers runtime bindings; no post-install terminal step is required.

Portable setup/migration and actual Lua lifecycle fixtures pass, including conflict preservation, staged binding replacement, late apply/unload races, compositor-state reset and removal after the checkout disappears. Qt 6.10.2 parses the changed QML; the official manifest validator from Omarchy `81fd2d23ca6e3462183a4dc8360de3113fa8d80c` passes. Static validation has no errors or findings; its capability review remains advisory, not a security audit.

The previous owner acceptance belongs to v0.1.0 and is preserved in [ACCEPTANCE.json](ACCEPTANCE.json). The new lifecycle has not been observed on the XPS. The executable opt-in harness `node tests/lifecycle-live.cjs` now exercises native Git install, update, disable/re-enable, Hyprland reload, removal, saved settings and summon/focus behavior. It leaves Orb installed and records source-bound results. The owner explicitly authorized v0.1.1 publication after being told that this live check remains pending. This is release authorization, not a new test result. The pending checks remain in the source-bound acceptance record.

Record the exact portable-tested input SHA and owner authorization, merge the evidence-only record with green CI, and create an immutable annotated v0.1.1 tag at the final main SHA. Generate the archive/manifests/SBOM/checksums, verify downloaded draft assets with the trusted release preflight, then publish. The existing v0.1.0 tag must stay unchanged.

The active marketplace request is [#12313](https://github.com/omacom/omarchy-plugin-marketplace/issues/12313). Update its existing body with [MARKETPLACE-ISSUE.md](MARKETPLACE-ISSUE.md), retaining the owner’s confirmed rights and checklist statements, and identify the exact released main SHA and pending live verification. Listing approval remains with maintainers.

Known limits: physical multi-monitor/hotplug/fractional scaling and other architectures are unverified. A hard shell crash can leave runtime bindings until shell restart or compositor reload. Fresh installs do not write Hyprland files; migration changes only the exact unmodified legacy module/include, keeping backups and rollback. Config and unrelated files are preserved.

## Release authorization

Tom instructed: “Ok let’s release v0.1.1 then.” This followed the explicit report that CI and 26 tests passed and the new XPS lifecycle check remained pending. Keep the acceptance status `pending-live`; do not convert release authorization into a live pass. The archive builder permits this documented exception only when the owner record names the input source and version and `RELEASE_ACCEPT_PENDING_LIVE` equals the exact release HEAD. The main-branch workflow requires an explicit checkbox for that release; it defaults to false for future releases.
