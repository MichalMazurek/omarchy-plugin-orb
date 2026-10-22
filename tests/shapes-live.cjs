const {execFileSync:exec,spawnSync}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
assert.ok(process.env.OMADEV_SLOT&&process.env.OMADEV_OWNER,'Run only in an owned omadev nest');
const repo=path.resolve(__dirname,'..'),id='io.github.tcballard.orb';
const run=(cmd,...args)=>exec(cmd,args.map(String),{encoding:'utf8',timeout:15000}).trim();
const json=(...args)=>JSON.parse(run(...args)),ipc=(...args)=>run('omarchy-shell',...args),status=()=>JSON.parse(ipc(id,'status'));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(check,message){for(let i=0;i<100;i++){if(check())return;await sleep(80);}throw Error(message||'Timed out');}
const key=k=>run('wtype','-s','60','-k',k,'-s','60');
const monitor=()=>json('hyprctl','monitors','-j').find(m=>m.focused),pointer=path.join(repo,'artifacts/input/pointer');
const move=(x,y,button=0,end)=>{const m=monitor();run(pointer,Math.round(x),Math.round(y),m.width,m.height,button,...(end?end.map(Math.round):[]));};
const config=path.join(process.env.XDG_CONFIG_HOME,'omarchy/orb.json');assert.ok(fs.realpathSync(config).startsWith(process.env.OMADEV_HOME+'/'));
const original=fs.readFileSync(config,'utf8'),report=[];
const fixture=(count,shape)=>({diameter:360,animation:false,shortcut:'SUPER + ALT + O',desktopRightClick:false,...(shape?{shape}:{}),custom:'preserve',actions:Array.from({length:count},(_,i)=>({label:'Slot '+(i+1),icon:['browser','terminal','files','screenshot','themes','plugins','agents','create'][i],note:'metadata '+i,children:Array.from({length:i===0?3:2},(_,j)=>({label:'Child '+(j+1),icon:'files',command:['true']}))}))});
async function reset(count,shape){ipc('shell','hide',id);fs.writeFileSync(config,JSON.stringify(fixture(count,shape),null,2)+'\n');await until(()=>status().visibleItems.length===count&&status().shape===(shape||'circle'));await sleep(150);}
async function open(){ipc('shell','hide',id);const m=monitor();move(m.width/2,m.height/2);ipc('shell','summon',id,'{}');await until(()=>status().ready&&status().opacity===1);await sleep(120);}
async function settings(){await open();key('Home');key('Return');await until(()=>status().settingsOpen);await sleep(100);}
function control(name){const s=status(),c=s.settingsControls.find(c=>c.name===name);assert.ok(c,'Missing '+name);return {...c,x:c.x+s.settingsX,y:c.y+s.settingsY};}
async function click(name){let c=control(name);for(let i=0;i<20;i++){const s=status(),l=s.settingsLayout,top=s.settingsY+l.bodyY,bottom=top+l.bodyHeight,y=c.y+c.height/2;if(/^orb-(tab-|save$|cancel$)/.test(name)||y>=top&&y<=bottom)break;move(s.settingsX+l.bodyX+l.bodyWidth/2,top+l.bodyHeight/2,y<top?-2:-1);await sleep(100);c=control(name);}assert.ok(c.enabled);move(c.x+c.width/2,c.y+c.height/2,272);await sleep(120);}
const frame=()=>{const s=status();return [s.settingsX,s.settingsY,s.settingsWidth,s.settingsHeight];};
const point=(s,index,count,r=.33)=>{const a=index*Math.PI*2/count-Math.PI/2;return [s.x+s.diameter/2+Math.cos(a)*s.diameter*r,s.y+s.diameter/2+Math.sin(a)*s.diameter*r];};
function capture(name,settings=false){const s=status();move(1,monitor().height-1);run('sleep','0.2');const box=settings?[s.settingsX,s.settingsY,s.settingsWidth,s.settingsHeight]:[s.x-8,s.y-8,s.diameter+16,s.diameter+s.footerHeight+16];run('grim','-g',`${Math.floor(box[0])},${Math.floor(box[1])} ${Math.ceil(box[2])}x${Math.ceil(box[3])}`,path.join(repo,'artifacts',name+'.png'));}
const pass=message=>{report.push(message);console.log('PASS:',message);};
(async()=>{try{
await until(()=>spawnSync('omarchy-shell',[id,'status'],{encoding:'utf8'}).status===0);await reset(6);const legacyText=fs.readFileSync(config,'utf8');
await settings();const opening=frame();await click('orb-tab-1');await click('orb-shape-polygon');assert.equal(status().draftShape,'polygon');assert.deepEqual(frame(),opening);
await click('orb-tab-0');assert.equal(status().preview.shape,'polygon');capture('shape-settings-polygon',true);
const beforeDrag=status().draftActions.map(a=>a.label),p=status().preview,s=status();
const previewPoint=i=>{const a=i*Math.PI/3-Math.PI/2;return [s.settingsX+p.x+p.diameter/2+Math.cos(a)*p.diameter*.33,s.settingsY+p.y+p.diameter/2+Math.sin(a)*p.diameter*.33];};
move(...previewPoint(0),272,previewPoint(2));await until(()=>status().draftActions[2].label===beforeDrag[0]);
key('Delete');assert.equal(status().draftActions.length,5);key('Delete');assert.equal(status().draftActions.length,5);assert.equal(control('orb-remove-slot').enabled,false);assert.deepEqual(frame(),opening);
await click('orb-cancel');assert.equal(fs.readFileSync(config,'utf8'),legacyText);
pass('Shape and five-slot edits update the polygon preview; dragging works, the panel stays fixed and Cancel preserves legacy settings');
await settings();await click('orb-tab-1');await click('orb-shape-polygon');await click('orb-save');await until(()=>!status().settingsOpen&&!status().settingsSaving);
assert.equal(JSON.parse(fs.readFileSync(config)).shape,'polygon');assert.equal(JSON.parse(fs.readFileSync(config)).actions[0].note,'metadata 0');
await settings();assert.equal(status().draftShape,'polygon');await click('orb-tab-1');await click('orb-shape-circle');await click('orb-cancel');assert.equal(JSON.parse(fs.readFileSync(config)).shape,'polygon');
pass('Polygon saves and reopens with metadata intact; cancelling a switch back to Circle retains Polygon');
for(const count of [5,6,7,8]){
    await reset(count,'polygon');await open();let s=status();capture('shape-polygon-'+count);
    for(let i=0;i<count;i++){move(...point(s,i,count));await until(()=>status().selected===i,`Polygon ${count} slot ${i} did not hover`);}
    move(s.x+s.diameter/2,s.y+s.diameter/2);await until(()=>status().hubActive);capture('shape-hub-'+count);
    const angle=-Math.PI/2+Math.PI/count,corner=[s.x+s.diameter/2+Math.cos(angle)*s.diameter*.46,s.y+s.diameter/2+Math.sin(angle)*s.diameter*.46];
    move(...corner);await until(()=>status().selected===-1);move(...corner,272);await until(()=>!status().opened);assert.equal(status().launchPending,false);
    await open();s=status();move(...point(s,0,count),272);await until(()=>status().submenu==='Slot 1');
    assert.deepEqual([status().x,status().y,status().diameter],[s.x,s.y,s.diameter]);assert.equal(status().visibleItems.length,3);capture('shape-triangle-'+count);
    move(status().x+status().diameter/2,status().y+status().diameter/2,272);await until(()=>status().submenu==='');
    key('2');key('Return');assert.equal(status().visibleItems.length,2);capture('shape-two-item-'+count);key('Escape');assert.equal(status().selected,1);
    pass(count+' shortcuts: polygon sectors hover correctly, the circular hub works, empty corners dismiss, and submenu/back navigation preserves geometry');
}
await reset(5,'polygon');await settings();await click('orb-tab-1');await click('orb-shape-circle');capture('shape-appearance',true);await click('orb-save');await until(()=>!status().settingsOpen&&!status().settingsSaving);
assert.equal(status().shape,'circle');assert.equal(JSON.parse(fs.readFileSync(config)).actions.length,5);
await open();const circleState=status(),angle=-Math.PI/2+Math.PI/5;move(circleState.x+circleState.diameter/2+Math.cos(angle)*circleState.diameter*.46,circleState.y+circleState.diameter/2+Math.sin(angle)*circleState.diameter*.46);await until(()=>status().selected>=0);capture('shape-circle-5');
pass('Circle can be restored and saved for five shortcuts; circular sectors retain their full round hit areas');
}catch(error){try{capture('shape-failure',status().settingsOpen);fs.writeFileSync(path.join(repo,'artifacts/shape-failure.json'),JSON.stringify(status(),null,2));}catch{}throw error;
}finally{try{ipc('shell','hide',id);}catch{}fs.writeFileSync(config,original);fs.writeFileSync(path.join(repo,'artifacts/shapes-live-results.json'),JSON.stringify({date:new Date().toISOString(),source:run('git','-C',repo,'rev-parse','HEAD'),display:monitor(),report,runtimeHashes:Object.fromEntries(['Model.js','Wheel.qml','WheelSurface.qml','WheelPreview.qml','SettingsPanel.qml'].map(f=>[f,require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(repo,f))).digest('hex')]))},null,2)+'\n');}})().catch(error=>{console.error(error);process.exitCode=1;});
