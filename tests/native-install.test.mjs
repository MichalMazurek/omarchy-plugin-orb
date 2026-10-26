import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const token='1792450000000-123456789';
const marker='-- Orb shortcut wheel: managed by omarchy-plugin-orb/install';
const legacy=marker+'\no.bind("SUPER + ALT + O", "Orb shortcut wheel", { panel = "io.github.tcballard.orb" })\n';
const example=fs.readFileSync(path.join(root,'config.example.json'),'utf8');
function fixture(fn) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'orb native '));
  try {
    const config=path.join(dir,'config'), bin=path.join(dir,'bin'); fs.mkdirSync(bin);
    fs.writeFileSync(path.join(bin,'hyprctl'),`#!/bin/bash
set -eu
case "$1" in
  binds)
    if [[ -f "$ORB_FIXTURE/applied" ]]; then
      [[ $ORB_MODE != missing ]] || { echo '[]'; exit; }
      cat "$ORB_FIXTURE/registered.json"
    else
      cat "$ORB_FIXTURE/binds.json"
    fi ;;
  eval)
    printf '%s' "$2" > "$ORB_FIXTURE/apply.lua"
    touch "$ORB_FIXTURE/applied"
    [[ $ORB_MODE != eval-error ]] || { echo 'error: fixture Lua failure'; exit; }
    echo ok ;;
  reload)
    if [[ ! -f "$ORB_FIXTURE/reloaded" ]]; then
      touch "$ORB_FIXTURE/reloaded"
      [[ $ORB_MODE != reload ]] || exit 1
    fi ;;
  configerrors)
    if [[ -f "$ORB_FIXTURE/reloaded" ]]; then
      [[ $ORB_MODE != query ]] || exit 1
      [[ $ORB_MODE != configerrors ]] || echo 'Fixture config error'
    fi ;;
  *) exit 2 ;;
esac
`,{mode:0o755});
    fs.writeFileSync(path.join(dir,'binds.json'),'[]');
    const run=(mode='')=>{
      const file=path.join(config,'omarchy/orb.json');
      const value=JSON.parse(fs.existsSync(file)?fs.readFileSync(file,'utf8'):example);
      const parts=(value.shortcut||'SUPER + ALT + O').split('+').map(s=>s.trim().toUpperCase());
      const bits={SUPER:64,ALT:8,CTRL:4,SHIFT:1};
      const binds=[{key:parts.at(-1),modmask:parts.slice(0,-1).reduce((m,p)=>m|(bits[p]||0),0),description:`Orb shortcut wheel [orb:${token}]`}];
      if(value.desktopRightClick)binds.push({key:'mouse:273',modmask:0,description:`Orb on empty desktop [orb:${token}]`});
      if(value.mouseOpen)binds.push({key:`mouse:${value.mouseButton||277}`,modmask:0,description:`Orb mouse button [orb:${token}]`});
      fs.writeFileSync(path.join(dir,'registered.json'),JSON.stringify(binds));
      return spawnSync('bash',[path.join(root,'scripts/setup'),token],{encoding:'utf8',timeout:10000,
        env:{...process.env,PATH:bin+path.delimiter+process.env.PATH,HOME:dir,XDG_CONFIG_HOME:config,ORB_FIXTURE:dir,ORB_MODE:mode}});
    };
    const put=(file,content)=>{const p=path.join(config,file);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,content);return p;};
    fn({dir,config,run,put});
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
}
test('fresh native enable initializes defaults once and writes no Hyprland config',()=>fixture(({config,run})=>{
  let r=run();assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/ready/);
  assert.equal(fs.readFileSync(path.join(config,'omarchy/orb.json'),'utf8'),example);
  assert.equal(fs.statSync(path.join(config,'omarchy/orb.json')).mode&0o777,0o600);
  assert.equal(fs.existsSync(path.join(config,'hypr')),false);
  r=run();assert.equal(r.status,0,r.stderr);
}));
test('repeat enable preserves the released config and all custom metadata',()=>fixture(({config,run,put,dir})=>{
  const original=JSON.parse(example);original.custom={keep:true};original.shortcut='SUPER + CTRL + P';original.desktopRightClick=true;
  const raw=JSON.stringify(original,null,4)+'\n';put('omarchy/orb.json',raw);
  const r=run();assert.equal(r.status,0,r.stderr);
  assert.equal(fs.readFileSync(path.join(config,'omarchy/orb.json'),'utf8'),raw);
  const code=fs.readFileSync(path.join(dir,'apply.lua'),'utf8');assert.match(code,/SUPER \+ CTRL \+ P/);assert.match(code,/auto_consuming = true/);
}));
test('modifier ordering is canonical before retaining an existing key',()=>fixture(({run,put,dir})=>{
  put('omarchy/orb.json',JSON.stringify({...JSON.parse(example),shortcut:'alt + super + ctrl + p'}));
  const r=run();assert.equal(r.status,0,r.stderr);
  const code=fs.readFileSync(path.join(dir,'apply.lua'),'utf8');
  assert.match(code,/SUPER \+ CTRL \+ ALT \+ P/);
  assert.doesNotMatch(code,/ALT \+ SUPER/);
}));
for(const [name,binds] of [
  ['keyboard',[{key:'O',modmask:72,description:'User shortcut'}]],
  ['desktop',[{key:'mouse:273',modmask:0,description:'User right-click'}]]
]) test(`${name} conflict preserves user bindings and refuses registration`,()=>fixture(({dir,run,put})=>{
  put('omarchy/orb.json',JSON.stringify({...JSON.parse(example),desktopRightClick:true}));
  fs.writeFileSync(path.join(dir,'binds.json'),JSON.stringify(binds));
  const r=run();assert.notEqual(r.status,0);assert.match(r.stderr,/already/);assert.equal(fs.existsSync(path.join(dir,'apply.lua')),false);
}));
for(const mode of ['eval-error','missing']) test(`registration ${mode} cannot report success`,()=>fixture(({run})=>{
  const r=run(mode);assert.notEqual(r.status,0);assert.match(r.stderr,/failure|did not complete/);
}));
for(const shortcut of ['SUPER + O; os.execute("false")','SUPER + SUPER + O','ALT + O','SUPER + O + P'])
  test(`unsafe/invalid shortcut ${shortcut} is refused`,()=>fixture(({run,put,dir})=>{
    put('omarchy/orb.json',JSON.stringify({...JSON.parse(example),shortcut}));
    assert.notEqual(run().status,0);assert.equal(fs.existsSync(path.join(dir,'apply.lua')),false);
  }));
for(const mode of ['none','reload','query','configerrors']) for(const hasBindings of [false,true])
  test(`legacy migration ${mode}; existing bindings ${hasBindings}`,()=>fixture(({config,run,put})=>{
    put('hypr/orb.lua',legacy);
    const other='-- user bindings\n';
    if(hasBindings)put('hypr/bindings.lua',other+'require("orb") -- Orb shortcut wheel\n');
    put('hypr/unrelated.lua','-- preserve\n');
    const r=run(mode);
    assert.equal(fs.readFileSync(path.join(config,'hypr/unrelated.lua'),'utf8'),'-- preserve\n');
    if(mode==='none'){
      assert.equal(r.status,0,r.stderr);assert.equal(fs.existsSync(path.join(config,'hypr/orb.lua')),false);
      assert.equal(hasBindings ? fs.readFileSync(path.join(config,'hypr/bindings.lua'),'utf8') : null,hasBindings?other:null);
    }else{
      assert.notEqual(r.status,0);assert.match(r.stderr,/migration failed/);
      assert.equal(fs.readFileSync(path.join(config,'hypr/orb.lua'),'utf8'),legacy);
      assert.equal(fs.existsSync(path.join(config,'hypr/bindings.lua')),hasBindings);
      if(hasBindings)assert.equal(fs.readFileSync(path.join(config,'hypr/bindings.lua'),'utf8'),other+'require("orb") -- Orb shortcut wheel\n');
    }
  }));
test('optional mouse button registers from any place and refuses a conflicting code',()=>fixture(({dir,run,put})=>{
  const base=JSON.parse(example);
  put('omarchy/orb.json',JSON.stringify({...base,mouseOpen:true}));
  let r=run();assert.equal(r.status,0,r.stderr);
  const mouseOnly=fs.readFileSync(path.join(dir,'apply.lua'),'utf8');
  assert.match(mouseOnly,/hl\.bind\("mouse:277"/);assert.match(mouseOnly,/shell toggle io\.github\.tcballard\.orb/);
  assert.doesNotMatch(mouseOnly,/auto_consuming/);assert.match(mouseOnly,/handles\.mouseButton = 277/);
  put('omarchy/orb.json',JSON.stringify({...base,desktopRightClick:true,mouseOpen:true,mouseButton:275}));
  r=run();assert.equal(r.status,0,r.stderr);
  const both=fs.readFileSync(path.join(dir,'apply.lua'),'utf8');
  assert.match(both,/hl\.bind\("mouse:275"/);assert.match(both,/handles\[3\]/);assert.match(both,/auto_consuming = true/);
  put('omarchy/orb.json',JSON.stringify({...base,desktopRightClick:true,mouseOpen:true,mouseButton:276}));
  r=run();assert.equal(r.status,0,r.stderr);
  const changed=fs.readFileSync(path.join(dir,'apply.lua'),'utf8');
  fs.rmSync(path.join(dir,'applied'),{force:true});
  put('omarchy/orb.json',JSON.stringify({...base,desktopRightClick:true,mouseOpen:true,mouseButton:273}));
  r=run();assert.notEqual(r.status,0);assert.match(r.stderr,/273/);
  put('omarchy/orb.json',JSON.stringify({...base,mouseOpen:true,mouseButton:280}));
  r=run();assert.notEqual(r.status,0);assert.match(r.stderr,/272/);
  fs.rmSync(path.join(dir,'applied'),{force:true});
  fs.writeFileSync(path.join(dir,'binds.json'),JSON.stringify([{key:'mouse:277',modmask:0,description:'User mouse'}]));
  put('omarchy/orb.json',JSON.stringify({...base,mouseOpen:true,mouseButton:277}));
  r=run();assert.notEqual(r.status,0);assert.match(r.stderr,/already/);assert.equal(fs.existsSync(path.join(dir,'applied')),false);
  fs.writeFileSync(path.join(dir,'binds.json'),JSON.stringify([{key:'mouse:277',modmask:64,description:'User chord'}]));
  r=run();assert.notEqual(r.status,0);assert.match(r.stderr,/already/);
  fs.writeFileSync(path.join(dir,'binds.json'),'[]');
  put('omarchy/orb.json',JSON.stringify({...base,mouseOpen:true,mouseButton:'275'}));
  r=run();assert.equal(r.status,0,r.stderr);
  assert.match(fs.readFileSync(path.join(dir,'apply.lua'),'utf8'),/hl\.bind\("mouse:275"/);
  fs.rmSync(path.join(dir,'applied'),{force:true});
  fs.writeFileSync(path.join(dir,'binds.json'),JSON.stringify([{key:'O',modmask:72,description:`Orb shortcut wheel [orb:${token}]`},{key:'mouse:273',modmask:0,description:`Orb on empty desktop [orb:${token}]`}]));
  put('omarchy/orb.json',JSON.stringify({...base,desktopRightClick:false,mouseOpen:true,mouseButton:273}));
  r=run();assert.equal(r.status,0,r.stderr);
  assert.match(fs.readFileSync(path.join(dir,'apply.lua'),'utf8'),/hl\.bind\("mouse:273"/);
  fs.rmSync(path.join(dir,'applied'),{force:true});
  fs.writeFileSync(path.join(dir,'binds.json'),JSON.stringify([{key:'O',modmask:72,description:`Orb shortcut wheel [orb:${token}]`},{key:'mouse:273',modmask:0,description:`Orb mouse button [orb:${token}]`}]));
  put('omarchy/orb.json',JSON.stringify({...base,desktopRightClick:true,mouseOpen:false}));
  r=run();assert.equal(r.status,0,r.stderr);
  assert.match(fs.readFileSync(path.join(dir,'apply.lua'),'utf8'),/auto_consuming = true/);
  const interpreter=['lua','lua5.4','texlua'].find(cmd=>spawnSync('which',[cmd]).status===0);
  assert.ok(interpreter,'Lua interpreter required for lifecycle tests (lua5.4 or texlua)');
  const script=path.join(dir,'mouse.lua');
  fs.writeFileSync(script,`local registered = {}; local count = 0
hl = { bind = function(key, cb, opts)
  local bind = { key = key, callback = cb, description = opts.description, removed = false }
  function bind:remove() for _, other in ipairs(registered) do if other.key == self.key then other.removed = true end end end
  table.insert(registered, bind); return bind
end, exec_cmd = function() count = count + 1 end }
local function evaluate(code) assert(load(code))() end
local function live() local n=0; for _, b in ipairs(registered) do if not b.removed then n=n+1 end end; return n end
local function keys() local found={}; for _, b in ipairs(registered) do if not b.removed then found[b.key]=(found[b.key] or 0)+1 end end; return found end
evaluate(${JSON.stringify(mouseOnly)}); assert(live()==2)
local found=false
for _, b in ipairs(registered) do if b.key=="mouse:277" and not b.removed then b.callback(); found=true end end
assert(found and count==1)
evaluate(${JSON.stringify(both)}); assert(live()==3)
evaluate(${JSON.stringify(changed)}); assert(live()==3); assert(keys()["mouse:276"]==1 and not keys()["mouse:275"] and keys()["mouse:273"]==1)
evaluate(${JSON.stringify(mouseOnly)}); assert(live()==2); assert(keys()["mouse:277"]==1 and not keys()["mouse:273"] and not keys()["mouse:276"])
print('PASS: mouse button binding')
`);
  const lua=spawnSync(interpreter,[script],{encoding:'utf8'});assert.equal(lua.status,0,lua.stdout+lua.stderr);
}));
test('invalid mouse text does not register, and turning the button off removes it',()=>fixture(({dir,run,put})=>{
  const base=JSON.parse(example);
  fs.writeFileSync(path.join(dir,'binds.json'),'[]');
  put('omarchy/orb.json',JSON.stringify({...base,mouseOpen:true,mouseButton:'abc'}));
  let r=run();assert.notEqual(r.status,0);assert.match(r.stderr,/272/);assert.equal(fs.existsSync(path.join(dir,'apply.lua')),false);
  put('omarchy/orb.json',JSON.stringify({...base,mouseOpen:true,mouseButton:275}));
  r=run();assert.equal(r.status,0,r.stderr);
  const on=fs.readFileSync(path.join(dir,'apply.lua'),'utf8');
  assert.match(on,/hl\.bind\("mouse:275"/);
  put('omarchy/orb.json',JSON.stringify({...base,mouseOpen:false,mouseButton:275}));
  r=run();assert.equal(r.status,0,r.stderr);
  const off=fs.readFileSync(path.join(dir,'apply.lua'),'utf8');
  assert.doesNotMatch(off,/hl\.bind\("mouse:/);
  put('omarchy/orb.json',JSON.stringify({...base,desktopRightClick:true,mouseOpen:true,mouseButton:275}));
  r=run();assert.equal(r.status,0,r.stderr);
  const both=fs.readFileSync(path.join(dir,'apply.lua'),'utf8');
  put('omarchy/orb.json',JSON.stringify({...base,desktopRightClick:false,mouseOpen:true,mouseButton:275}));
  r=run();assert.equal(r.status,0,r.stderr);
  const kept=fs.readFileSync(path.join(dir,'apply.lua'),'utf8');
  const interpreter=['lua','lua5.4','texlua'].find(cmd=>spawnSync('which',[cmd]).status===0);
  assert.ok(interpreter,'Lua interpreter required for lifecycle tests (lua5.4 or texlua)');
  const script=path.join(dir,'mouse-off.lua');
  fs.writeFileSync(script,`local registered = {}
hl = { bind = function(key, cb, opts)
  local bind = { key = key, removed = false }
  function bind:remove() for _, other in ipairs(registered) do if other.key == self.key then other.removed = true end end end
  table.insert(registered, bind); return bind
end, exec_cmd = function() end }
local function evaluate(code) assert(load(code))() end
local function live() local n=0; for _, b in ipairs(registered) do if not b.removed then n=n+1 end end; return n end
local function keys() local found={}; for _, b in ipairs(registered) do if not b.removed then found[b.key]=true end end; return found end
evaluate(${JSON.stringify(on)}); assert(live()==2); assert(keys()["mouse:275"])
evaluate(${JSON.stringify(off)}); assert(live()==1); assert(not keys()["mouse:275"])
registered = {}; __orb_native_bindings = nil
evaluate(${JSON.stringify(both)})
local old; for _, b in ipairs(registered) do if b.key=="mouse:275" and not b.removed then old=b end end
evaluate(${JSON.stringify(kept)}); assert(old and not old.removed); assert(live()==2); assert(keys()["mouse:275"]); assert(not keys()["mouse:273"])
print('PASS: mouse button off and retain')
`);
  const lua=spawnSync(interpreter,[script],{encoding:'utf8'});assert.equal(lua.status,0,lua.stdout+lua.stderr);
}));
test('modified legacy module is retained without changing unrelated files',()=>fixture(({run,put,config})=>{
  const modified=legacy+'-- my changes\n';put('hypr/orb.lua',modified);put('hypr/bindings.lua','require("orb") -- Orb shortcut wheel\n');
  const r=run();assert.notEqual(r.status,0);assert.match(r.stderr,/Modified legacy/);
  assert.equal(fs.readFileSync(path.join(config,'hypr/orb.lua'),'utf8'),modified);
}));
test('Lua lifecycle removes only owned handles, survives reload and rejects late applies',()=>fixture(({run,dir,put})=>{
  put('omarchy/orb.json',JSON.stringify({...JSON.parse(example),desktopRightClick:true}));
  assert.equal(run().status,0);
  const apply=fs.readFileSync(path.join(dir,'apply.lua'),'utf8');
  put('omarchy/orb.json',JSON.stringify({...JSON.parse(example),desktopRightClick:false}));
  assert.equal(run().status,0);
  const keyboardOnly=fs.readFileSync(path.join(dir,'apply.lua'),'utf8');
  const context=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'BindingLifecycle.js'),'utf8'),context);
  const cleanup=context.cleanup(token), newer='1792450000001-123456789';
  const lua=`local registered = {}; local count = 0
hl = { bind = function(key, cb, opts)
  local bind = { key = key, callback = cb, description = opts.description, removed = false }
  function bind:remove() for _, other in ipairs(registered) do if other.key == self.key then other.removed = true end end end
  table.insert(registered, bind); return bind
end, exec_cmd = function() count = count + 1 end }
local function evaluate(code) assert(load(code))() end
local function live() local n=0; for _, b in ipairs(registered) do if not b.removed then n=n+1 end end; return n end
local apply = ${JSON.stringify(apply)}
local cleanup = ${JSON.stringify(cleanup)}
evaluate(apply); assert(live() == 2); registered[1].callback(); assert(count == 1)
evaluate(apply); assert(live() == 2) -- repeated config file event
evaluate(${JSON.stringify(apply.replaceAll('SUPER + ALT + O','SUPER + ALT + P'))}); assert(live() == 2) -- replace key, retain desktop handle
evaluate(apply); assert(live() == 2) -- restore key, still retain desktop handle
evaluate(${JSON.stringify(keyboardOnly)}); assert(live() == 1) -- retain keyboard handle while disabling desktop
local originalBind = hl.bind
hl.bind = function(key, cb, opts) if key == "mouse:273" then return nil end; return originalBind(key, cb, opts) end
assert(not pcall(evaluate, apply)); assert(live() == 1) -- partial failure keeps the prior working keyboard
hl.bind = originalBind
evaluate(apply); assert(live() == 2)
evaluate(${JSON.stringify(apply.replaceAll(token,newer))}); assert(live() == 2)
evaluate(cleanup); assert(live() == 2) -- late old unload cannot delete new handles
evaluate(apply); assert(live() == 2) -- late old apply is tombstoned
for _, b in ipairs(registered) do b.removed = true end; __orb_native_bindings = nil
evaluate(apply); assert(live() == 2) -- compositor reload clears Lua state/binds
evaluate(cleanup); assert(live() == 0)
evaluate(apply); assert(live() == 0) -- destroyed menu cannot register later
print('PASS: native binding lifecycle')
`;
  const script=path.join(dir,'lifecycle.lua');fs.writeFileSync(script,lua);
  const interpreter=['lua','lua5.4','texlua'].find(cmd=>spawnSync('which',[cmd]).status===0);
  assert.ok(interpreter,'Lua interpreter required for lifecycle tests (lua5.4 or texlua)');
  const r=spawnSync(interpreter,[script],{encoding:'utf8'});assert.equal(r.status,0,r.stdout+r.stderr);
}));
