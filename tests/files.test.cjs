const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const model=require('../Model.js'),script=path.resolve(__dirname,'../scripts/files');
test('Files menu accepts only top-level built-ins and upgrades the original shortcut without changing custom commands',()=>{
    const legacy={label:'Files',icon:'files',command:['omarchy','launch','nautilus']};
    assert.deepEqual(model.action(legacy,0),{label:'Files',icon:'files',menu:'files'});
    assert.deepEqual(model.action(legacy,1),legacy);
    for(const value of [{...legacy,label:'Work files'},{...legacy,command:[...legacy.command,'/tmp/Work']},{label:'Files',icon:'app',desktopId:'org.gnome.Nautilus'}])assert.deepEqual(model.action(value,0),value);
    const builtin={label:'Files',icon:'files',menu:'files'};
    assert.deepEqual(model.action(builtin,0),builtin);assert.equal(model.action(builtin,1),null);
    for(const extra of [{command:['true']},{children:[legacy]},{desktopId:'org.gnome.Nautilus'}])assert.equal(model.action({...builtin,...extra},0),null);
    assert.equal(model.action({...builtin,menu:'unknown'},0),null);
    const actions=model.fileActions('/tmp/plugin with spaces/scripts/files');
    assert.deepEqual(actions.map(a=>a.label),['Home','Recent','Starred','Downloads','Documents','Pictures','Music','Videos','Trash']);
    for(const action of actions)assert.deepEqual(model.action(action,1),action);
    assert.deepEqual(actions[3].command,['bash','/tmp/plugin with spaces/scripts/files','downloads']);
    const document=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../config.example.json'),'utf8'));
    document.actions[2]={...legacy,note:'keep my metadata'};document.other='keep';
    const original=model.parse(JSON.stringify(document),null).config;
    const draft={...original,diameter:360};
    assert.deepEqual(model.mergeSettings(document,original,draft).document,{...document,diameter:360});
});
test('Files launcher resolves XDG folders, retains literal path arguments, and rejects unavailable or unknown locations',()=>{
    const temp=fs.mkdtempSync(path.join(os.tmpdir(),'orb-files-')),home=path.join(temp,'home'),bin=path.join(temp,'bin'),output=path.join(temp,'args.json');
    fs.mkdirSync(home);fs.mkdirSync(bin);
    const stub=(name,text)=>fs.writeFileSync(path.join(bin,name),text,{mode:0o755});
    stub('setsid','#!/bin/bash\nexec "$@"\n');
    stub('uwsm-app','#!/usr/bin/env node\nrequire("node:fs").writeFileSync(process.env.ORB_TEST_OUTPUT,JSON.stringify(process.argv.slice(2)));\n');
    stub('xdg-user-dir','#!/bin/bash\n[[ $1 == "$ORB_TEST_DIRECTORY" ]] || exit 3\nprintf "%s\\n" "$ORB_TEST_LOCATION"\n');
    const custom=path.join(home,'Incoming $(literal) with spaces');fs.mkdirSync(custom);
    const invoke=(args,env={})=>spawnSync('bash',[script,...args],{encoding:'utf8',env:{...process.env,BASH_ENV:'',HOME:home,PATH:bin+path.delimiter+process.env.PATH,ORB_TEST_OUTPUT:output,...env}});
    const expect=(id,location,env={})=>{const result=invoke([id],env);assert.equal(result.status,0,result.stderr);assert.deepEqual(JSON.parse(fs.readFileSync(output)),['--','nautilus','--new-window',location]);fs.unlinkSync(output);};
    try{
        expect('home',home);
        for(const id of ['recent','starred','trash'])expect(id,id+':///');
        for(const [id,kind] of [['downloads','DOWNLOAD'],['documents','DOCUMENTS'],['pictures','PICTURES'],['music','MUSIC'],['videos','VIDEOS']])expect(id,custom,{ORB_TEST_DIRECTORY:kind,ORB_TEST_LOCATION:custom});
        fs.mkdirSync(path.join(home,'Downloads'));expect('downloads',path.join(home,'Downloads'));
        expect('downloads',home,{ORB_TEST_DIRECTORY:'DOWNLOAD',ORB_TEST_LOCATION:home});
        for(const args of [[],['unknown'],['home','extra'],['$(touch injected)'],['documents']]){
            assert.notEqual(invoke(args).status,0);assert.equal(fs.existsSync(output),false);
        }
        assert.equal(fs.existsSync(path.join(home,'injected')),false);
    }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
