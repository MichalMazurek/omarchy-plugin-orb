// Pure geometry and validation, shared by the hosted QML and Node tests.
var icons = ["browser", "terminal", "files", "screenshot", "themes", "plugins", "agents", "settings", "codex", "claude", "grok", "postcard", "app", "create"];
function action(a, depth) {
    if (!a || typeof a.label !== "string" || !a.label.trim() || a.label.length > 20 || icons.indexOf(a.icon) < 0) return null;
    var out = { label: a.label.trim(), icon: a.icon };
    if (a.desktopId !== undefined) {
        if (typeof a.desktopId !== "string" || !/^[A-Za-z0-9_.@+-]{1,255}$/.test(a.desktopId) || a.command || a.menu || a.children) return null;
        out.desktopId = a.desktopId; return out;
    }
    if (a.menu === "agents" && depth === 0 && !a.command && !a.children) { out.menu = "agents"; return out; }
    if (Array.isArray(a.children) && depth === 0 && !a.command && !a.menu && a.children.length > 0 && a.children.length <= 12) {
        out.children = a.children.map(function(c) { return action(c, 1); });
        return out.children.every(function(c) { return c !== null; }) ? out : null;
    }
    if (a.children || a.menu || !Array.isArray(a.command) || a.command.length < 1 || a.command.length > 32
        || a.command.some(function(s) { return typeof s !== "string" || s.length > 4096 || s.indexOf("\u0000") >= 0; }) || !a.command[0]) return null;
    out.command = a.command.slice(); return out;
}
// Merge only edited fields/slots into the latest document. Preserve custom fields
// and concurrent edits elsewhere; refuse to overwrite a conflicting slot.
function mergeSettings(document, original, draft) {
    var result = JSON.parse(JSON.stringify(document));
    var current = parse(JSON.stringify(document), null);
    if (current.error) return { error: current.error };
    if (draft.actions.length !== original.actions.length) {
        if (JSON.stringify(current.config.actions) !== JSON.stringify(original.actions))
            return { error: "Slots changed elsewhere. Reopen settings before adding or removing slots." };
        var used = [];
        result.actions = draft.actions.map(function(a) {
            for (var index = 0; index < original.actions.length; index++) {
                if (!used[index] && JSON.stringify(a) === JSON.stringify(original.actions[index])) {
                    used[index] = true; return document.actions[index];
                }
            }
            return a;
        });
    } else for (var i = 0; i < original.actions.length; i++) {
        if (JSON.stringify(original.actions[i]) === JSON.stringify(draft.actions[i])) continue;
        if (current.config.actions.length !== original.actions.length)
            return { error: "Slots changed elsewhere. Reopen settings to load them." };
        if (JSON.stringify(current.config.actions[i]) !== JSON.stringify(original.actions[i]) && JSON.stringify(current.config.actions[i]) !== JSON.stringify(draft.actions[i]))
            return { error: "Slot " + (i + 1) + " changed elsewhere. Reopen settings to load it." };
        result.actions[i] = draft.actions[i];
    }
    ["diameter", "animation"].forEach(function(key) { if (original[key] !== draft[key]) result[key] = draft[key]; });
    var checked = parse(JSON.stringify(result), null);
    return checked.error ? { error: checked.error } : { document: result, error: "" };
}
function parse(raw, fallback) {
    var value;
    try { value = JSON.parse(raw); } catch (error) { return { config: fallback, error: "Invalid JSON; using the last valid configuration." }; }
    if (!value || typeof value !== "object" || !Array.isArray(value.actions) || value.actions.length < 6 || value.actions.length > 8)
        return { config: fallback, error: "Orb supports six to eight top-level actions." };
    var actions = [];
    for (var i = 0; i < value.actions.length; i++) {
        var a = action(value.actions[i], 0);
        if (!a)
            return { config: fallback, error: "Invalid action " + (i + 1) + "; using the last valid configuration." };
        actions.push(a);
    }
    return { config: { actions: actions, diameter: Math.max(220, Math.min(600, Number(value.diameter) || 240)), animation: value.animation !== false }, error: "" };
}
function hit(x, y, diameter, count) {
    if (count === undefined) count = 6;
    if (count < 1) return -1;
    var dx = x - diameter / 2, dy = y - diameter / 2;
    var r = Math.sqrt(dx * dx + dy * dy) / diameter;
    if (r < 0.18 || r > 0.48) return -1;
    var step = 360 / count;
    var angle = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + step / 2 + 360) % 360;
    return Math.floor(angle / step) % count;
}
function placement(px, py, width, height, reserved, preferred) {
    var r = reserved || [0, 0, 0, 0], pad = 12, footer = 38;
    var left = r[0] + pad, top = r[1] + pad;
    var availableW = Math.max(1, width - r[0] - r[2] - pad * 2);
    var availableH = Math.max(1, height - r[1] - r[3] - pad * 2);
    var size = Math.max(1, Math.min(preferred, availableW, availableH - footer));
    if (size > 280) size = Math.min(size, availableH / (1 + footer / 280));
    var captionScale = Math.max(1, size / 280);
    footer *= captionScale;
    return { size: size, captionScale: captionScale, footer: footer,
        x: Math.max(left, Math.min(px - size / 2, left + availableW - size)),
        y: Math.max(top, Math.min(py - size / 2, top + availableH - size - footer)) };
}
if (typeof module !== "undefined") module.exports = { parse: parse, hit: hit, placement: placement, mergeSettings: mergeSettings };
