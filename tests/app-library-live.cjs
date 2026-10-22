const {execFileSync:exec}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
assert.ok(process.env.OMADEV_SLOT&&process.env.OMADEV_OWNER,'Run only in an owned omadev nest');
const repo=path.resolve(__dirname,'..'),id='io.github.tcballard.orb';
const run=(cmd,...args)=>exec(cmd,args.map(String),{encoding:'utf8',timeout:15000}).trim(),ipc=(...args)=>run('omarchy-shell',...args),status=()=>JSON.parse(ipc(id,'status'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(check){for(let i=0;i<300;i++){if(check())return;await sleep(100);}throw Error('Timed out');}
const config=path.join(process.env.XDG_CONFIG_HOME,'omarchy/orb.json');assert.ok(fs.realpathSync(config).startsWith(process.env.OMADEV_HOME+'/'));
const original=fs.readFileSync(config,'utf8'),fixture=JSON.parse(fs.readFileSync(path.join(repo,'config.example.json')));
const clients=()=>JSON.parse(run('hyprctl','clients','-j')).filter(w=>w.class==='com.mitchellh.ghostty'),existing=new Set(clients().map(w=>w.address));
const pointer=path.join(repo,'artifacts/input/pointer'),monitor=JSON.parse(run('hyprctl','monitors','-j')).find(m=>m.focused);
const key=k=>run('wtype','-s','70','-k',k,'-s','70');
async function click(name){const s=status(),c=s.settingsControls.find(c=>c.name===name);assert.ok(c&&c.enabled,name);run(pointer,Math.round(s.settingsX+c.x+c.width/2),Math.round(s.settingsY+c.y+c.height/2),monitor.width,monitor.height,272);await sleep(120);}
(async()=>{try{
    ipc('shell','hide',id);fs.writeFileSync(config,JSON.stringify(fixture));await sleep(250);
    ipc('shell','summon',id,'{}');await until(()=>status().ready&&status().opacity===1);await sleep(160);key('Home');key('Return');await until(()=>status().settingsOpen&&status().catalogAppCount>0);
    await click('orb-browse-actions');await click('orb-catalog-search');run('wtype','--','Ghostty');await until(()=>status().pickerItems.includes('Ghostty'));
    key('Return');assert.equal(status().draftActions[0].desktopId,'com.mitchellh.ghostty');await click('orb-save');await until(()=>!status().settingsOpen&&!status().settingsSaving);
    key('1');key('Return');await until(()=>clients().some(w=>!existing.has(w.address)));assert.equal(status().opened,false);
    const report={date:new Date().toISOString(),source:run('git','-C',repo,'rev-parse','HEAD'),omarchy:run('git','-C',process.env.OMARCHY_PATH,'rev-parse','HEAD'),fallback:status().appLibraryFallback,result:'passed',check:'An installed app is selected from the catalog, saved by desktop ID and launches a real new Ghostty window after Orb dismisses; only the new window is closed'};
    fs.writeFileSync(path.join(repo,'artifacts/app-library-results.json'),JSON.stringify(report,null,2)+'\n');console.log('PASS:',report.check,'(fallback='+report.fallback+')');
}finally{try{ipc('shell','hide',id);}catch{}fs.writeFileSync(config,original);for(const w of clients())if(!existing.has(w.address))run('hyprctl','dispatch',`hl.dsp.window.close({window="address:${w.address}"})`);}})().catch(error=>{console.error(error);process.exitCode=1;});
