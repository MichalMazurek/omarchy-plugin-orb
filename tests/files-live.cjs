// Owned-nest acceptance: real radial input, native Files windows and D-Bus URIs.
const {execFileSync:exec,spawnSync}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
assert.ok(process.env.OMADEV_SLOT&&process.env.OMADEV_OWNER,'Run only inside an owned omadev nest');
const repo=path.resolve(__dirname,'..'),id='io.github.tcballard.orb';
const run=(cmd,...args)=>exec(cmd,args.map(String),{encoding:'utf8',timeout:15000}).trim();
const json=(...args)=>JSON.parse(run(...args)),ipc=(...args)=>run('omarchy-shell',...args),status=()=>JSON.parse(ipc(id,'status'));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(check,message){for(let i=0;i<100;i++){if(check())return;await sleep(100);}throw Error(message||'Timed out');}
const key=k=>run('wtype','-s','60','-k',k,'-s','60');
const monitor=()=>json('hyprctl','monitors','-j').find(m=>m.focused);
const move=(x,y,button=0)=>{const m=monitor();run(path.join(repo,'artifacts/input/pointer'),Math.round(x),Math.round(y),m.width,m.height,button);};
const clients=()=>json('hyprctl','clients','-j').filter(w=>w.class==='org.gnome.Nautilus');
const existing=new Set(clients().map(w=>w.address));
const config=path.join(process.env.XDG_CONFIG_HOME,'omarchy/orb.json'),dirsConfig=path.join(process.env.XDG_CONFIG_HOME,'user-dirs.dirs');
assert.ok(config.startsWith(process.env.OMADEV_HOME+'/'));
const original=fs.readFileSync(config,'utf8'),originalDirs=fs.existsSync(dirsConfig)?fs.readFileSync(dirsConfig):null;
const originalDirsLink=fs.lstatSync(dirsConfig,{throwIfNoEntry:false})?.isSymbolicLink()?fs.readlinkSync(dirsConfig):null;
const labels=['Home','Recent','Starred','Downloads','Documents','Pictures','Music','Videos','Trash'],report=[];
const fixture=JSON.parse(fs.readFileSync(path.join(repo,'config.example.json')));
fixture.animation=false;fixture.desktopRightClick=false;
fixture.actions[2]={label:'Files',icon:'files',command:['omarchy','launch','nautilus'],note:'preserve legacy Files metadata'};
const fixtureText=JSON.stringify(fixture,null,2)+'\n',locations={home:process.env.OMADEV_HOME,recent:'recent:///',starred:'starred:///',trash:'trash:///'};
const folderRoot=path.join(process.env.OMADEV_HOME,'Orb test folders');
for(const [name,kind] of [['Downloads','DOWNLOAD'],['Documents','DOCUMENTS'],['Pictures','PICTURES'],['Music','MUSIC'],['Videos','VIDEOS']]){
    const folder=path.join(folderRoot,name);fs.mkdirSync(folder,{recursive:true});locations[name.toLowerCase()]=folder;
}
const dirsText=Object.entries({DOWNLOAD:'Downloads',DOCUMENTS:'Documents',PICTURES:'Pictures',MUSIC:'Music',VIDEOS:'Videos'})
    .map(([kind,name])=>'XDG_'+kind+'_DIR='+JSON.stringify(path.join(folderRoot,name))).join('\n')+'\n';
function currentLocations(){const r=spawnSync('gdbus',['call','--session','--dest','org.gnome.Nautilus','--object-path','/org/freedesktop/FileManager1','--method','org.freedesktop.DBus.Properties.Get','org.freedesktop.FileManager1','OpenLocations'],{encoding:'utf8',timeout:2000});return r.status===0?r.stdout:'';}
async function closeCreated(){for(const w of clients())if(!existing.has(w.address))run('hyprctl','dispatch',`hl.dsp.window.close({ window = "address:${w.address}" })`);await until(()=>clients().every(w=>existing.has(w.address)),'Test Files window did not close');}
async function openFiles(pointer=false){
    ipc('shell','hide',id);const m=monitor();move(m.width/2,m.height/2);ipc('shell','summon',id,'{}');
    await until(()=>status().ready&&status().opacity===1);await sleep(160);
    if(pointer){const s=status(),angle=(2*360/s.visibleItems.length-90)*Math.PI/180;move(s.x+s.diameter/2+Math.cos(angle)*s.diameter*.33,s.y+s.diameter/2+Math.sin(angle)*s.diameter*.33,272);}
    else{key('3');key('Return');}
    await until(()=>status().submenu==='Files');
}
function capture(name,wheel=true){
    const s=status();if(wheel)move(s.x+s.diameter+20,s.y+20);run('sleep','0.2');
    const region=wheel?['-g',`${Math.floor(s.x-8)},${Math.floor(s.y-8)} ${Math.ceil(s.diameter+16)}x${Math.ceil(s.diameter+s.footerHeight+16)}`]:[];
    run('grim',...region,path.join(repo,'artifacts',name+'.png'));
}
const pass=message=>{report.push(message);console.log('PASS:',message);};
(async()=>{try{
    await until(()=>status().setupReady);fs.writeFileSync(config,fixtureText);
    // omadev shares most non-Omarchy app config through symlinks. Replace this
    // link inside our owned nest before writing fixtures; never follow it.
    if(originalDirsLink!==null)fs.unlinkSync(dirsConfig);
    fs.writeFileSync(dirsConfig,dirsText);
    await until(()=>status().visibleItems.length===6&&status().visibleItems[1]==='Terminal');
    await openFiles(true);let s=status();assert.deepEqual(s.items,labels);assert.equal(s.pages,2);assert.deepEqual(s.visibleItems,labels.slice(0,6));
    capture('files-menu-first');const frame=[s.x,s.y,s.diameter];key('Page_Down');assert.deepEqual(status().visibleItems,labels.slice(6));
    assert.deepEqual([status().x,status().y,status().diameter],frame);capture('files-menu-second');
    key('Home');key('Return');assert.equal(status().submenu,'');assert.equal(status().selected,2);
    await openFiles();key('Escape');assert.equal(status().submenu,'');assert.equal(status().opened,true);
    key('Escape');assert.equal(status().opened,false);assert.equal(fs.readFileSync(config,'utf8'),fixtureText);
    pass('Original Files shortcut opens its circular menu by pointer and keyboard; both pages, centre-back and Escape preserve geometry and settings');
    for(let index=0;index<labels.length;index++){
        const label=labels[index],location=locations[label.toLowerCase()],uri=location.startsWith('/')?pathToFileURL(location).href:location;
        await openFiles();if(index>=6)key('Page_Down');
        if(index===3){const s=status(),angle=(index*60-90)*Math.PI/180;move(s.x+s.diameter/2+Math.cos(angle)*s.diameter*.33,s.y+s.diameter/2+Math.sin(angle)*s.diameter*.33,272);}
        else{key(String(index%6+1));key('Return');}
        await until(()=>!status().opened&&status().lastDispatch==='command:'+label,'Orb did not launch '+label);
        await until(()=>clients().some(w=>!existing.has(w.address))&&currentLocations().includes("'"+uri+"'"),'Files did not open '+label+' at '+uri+'; '+currentLocations());
        if(label==='Recent'||label==='Starred')capture('files-open-'+label.toLowerCase(),false);
        pass(label+' opens the correct native Files location');await closeCreated();
    }
    await openFiles();key('Home');key('Return');key('6');key('Return');
    await until(()=>status().submenu==='Agents'&&!status().loading);key('Escape');assert.equal(status().selected,5);
    pass('Agents still opens and returns normally');
    ipc('shell','hide',id);assert.equal(fs.readFileSync(config,'utf8'),fixtureText);
    // Catalog choices and saved settings retain the new built-in menu type.
    ipc('shell','summon',id,'{}');await until(()=>status().ready&&status().opacity===1);await sleep(160);key('Home');key('Return');await until(()=>status().settingsOpen);
    assert.equal(status().draftActions[2].menu,'files');key('Escape');
    pass('Settings recognises the upgraded Files slot without rewriting the saved configuration');
}catch(error){try{capture('files-failure',false);fs.writeFileSync(path.join(repo,'artifacts/files-failure.json'),JSON.stringify(status(),null,2));}catch{}throw error;
}finally{
    try{ipc('shell','hide',id);await closeCreated();}catch{}
    fs.writeFileSync(config,original);
    if(originalDirsLink!==null){fs.rmSync(dirsConfig,{force:true});fs.symlinkSync(originalDirsLink,dirsConfig);}
    else if(originalDirs===null)fs.rmSync(dirsConfig,{force:true});else fs.writeFileSync(dirsConfig,originalDirs);
    fs.writeFileSync(path.join(repo,'artifacts/files-live-results.json'),JSON.stringify({date:new Date().toISOString(),source:run('git','-C',repo,'rev-parse','HEAD'),display:monitor(),report,runtimeHashes:Object.fromEntries(['Wheel.qml','Model.js','LineIcon.qml','scripts/files','config.example.json'].map(f=>[f,require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(repo,f))).digest('hex')]))},null,2)+'\n');
}})().catch(error=>{console.error(error);process.exitCode=1;});
