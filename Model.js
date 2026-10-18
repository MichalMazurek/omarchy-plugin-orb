// Pure geometry and validation, shared by the hosted QML and Node tests.
var icons = ["browser", "terminal", "files", "screenshot", "themes", "plugins"];
function parse(raw, fallback) {
    var value;
    try { value = JSON.parse(raw); } catch (error) { return { config: fallback, error: "Invalid JSON; using the last valid configuration." }; }
    if (!value || typeof value !== "object" || !Array.isArray(value.actions) || value.actions.length !== 6)
        return { config: fallback, error: "Orbit requires exactly six actions." };
    var actions = [];
    for (var i = 0; i < 6; i++) {
        var a = value.actions[i];
        if (!a || typeof a.label !== "string" || !a.label.trim() || a.label.length > 20 || icons.indexOf(a.icon) < 0
            || !Array.isArray(a.command) || a.command.length < 1 || a.command.length > 32
            || a.command.some(function (s) { return typeof s !== "string" || s.length > 4096 || s.indexOf("\u0000") >= 0; })
            || !a.command[0])
            return { config: fallback, error: "Invalid action " + (i + 1) + "; using the last valid configuration." };
        actions.push({ label: a.label.trim(), icon: a.icon, command: a.command.slice() });
    }
    return { config: { actions: actions, diameter: Math.max(340, Math.min(600, Number(value.diameter) || 440)), animation: value.animation !== false }, error: "" };
}
function hit(x, y, diameter) {
    var dx = x - diameter / 2, dy = y - diameter / 2;
    var r = Math.sqrt(dx * dx + dy * dy) / diameter;
    if (r < 0.18 || r > 0.48) return -1;
    var angle = (Math.atan2(dy, dx) * 180 / Math.PI + 120 + 360) % 360;
    return Math.floor(angle / 60) % 6;
}
function placement(px, py, width, height, reserved, preferred) {
    var r = reserved || [0, 0, 0, 0], pad = 12, footer = 38;
    var left = r[0] + pad, top = r[1] + pad;
    var availableW = Math.max(1, width - r[0] - r[2] - pad * 2);
    var availableH = Math.max(1, height - r[1] - r[3] - pad * 2);
    var size = Math.max(1, Math.min(preferred, availableW, availableH - footer));
    return { size: size,
        x: Math.max(left, Math.min(px - size / 2, left + availableW - size)),
        y: Math.max(top, Math.min(py - size / 2, top + availableH - size - footer)) };
}
if (typeof module !== "undefined") module.exports = { parse: parse, hit: hit, placement: placement };
