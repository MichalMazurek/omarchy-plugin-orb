// Only shortcut state belongs in Undo; appearance and activation stay staged.
function snapshot(state) {
    return JSON.parse(JSON.stringify({ actions: state.actions, actionOrigins: state.actionOrigins,
        childOrigins: state.childOrigins, selectedSlot: state.selectedSlot }));
}
function remember(history, state) {
    return history.slice(-39).concat([snapshot(state)]);
}
if (typeof module !== "undefined") module.exports = { snapshot: snapshot, remember: remember };
