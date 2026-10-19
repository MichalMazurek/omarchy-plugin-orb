// Capture actual desktop interaction, then restore workspace, focus and pointer.
const {execFileSync,spawnSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const artifacts=path.join(root,'artifacts');
const output=path.join(artifacts,'recordings');
fs.mkdirSync(output,{recursive:true});
const env={...process.env,OMARCHY_SCREENRECORD_DIR:output};
const run=(cmd,...args)=>execFileSync(cmd,args.map(String),{env,encoding:'utf8',timeout:30000}).trim();
const json=(cmd,...args)=>JSON.parse(run(cmd,...args));
const ipc=(...args)=>run('omarchy-shell',...args);
const id='io.github.tcballard.orb';
const state=()=>JSON.parse(ipc(id,'status'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const pointer=path.join(artifacts,'input/pointer');
const move=(x,y,button=0)=>run(pointer,Math.round(x),Math.round(y),1920,1200,button);
const dispatch=expr=>run('hyprctl','dispatch',expr);
const key=k=>run('wtype','-k',k);
const saved={workspace:json('hyprctl','activeworkspace','-j').name,focus:json('hyprctl','activewindow','-j').address,pointer:json('hyprctl','cursorpos','-j')};
if(spawnSync('omarchy',['screenrecord','--status'],{env}).status===0)throw Error('A recording is already active');
const monitor=json('hyprctl','monitors','-j').find(m=>m.focused);
if(monitor.width!==1920||monitor.height!==1200||monitor.scale!==1)throw Error('Demo is calibrated for the XPS panel');
let recording=false;
let created=[];
async function open(){
  // Exercise the actual registered Hyprland shortcut dispatcher.
  const bind=json('hyprctl','binds','-j').find(b=>b.description==='Orb shortcut wheel');
  if(!bind)throw Error('Orb shortcut is missing');
  run('hyprctl','dispatch',bind.dispatcher,bind.arg);
  for(let n=0;n<80;n++){const s=state();if(s.opened&&s.opacity===1)return s;await sleep(50);}
  throw Error('Orb failed to open');
}
(async()=>{
 try {
  dispatch('hl.dsp.focus({ workspace = "name:orb-demo" })');
  move(960,560);await sleep(300);
  run('omarchy','screenrecord','--fullscreen');recording=true;
  await sleep(600);
  let s=await open();await sleep(700);
  for(const index of [0,1,2,4,5,1]){
    const angle=(index*60-90)*Math.PI/180;
    move(s.x+s.diameter/2+Math.cos(angle)*s.diameter*.33,s.y+s.diameter/2+Math.sin(angle)*s.diameter*.33);
    await sleep(650);
  }
  run('grim','-g','675,280 570x600',path.join(artifacts,'orb-preview.png'));
  const before=json('hyprctl','clients','-j').map(w=>w.address);
  const angle=-Math.PI/6;
  move(s.x+s.diameter/2+Math.cos(angle)*s.diameter*.33,s.y+s.diameter/2+Math.sin(angle)*s.diameter*.33,272);
  await sleep(1800);
  created=json('hyprctl','clients','-j').filter(w=>!before.includes(w.address)&&/ghostty|alacritty|kitty|foot/i.test(w.class)).map(w=>w.address);
  if(created.length!==1)throw Error('Expected a new terminal from the real pointer click');
  move(960,560);await open();key('Right');await sleep(500);key('Right');await sleep(500);key('Escape');await sleep(700);
  console.log(run('omarchy','screenrecord','--stop-recording'));recording=false;
  console.log('Recorded actual hover, pointer launch, registered shortcut dispatch, keyboard selection and cancellation.');
 } finally {
  if(recording)run('omarchy','screenrecord','--stop-recording');
  ipc('shell','hide',id);
  for(const address of created)dispatch(`hl.dsp.window.close({ window = "address:${address}" })`);
  dispatch(`hl.dsp.focus({ workspace = ${JSON.stringify(saved.workspace)} })`);
  if(saved.focus)dispatch(`hl.dsp.focus({ window = "address:${saved.focus}" })`);
  move(saved.pointer.x,saved.pointer.y);
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
