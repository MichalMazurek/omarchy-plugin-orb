# Real desktop demo

Recording is on hold at the user’s request while the visual design is being refined. The recording harness predates the compact-menu revision; recheck it before a future recording.

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

1. “Orb is running inside Quattro on the XPS: six default slots, expandable to eight, with native icons and action names below the wheel.”
2. “Pointer and keyboard selection, circular agent menus, cancellation and focus restoration are working. The caption now scales with Orb, with live checks at 280, 467 and 700px.”
3. “The working feature branch is on GitHub. Preparing v0.1.0 with release notes, source checksums and a real desktop preview; final lifecycle acceptance and tagging are still ahead.”

Nothing is posted automatically.
