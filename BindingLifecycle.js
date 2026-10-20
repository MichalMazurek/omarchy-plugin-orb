// Pure lifecycle code: cleanup carries no dependency on a checkout that Remove deletes.
function cleanup(token) {
    if (!/^[0-9]+-[0-9]+$/.test(token)) throw new Error("Invalid binding owner");
    return 'local r = rawget(_G, "__orb_native_bindings"); if not r then r = { dead = {} }; _G.__orb_native_bindings = r end; '
        + 'r.dead["' + token + '"] = true; local owner = r["' + token + '"]; '
        + 'if owner then for _, bind in ipairs(owner) do pcall(function() bind:remove() end) end; r["' + token + '"] = nil end';
}
