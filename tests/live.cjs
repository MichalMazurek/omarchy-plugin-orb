// Explicitly invoked, real desktop test. Uses virtual input, never mocks launchers.
// ORB_POINTER must name an inspected Wayland virtual-pointer tool accepting
// x y outputWidth outputHeight button (0 moves, 272 left-clicks).
const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const id = 'io.github.tcballard.orb';
const pointer = process.env.ORB_POINTER;
if (!pointer) throw new Error('Set ORB_POINTER to the virtual pointer test tool');
const run = (cmd, ...args) => execFileSync(cmd, args.map(String), {encoding:'utf8', timeout:15000}).trim();
const json = (cmd, ...args) => JSON.parse(run(cmd,...args));
const ipc = (...args) => run('omarchy-shell', ...args);
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const status = () => JSON.parse(ipc(id,'status'));
const dispatch = expression => run('hyprctl','dispatch',expression);
const key = k => run('wtype','-k',k);
const saved = {workspace:json('hyprctl','activeworkspace','-j').name, pointer:json('hyprctl','cursorpos','-j'), focus:json('hyprctl','activewindow','-j').address};
const monitor = json('hyprctl','monitors','-j').find(m=>m.focused);
assert.equal(monitor.scale,1,'This XPS harness requires scale 1');
assert.equal(monitor.transform,0);
const move = (x,y,button=0) => run(pointer,Math.round(x),Math.round(y),monitor.width,monitor.height,button);
const report = [];
const artifacts = path.join(__dirname,'../artifacts');
fs.mkdirSync(artifacts,{recursive:true});
let themeRestoration = null;
async function until(fn, message, timeout=4000) {
  const end = Date.now()+timeout;
  while (Date.now()<end) { const value=fn(); if(value) return value; await sleep(60); }
  throw new Error(message);
}
async function open() {
  ipc('shell','summon',id,'{}');
  return until(()=>{const s=status();return s.opened&&s.positioned&&s.opacity===1?s:false;},'Wheel did not become visible');
}
const pass = (name,detail={}) => {report.push({name,pass:true,...detail});console.log('PASS:',name);};
function layers() {
  return Object.values(json('hyprctl','layers','-j')).flatMap(m=>Object.values(m.levels).flat()).map(l=>l.namespace);
}
(async()=>{
  try {
    dispatch('hl.dsp.focus({ workspace = "name:orb-demo" })');
    move(960,560);
    let s=await open();
    key('Right'); assert.equal(status().selected,0);
    key('Left'); assert.equal(status().selected,5);
    key('3'); assert.equal(status().selected,2);
    key('Escape'); assert.equal(status().opened,false);
    pass('Keyboard navigation, wrap, numeric selection and Escape');
    // Repeated summon resets the existing window; toggle closes it.
    for(let n=0;n<12;n++) {await open(); key('Escape'); assert.equal(status().opened,false);}
    await open(); await open(); assert.equal(layers().filter(n=>n==='omarchy-plugin-orb').length,1);
    ipc('shell','toggle',id,'{}'); assert.equal(status().opened,false);
    pass('12 open/cancel cycles, repeated summon and toggle, one layer');
    for(const [x,y] of [[1,31],[1918,31],[1,1198],[1918,1198]]) {
      move(x,y);s=await open();
      assert.ok(s.x>=12 && s.y>=42);
      assert.ok(s.x+s.diameter<=1908 && s.y+s.diameter+38<=1188);
      key('Escape');
    }
    pass('All four physical screen corners stay inside the bar and monitor bounds');
    move(960,560);s=await open();
    move(s.x+s.diameter/2,s.y+s.diameter*.19);
    move(s.x+s.diameter/2+3,s.y+s.diameter*.19);
    assert.equal(status().selected,0); assert.equal(status().keyboard,false);
    key('Right');assert.equal(status().selected,1);await sleep(200);assert.equal(status().selected,1);
    move(1700,1100,272);assert.equal(status().opened,false);
    pass('Real pointer hover, keyboard takes over, outside click dismisses');
    if(process.argv.includes('--actions')) {
      const checks=[['Browser',0,/chromium|firefox|brave|chrome/i],['Terminal',1,/ghostty|alacritty|kitty|foot/i],['Files',2,/nautilus/i],['Screenshot',3,/postcard|omasnap/],['Themes',4,/omarchy-image-selector/],['Plugins',5,/omarchy-menu/]];
      for(const [label,index,expected] of checks) {
        dispatch('hl.dsp.focus({ workspace = "name:orb-demo" })');
        const before=json('hyprctl','clients','-j').map(w=>w.address);
        move(960,560);s=await open();
        if(index===1) {
          const angle=(index*60-90)*Math.PI/180;
          move(s.x+s.diameter/2+Math.cos(angle)*s.diameter*.33,s.y+s.diameter/2+Math.sin(angle)*s.diameter*.33,272);
        } else {key(String(index+1));key('Return');}
        await until(()=>!status().opened,'Wheel failed to dismiss after activation');
        const result=await until(()=>{
          if(index<3) {const active=json('hyprctl','activewindow','-j');return expected.test(active.class||'')?{class:active.class}:false;}
          const names=layers();return names.some(n=>expected.test(n))?{layers:names.filter(n=>expected.test(n))}:false;
        },`${label} did not open`,9000);
        assert.equal(status().lastAction,label);
        pass(`Real action: ${label}`,result);
        // Only close brand-new test windows, never existing user windows/tabs.
        if(index<3) {
          const created=json('hyprctl','clients','-j').filter(w=>!before.includes(w.address)&&expected.test(w.class));
          for(const w of created) dispatch(`hl.dsp.window.close({ window = "address:${w.address}" })`);
        } else key('Escape');
        await sleep(250);
      }
    }
    if(process.argv.includes('--theme')) {
      const home=process.env.HOME;
      const current=`${home}/.local/state/omarchy/current/theme`;
      themeRestoration=[fs.readFileSync(`${current}/colors.toml`).toString('base64'),fs.readFileSync(`${current}/shell.toml`).toString('base64')];
      move(960,560);await open();const old=status();
      ipc('shell','applyTheme',fs.readFileSync(`${process.env.OMARCHY_PATH}/themes/everforest/colors.toml`).toString('base64'),'');
      await until(()=>status().foreground!==old.foreground,'Theme tokens did not update');
      run('grim','-g','675,280 570x600',`${artifacts}/orb-everforest.png`);
      ipc('shell','applyTheme',...themeRestoration);themeRestoration=null;
      await until(()=>status().foreground===old.foreground,'Original colours did not restore');
      pass('Live shell theme token change to Everforest and restoration; app configs untouched');
      key('Escape');
    }
    dispatch(`hl.dsp.focus({ window = "address:${saved.focus}" })`);
    const beforeFocus=json('hyprctl','activewindow','-j').address;
    await open();key('Escape');await sleep(150);
    assert.equal(json('hyprctl','activewindow','-j').address,beforeFocus);
    assert.ok(!layers().includes('omarchy-plugin-orb'));
    pass('Escape restores previous window focus and removes exclusive layer');
  } catch(error) {
    report.push({pass:false,error:error.message});process.exitCode=1;console.error(error);
  } finally {
    if(themeRestoration) ipc('shell','applyTheme',...themeRestoration);
    ipc('shell','hide',id);
    dispatch(`hl.dsp.focus({ workspace = ${JSON.stringify(saved.workspace)} })`);
    if(saved.focus) dispatch(`hl.dsp.focus({ window = "address:${saved.focus}" })`);
    move(saved.pointer.x,saved.pointer.y);
    fs.writeFileSync(`${artifacts}/live-results.json`,JSON.stringify({date:new Date().toISOString(),report},null,2));
  }
})();
