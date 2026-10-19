# Credits and provenance

**Interaction inspiration: Tangerine for Mac**, as specified by the user. Orb's QML implementation and general-purpose line icons are original; the agent marks below are third-party branding. No Tangerine code, artwork or branding is included.

Template authorship: Tom Ballard, 2026, MIT. Project author: Tom Ballard.
- Plugin conventions: [Build Omarchy Plugins](https://github.com/tcballard/build-omarchy-plugins).
- Community badge: [omarchy-badges](https://github.com/tcballard/omarchy-badges), pinned to 75975e5b5bf75e7ede3764bcd2950046f7abfe2c.
- Test-only virtual pointer protocol: copyright 2019 Josef Gajdusek, MIT. Full licence remains in tests/virtual-pointer.xml. [Upstream protocol](https://gitlab.freedesktop.org/wlroots/wlr-protocols/-/blob/master/unstable/wlr-virtual-pointer-unstable-v1.xml).

`preview.png` is a real cropped XPS desktop capture of Orb, including a small portion of the user's active wallpaper. It is a product screenshot, not a separately distributed wallpaper asset. Other local test captures remain under ignored `artifacts/` and are not published with the source.

## Agent marks

The unmodified SVG files in `assets/agents/` are copied from Omarchy’s agents panel at [27d215832cfb74d252d4cfed8519f645c76d8d9c](https://github.com/tcballard/omarchy/tree/27d215832cfb74d252d4cfed8519f645c76d8d9c/shell/plugins/agents/assets). The upstream MIT notice is retained in `assets/agents/LICENSE.omarchy`.

- Codex mark: OpenAI; white and dark variants. [Brand information](https://openai.com/brand/).
- Claude mark: Anthropic; original orange colour. [Claude](https://claude.com/).
- Grok mark: xAI; white and dark variants. [Brand information](https://x.ai/legal/brand-guidelines).

These marks identify the corresponding installed agent clients. They remain their owners’ trademarks and do not imply endorsement. They are not original Orb artwork. No assets are fetched at runtime.

## Omarchy centre mark

`assets/omarchy-logo.svg` is the unmodified official SVG downloaded from [Omarchy’s brand assets](https://omarchy.org/brand/omarchy-logo.svg) on 2026-10-18. The wheel renders it in the active menu text colour using Quattro’s existing Qt Quick colourization pattern. Omarchy branding belongs to its respective owners; its use identifies the desktop integration and does not imply endorsement.

## Make something cool

The three theme/plugin/app starter prompts are reused from [Omarchy’s Agents panel](https://github.com/tcballard/omarchy/blob/301ea47016e28df527825cbd417e084fdd612405/shell/plugins/agents/Panel.qml), as installed locally when implemented. Omarchy’s MIT notice is retained in [assets/agents/LICENSE.omarchy](assets/agents/LICENSE.omarchy). Orb supplies its own circular presentation and calls the native `omarchy agent prompt` launcher.
