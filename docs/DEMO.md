# Real desktop demo

On an empty workspace, move the pointer near the centre, press Super+Alt+O, hover Browser → Terminal → Files, and click Terminal. Summon again and press Escape. One real launch plus cancellation makes a useful 15-second clip.

```bash
omarchy screenrecord --status
omarchy screenrecord --fullscreen
# Demonstrate the wheel.
omarchy screenrecord --stop-recording
```

The stop command prints the path. No audio is requested. Do not interrupt an existing recording. Set OMARCHY_SCREENRECORD_DIR when starting to choose an output directory.

`demo/record.cjs` automates a real pointer demonstration after the native test pointer is built. It uses an empty workspace, clicks Terminal, cancels another summon and restores the user's workspace/pointer/focus. Recordings remain under ignored artifacts until reviewed.

X-thread drafts, based on observed prototype behaviour:

1. “Orb is running inside Quattro on the XPS: six labelled, themed sectors and an original radial design.”
2. “All six launchers passed on the real desktop. Pointer clicks, keyboard selection, repeated opening, cancellation, screen edges and focus restoration work.”
3. “The prototype installs from a Git checkout with one command. Theme colours update live. No helper daemon, Python, nested menus or visual editor.”

Nothing is posted automatically.
