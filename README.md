<h1 align="center">Orb</h1>

<p align="center">Six everyday shortcuts, one pointer-centred wheel.</p>

<p align="center"><a href="https://github.com/tcballard/omarchy-badges"><img alt="Built for Omarchy: Plugin" height="20" src="https://raw.githubusercontent.com/tcballard/omarchy-badges/75975e5b5bf75e7ede3764bcd2950046f7abfe2c/badges/v1/omarchy-plugin.svg"></a></p>

**Interaction inspiration: Tangerine for Mac.** Orb is an original implementation for Omarchy, with original QML and general-purpose icons; it contains no Tangerine code or assets. Built from Tom Ballard's Omarchy plugin starter and [Build Omarchy Plugins](https://github.com/tcballard/build-omarchy-plugins). [Credits](CREDITS.md).

Press **Super+Alt+O**, hover an action, and click. The compact wheel defaults to Browser, Terminal, Files and Screenshot, and every slot can be changed in its settings panel. **Settings → Themes / Plugins** and **Agents → installed clients** open circular submenus in the same wheel. Launches use existing Omarchy terminal and application launchers. Orb runs inside Quattro's existing shell, with its active colours, font sizing and reduced-motion setting.

## Install the prototype

From this checkout, one command:

```bash
./install
```

Or clone the feature branch first:

```bash
git clone --branch feature/shortcut-wheel https://github.com/tcballard/omarchy-plugin-orb.git && cd omarchy-plugin-orb && ./install
```

The installer uses `omarchy plugin add "$PWD" --enable --yes`, a normal Git-based plugin installation. It checks live keybindings before adding the shortcut, backs up the affected Lua files, and preserves unrelated settings. No sudo or package installation. Quattro’s rescan can retain cached QML on this development build; if an update still shows the old UI, run `omarchy restart shell` (the bar briefly reloads). The installed checkout tracks this local source repository; commit changes and rerun `./install` to update it. Main remains the starter until this branch is merged. The feature branch is currently local and has not been pushed; the remote clone command becomes available after pushing.

Requires current Quattro with `qs.Ui.OverlayWindow` and `PointerMoveGate`, the normal Omarchy launchers, Bash, Git, jq and libnotify. Node and a compiler are only development dependencies.

## Use and configure

- Optional **right-click on empty desktop** also opens Orb. This is enabled on this XPS; applications retain their context menus. Super+Alt+O remains available.
- Hover a sector and left-click to launch. The centre logo glows on hover; click it to open Orb’s compact settings panel. In a submenu, the centre goes back.
- Arrow keys or Tab/Shift+Tab cycle; 1–6 select; Enter launches. Home selects the centre button; Enter opens Orb settings (or goes back in a submenu). In settings, use **Slots** to choose each position’s shortcut or installed app; search for **Postcard** to use its editor. **Appearance** controls wheel size and opening animation. Press Save to apply; Cancel/Escape discards changes. Tab moves between controls, arrows adjust size or browse search results, Enter chooses, and Ctrl+S saves. Escape in search returns to the slot list.
- Escape/Left/Backspace or the centre button returns from a submenu. Escape on the wheel, outside click, or the summon shortcut again dismisses.
- The wheel and keyboard hint stay clear of monitor edges and reserved bar space.
- Submenus with more than six actions use footer arrows, scrolling or Page Up/Down.
- Opening animates for 190ms; system reduced motion is respected.

For advanced custom commands, edit `~/.config/omarchy/orb.json` for six top-level labels, icons, command argument arrays, one-level `children` menus, an installed-agent menu (`"menu": "agents"`), diameter, animation and shortcut. The default diameter is 240 theme units, currently 280px on the XPS. See [the example](config.example.json). The picker offers the standard shortcuts, Settings and Agents circular menus, Themes, Plugins, Postcard (requires the Postcard plugin), and installed applications from Quattro’s app library. App choices store a `desktopId` and launch through that same library; icons follow the installed application. Commands run without shell-string evaluation. Set `"desktopRightClick": true` to enable desktop-only right-click (then rerun `./install`). It uses Hyprland’s auto-consuming binding: app, panel and widget clicks pass through. Desktop right-click now opens Orb in place of the wallpaper’s right-double-click theme gesture; Themes remains available as a slot choice. Conservative panel bounds, including the dock’s transparent area, are excluded. Other changes load live; **rerun `./install` after changing the shortcut**. Invalid configuration retains the last valid actions and shows an error hint.

```bash
omarchy-shell shell toggle io.github.tcballard.orb
omarchy-shell shell hide io.github.tcballard.orb
omarchy-shell io.github.tcballard.orb status
```

Remove from the source checkout with `./uninstall`. It removes this plugin and its shortcut, preserving `orb.json` and source. Removing through Omarchy alone leaves the separately installed shortcut; use the script for complete removal.

## Verification and limits

Developed on a Dell XPS 9320, 1920×1200 at scale 1, Omarchy dev `5f7aaeb8c`. [Acceptance evidence](docs/ACCEPTANCE.json) separates portable checks from direct desktop tests. [Development](docs/DEVELOPMENT.md) · [Architecture](ARCHITECTURE.md) · [Demo and recording](docs/DEMO.md).

Six configurable top-level entries with one submenu level. The panel does not yet edit custom command arguments, submenu contents or the summon shortcut. Agent discovery filters out first-run installer wrappers, requires a real installed executable, and does not alter the default agent. Multiple physical monitors, hotplug and fractional scaling need further live testing. Screenshot verification covers opening and cancelling the capture UI, not saving a capture. Theme verification uses real shell palette-change IPC and restores it; full desktop/app retinting is not exercised. Physical shortcut presses need a human check; automation uses the registered dispatcher and real Wayland input.

Codex, Claude and Grok use the product marks bundled with Omarchy’s agents panel, with contrasting variants for light and dark themes. [Asset provenance](CREDITS.md#agent-marks).

No release or marketplace listing has been published.

## Licence

[MIT](LICENSE). Third-party software and media retain their own licences.
