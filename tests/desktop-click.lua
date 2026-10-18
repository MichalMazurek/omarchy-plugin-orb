local callback, flags, launches
local windows, layers, point = {}, {}, {x=900,y=500}
hl = {
  bind = function(key, cb, opts) assert(key == "mouse:273"); callback=cb; flags=opts end,
  get_cursor_pos = function() return point end,
  get_monitor_at_cursor = function() return {name="eDP-1"} end,
  get_windows = function() return windows end,
  get_layers = function() return layers end,
  exec_cmd = function(cmd) assert(cmd == "omarchy-shell shell summon io.github.tcballard.orb '{}'"); launches = launches + 1 end
}
dofile("desktop-click.lua")
assert(flags.auto_consuming and not flags.locked and not flags.ignore_mods)
launches=0
local wallpaper={mapped=true,layer=0,namespace="omarchy-background",x=0,y=0,w=1920,h=1200}
layers={wallpaper}; assert(callback().ok); assert(launches==1)
windows={{visible=true,hidden=false,at={x=800,y=400},size={x=300,y=300}}}
assert(not callback().ok); assert(launches==1)
windows[1].visible=false; assert(callback().ok)
windows={}; layers={wallpaper,{mapped=true,layer=2,namespace="omarchy-bar",x=0,y=0,w=1920,h=30}}
point={x=900,y=15}; assert(not callback().ok)
point={x=900,y=500}; layers={wallpaper,{mapped=true,layer=3,namespace="popup",x=0,y=0,w=1920,h=1200}}
assert(not callback().ok)
layers={}; assert(not callback().ok)
layers={wallpaper}; windows={{visible=true,at={},size={}}}; assert(not callback().ok)
print('PASS: desktop-only right-click; app/layer clicks pass through; unknown geometry fails closed')
