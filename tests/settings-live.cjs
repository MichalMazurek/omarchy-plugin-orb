// Explicit real-desktop acceptance for Orb's settings panel; no video or editor launch.
const {execFileSync:exec}=require('node:child_process');
const fs=require('node:fs');const assert=require('node:assert/strict');const path=require('node:path');
const repo=path.resolve(__dirname,'..');
const run=(c,...a)=>exec(c,a.map(String),{encoding:'utf8',timeout:15000}).trim();
const json=(c,...a)=>JSON.parse(run(c,...a));const ipc=(...a)=>run('omarchy-shell',...a);
const id='io.github.tcballard.orb', status=()=>JSON.parse(ipc(id,'status'));
const key=k=>run('wtype','-s','60','-k',k,'-s','60');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(f,message){for(let n=0;n<90;n++){const value=f();if(value)return value;await sleep(80);}throw Error(message||'Timed out');}
const saved={pointer:json('hyprctl','cursorpos','-j'),focus:json('hyprctl','activewindow','-j').address};
const monitor=json('hyprctl','monitors','-j').find(m=>m.focused);assert.equal(monitor.scale,1);
const move=(x,y,b=0)=>run(repo+'/artifacts/input/pointer',Math.round(x),Math.round(y),monitor.width,monitor.height,b);
const config=process.env.HOME+'/.config/omarchy/orb.json';const originalText=fs.readFileSync(config,'utf8');const original=JSON.parse(originalText);
const beforeWindows=json('hyprctl','clients','-j').map(w=>w.address);let expectedSaved=null;
const report=[];const pass=name=>{report.push(name);console.log('PASS:',name);};
async function openSettings(x=960,y=560){move(x,y);ipc('shell','summon',id,'{}');await until(()=>status().opened&&status().opacity===1);await sleep(180);let s=status();move(s.x+s.diameter/2,s.y+s.diameter/2,272);await until(()=>status().settingsOpen,'Centre failed to open panel');await sleep(100);return status();}
function capture(s){run('grim','-g',`${Math.floor(s.settingsX-8)},${Math.floor(s.settingsY-8)} ${Math.ceil(s.settingsWidth+16)}x${Math.ceil(s.settingsHeight+16)}`,repo+'/artifacts/orb-settings-panel.png');}
(async()=>{try{
let s=await openSettings();capture(s);assert.equal(s.draftDiameter,original.diameter);
key('Right');key('Tab');key('space');key('Escape');assert.equal(status().settingsOpen,false);assert.equal(status().opened,true);assert.equal(fs.readFileSync(config,'utf8'),originalText);key('Escape');
pass('Centre opens native panel; Cancel/Escape discards size and animation drafts');
s=await openSettings();const delta=original.diameter>=600?-10:10;key(delta>0?'Right':'Left');key('Tab');key('space');
assert.equal(status().draftDiameter,original.diameter+delta);assert.equal(status().draftAnimation,!original.animation);
expectedSaved={...original,diameter:original.diameter+delta,animation:!original.animation};
key('Tab');key('Tab');key('Return');
await until(()=>!status().settingsOpen&&!status().settingsSaving,'Save did not return to wheel: '+JSON.stringify(status()));
assert.deepEqual(JSON.parse(fs.readFileSync(config,'utf8')),expectedSaved);key('Escape');
s=await openSettings();assert.equal(s.draftDiameter,expectedSaved.diameter);assert.equal(s.draftAnimation,expectedSaved.animation);
pass('Save persists settings; reopening loads them; actions, shortcut and other fields preserved');
key(delta>0?'Left':'Right');key('Tab');key('space');key('Tab');key('Tab');key('Return');
await until(()=>!status().settingsOpen&&!status().settingsSaving,'Restoration save failed');assert.deepEqual(JSON.parse(fs.readFileSync(config,'utf8')),original);expectedSaved=null;key('Escape');
pass('Original size and animation restored through the panel');
for(const [x,y] of [[1,31],[1918,31],[1,1198],[1918,1198]]){s=await openSettings(x,y);assert.ok(s.settingsX>=12&&s.settingsY>=42);assert.ok(s.settingsX+s.settingsWidth<=1908&&s.settingsY+s.settingsHeight<=1188);move(960,600,272);await until(()=>!status().opened);}
pass('Panel stays within all four screen edges; outside click dismisses');
const newEditors=json('hyprctl','clients','-j').filter(w=>!beforeWindows.includes(w.address)&&(w.class==='org.omarchy.nvim'||/orb\.json/.test(w.title||'')));
assert.deepEqual(newEditors,[]);
pass('No configuration editor window opened');
}finally{
ipc('shell','hide',id);
if(expectedSaved&&JSON.stringify(JSON.parse(fs.readFileSync(config,'utf8')))===JSON.stringify(expectedSaved))fs.writeFileSync(config,originalText);
if(saved.focus)run('hyprctl','dispatch',`hl.dsp.focus({window="address:${saved.focus}"})`);move(saved.pointer.x,saved.pointer.y);
fs.writeFileSync(repo+'/artifacts/settings-live-results.json',JSON.stringify({date:new Date().toISOString(),report},null,2));
}})().catch(e=>{console.error(e);process.exitCode=1;});
