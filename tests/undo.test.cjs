const test=require('node:test'),assert=require('node:assert/strict');
const history=require('../ShortcutHistory.js'),model=require('../Model.js');
const fixture=require('../config.example.json');
test('shortcut undo snapshots retain action and child identities without appearance state',()=>{
    const original=model.parse(JSON.stringify(fixture),null).config;
    const draft={...original,actions:structuredClone(original.actions),actionOrigins:original.actions.map((_,i)=>i),
        childOrigins:original.actions.map(a=>a.children?a.children.map((_,i)=>i):[]),selectedSlot:4};
    const stack=history.remember([],draft),saved=stack[0];
    draft.actions[4].children.reverse();draft.childOrigins[4].reverse();draft.actions.splice(0,1);draft.actionOrigins.splice(0,1);
    draft.diameter=480;draft.shape='polygon';draft.shortcut='SUPER + ALT + F12';
    assert.deepEqual(saved.actions,original.actions);assert.deepEqual(saved.actionOrigins,[0,1,2,3,4,5]);
    Object.assign(draft,saved);
    assert.equal(draft.diameter,480);assert.equal(draft.shape,'polygon');assert.equal(draft.shortcut,'SUPER + ALT + F12');
    const latest=structuredClone(fixture);latest.actions[4].children[0].note='concurrent metadata';
    const merged=model.mergeSettings(latest,original,draft);
    assert.equal(merged.error,'');assert.equal(merged.document.actions[4].children[0].note,'concurrent metadata');
    assert.equal(merged.document.diameter,480);assert.equal(merged.document.shape,'polygon');
});
test('undo history is bounded and snapshots do not alias earlier edits',()=>{
    const draft={actions:[{label:'first',children:[{label:'child'}]}],actionOrigins:[0],childOrigins:[[0]],selectedSlot:0};
    let stack=[];
    for(let i=0;i<45;i++){draft.actions[0].label=String(i);stack=history.remember(stack,draft);}
    assert.equal(stack.length,40);assert.equal(stack[0].actions[0].label,'5');
    draft.actions[0].children[0].label='changed';draft.childOrigins[0][0]=-1;
    assert.equal(stack.at(-1).actions[0].children[0].label,'child');assert.deepEqual(stack.at(-1).childOrigins,[[0]]);
});
