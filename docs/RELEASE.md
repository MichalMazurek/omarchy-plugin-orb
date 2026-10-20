# Orb v0.1.1 native-install correction

The corrected installation uses `omarchy plugin add https://github.com/tcballard/omarchy-plugin-orb.git --enable` from the default `main` branch. Update and removal use the normal plugin manager. First enable initializes missing settings and registers runtime bindings; no post-install terminal step is required.

Portable setup/migration and actual Lua lifecycle fixtures pass, including conflict preservation, staged binding replacement, late apply/unload races, compositor-state reset and removal after the checkout disappears. Qt 6.10.2 parses the changed QML; the official manifest validator from Omarchy `81fd2d23ca6e3462183a4dc8360de3113fa8d80c` passes. Static validation has no errors or findings; its capability review remains advisory, not a security audit.

The previous owner acceptance belongs to v0.1.0 and is preserved in [ACCEPTANCE.json](ACCEPTANCE.json). The new lifecycle has not been observed on the XPS. The executable opt-in harness `node tests/lifecycle-live.cjs` now exercises native Git install, update, disable/re-enable, Hyprland reload, removal, saved settings and summon/focus behavior. It leaves Orb installed and records source-bound results. Do not mark this changed runtime accepted or publish a v0.1.1 tag until that live check passes.

After acceptance, record the exact runtime SHA, merge the evidence-only record with green CI, and create an immutable annotated v0.1.1 tag at the final main SHA. Generate the archive/manifests/SBOM/checksums, verify downloaded draft assets with the trusted release preflight, then publish. The existing v0.1.0 tag must stay unchanged.

The active marketplace request is [#12313](https://github.com/omacom/omarchy-plugin-marketplace/issues/12313). Update its existing body with [MARKETPLACE-ISSUE.md](MARKETPLACE-ISSUE.md), retaining the owner’s confirmed rights and checklist statements, and identify the exact corrected main SHA and pending live acceptance. Listing approval remains with maintainers.

Known limits: physical multi-monitor/hotplug/fractional scaling and other architectures are unverified. A hard shell crash can leave runtime bindings until shell restart or compositor reload. Fresh installs do not write Hyprland files; migration changes only the exact unmodified legacy module/include, keeping backups and rollback. Config and unrelated files are preserved.
