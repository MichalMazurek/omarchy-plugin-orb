Orb v0.2.0 makes the wheel easier to set up and personalise.

- Arrange five to eight shortcuts with a draggable wheel preview, searchable app picker and keyboard controls.
- Choose Circle or Polygon; five shortcuts make a pentagon, while the centre stays circular.
- Open Files into its own wheel of Home, Recent, Starred, Downloads and other standard folders.
- Create custom commands and submenus, and change the opening shortcut and desktop right-click in Settings.
- Choose Small, Medium or Large, or fine-tune the size. Settings stays centred and keeps its opening frame.
- Undo shortcut edits without losing Appearance or Opening drafts. The Settings header shows the installed version.
- Load on the Omarchy 4.0.6 shell without its newer overlay/animation helpers; retain the app catalog when that shell omits its app-library service.

Existing layouts and custom metadata are retained. Changes remain drafts until Save; Cancel leaves the saved configuration alone.

Install or update through Omarchy:

```bash
omarchy plugin add https://github.com/tcballard/omarchy-plugin-orb.git --enable
omarchy plugin update io.github.tcballard.orb
```

These commands track `main`. This feature branch is a release candidate until merged and released. See [the acceptance record](ACCEPTANCE.json) for the exact tested source, packages and limits. Physical multi-monitor, hotplug, fractional scaling and the complete historical 4.0.6 OS package set remain unverified.
