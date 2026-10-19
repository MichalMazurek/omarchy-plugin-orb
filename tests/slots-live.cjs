// Real XPS slot-picker acceptance. --apply-postcard keeps only that requested change.
const {execFileSync:exec}=require('node:child_process');
const fs=require('node:fs'), assert=require('node:assert/strict'), path=require('node:path');
const repo=path.resolve(__dirname,'..'), id='io.github.tcballard.orb';
const run=(c,...a)=>exec(c,a.map(String),{encoding:'utf8',timeout:15000}).trim();
const json=(c,...a)=>JSON.parse(run(c,...a)); const ipc=(...a)=>run('omarchy-shell',...a);
const status=()=>JSON.parse(ipc(id,'status')), key=k=>run('wtype','-s','70','-k',k,'-s','70');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(f,message){for(let i=0;i<80;i++){const v=f();if(v)return v;await sleep(100);}throw Error(message||'Timed out');}
const saved={pointer:json('hyprctl','cursorpos','-j'),focus:json('hyprctl','activewindow','-j').address};
const monitor=json('hyprctl','monitors','-j').find(m=>m.focused); assert.equal(monitor.scale,1);
const move=(x,y,b=0)=>run(repo+'/artifacts/input/pointer',Math.round(x),Math.round(y),monitor.width,monitor.height,b);
const config=process.env.HOME+'/.config/omarchy/orb.json', originalText=fs.readFileSync(config,'utf8'), original=JSON.parse(originalText);
const postcard={label:'Postcard',icon:'postcard',command:['omarchy-shell','shell','summon','tahayvr.postcard','{}']};
let lastSaved=null, success=false, openedPostcard=false;
const report=[],pass=s=>{report.push(s);console.log('PASS:',s);};
async function openSettings(x=960,y=560){move(x,y);ipc('shell','summon',id,'{}');await until(()=>status().opened&&status().opacity===1);await sleep(200);key('Home');key('Return');await until(()=>status().settingsOpen,'Settings failed to open');await sleep(100);}
async function choose(slot,query){for(let i=0;i<slot;i++)key('Down');key('Return');await until(()=>status().editingSlot===slot);run('wtype',query);await until(()=>status().pickerItems.length>0,'No matching choices');key('Return');await until(()=>status().editingSlot===-1,'Choice did not return: '+JSON.stringify(status()));}
async function save(){run('wtype','-M','ctrl','-k','s','-m','ctrl');await until(()=>!status().settingsOpen&&!status().settingsSaving,'Save failed: '+JSON.stringify(status()));lastSaved=fs.readFileSync(config,'utf8');key('Escape');}
function shot(name){const s=status();run('grim','-g',`${Math.floor(s.settingsX-8)},${Math.floor(s.settingsY-8)} ${Math.ceil(s.settingsWidth+16)}x${Math.ceil(s.settingsHeight+16)}`,repo+'/artifacts/'+name+'.png');}
(async()=>{try{
for(let slot=0;slot<(process.argv.includes("--launch-only")?0:6);slot++){
 console.log('Checking slot',slot+1);await openSettings();await choose(slot,'Postcard');assert.deepEqual(status().draftActions[slot],postcard);
 key('Escape');assert.equal(fs.readFileSync(config,'utf8'),originalText);key('Escape');
}
if(!process.argv.includes('--launch-only'))pass('All six slots can choose Postcard; Cancel leaves the configuration unchanged');
await openSettings();await choose(2,'Nautilus');const app=status().draftActions[2];assert.ok(app.desktopId);await save();
assert.deepEqual(JSON.parse(lastSaved).actions[2],app);
pass('Installed-app search resolves a desktop entry and Save persists it');
const clientsBefore=json('hyprctl','clients','-j').map(w=>w.address);
ipc('shell','summon',id,'{}');await until(()=>status().opacity===1);await sleep(200);key('3');key('Return');
const launched=await until(()=>json('hyprctl','clients','-j').find(w=>!clientsBefore.includes(w.address)&&/nautilus/i.test(w.class)),'Installed Files app did not launch');
assert.equal(status().opened,false);run('hyprctl','dispatch',`hl.dsp.window.close({window="address:${launched.address}"})`);
pass('Selecting an installed app launches a real Files window after Orb dismisses');
assert.equal(fs.readFileSync(config,'utf8'),lastSaved);fs.writeFileSync(config,originalText);lastSaved=null;await sleep(250);
await openSettings();for(let i=0;i<3;i++)key('Down');key('Return');run('wtype','Postcard');await until(()=>status().pickerItems.length===1);shot('orb-slot-picker');key('Return');
assert.deepEqual(status().draftActions[3],postcard);shot('orb-slots-panel');await save();
const expected={...original,actions:original.actions.map((a,i)=>i===3?postcard:a)};assert.deepEqual(JSON.parse(lastSaved),expected);
await openSettings();assert.deepEqual(status().draftActions[3],postcard);key('Escape');key('Escape');
pass('Postcard replaces Screenshot, survives reopening, and preserves all other settings');
assert.ok(!JSON.stringify(json('hyprctl','layers','-j')).includes('"namespace":"postcard"'),'Postcard already open; will not disrupt existing work');
ipc('shell','summon',id,'{}');await until(()=>status().opacity===1);await sleep(200);
const s=status();move(s.x+s.diameter/2,s.y+s.diameter*.83,272);openedPostcard=true;
await until(()=>JSON.stringify(json('hyprctl','layers','-j')).includes('"namespace":"postcard"'),'Postcard editor did not open');assert.equal(status().opened,false);
pass('Clicking the bottom wheel slot opens the real Postcard editor');
ipc('shell','hide','tahayvr.postcard');openedPostcard=false;
for(const [x,y] of [[1,31],[1918,31],[1,1198],[1918,1198]]){
 await openSettings(x,y);const s=status();assert.ok(s.settingsX>=12&&s.settingsY>=42&&s.settingsX+s.settingsWidth<=1908&&s.settingsY+s.settingsHeight<=1188);key('Escape');key('Escape');
}
pass('Six-slot settings panel stays within all four screen corners');success=true;
}catch(error){console.error('Last status:',JSON.stringify(status()));shot('orb-slot-failure');throw error;}finally{
ipc('shell','hide',id);if(openedPostcard)ipc('shell','hide','tahayvr.postcard');
if(lastSaved&&fs.readFileSync(config,'utf8')===lastSaved&&!(success&&process.argv.includes('--apply-postcard')))fs.writeFileSync(config,originalText);
if(saved.focus)run('hyprctl','dispatch',`hl.dsp.focus({window="address:${saved.focus}"})`);move(saved.pointer.x,saved.pointer.y);
fs.writeFileSync(repo+'/artifacts/slots-live-results.json',JSON.stringify({date:new Date().toISOString(),success,report},null,2));
}})().catch(e=>{console.error(e);process.exitCode=1;});
