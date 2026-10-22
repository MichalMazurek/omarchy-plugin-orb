const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const model=require('../Model.js'),base=JSON.parse(fs.readFileSync(require('node:path').resolve(__dirname,'../config.example.json')));
const clone=value=>JSON.parse(JSON.stringify(value));
test('circle is compatible with existing settings; polygon edits persist and validate',()=>{
    const legacy=clone(base);delete legacy.shape;
    const original=model.parse(JSON.stringify(legacy),null).config;assert.equal(original.shape,'circle');
    const draft=clone(original);draft.shape='polygon';
    const result=model.mergeSettings(legacy,original,draft);assert.equal(result.error,'');assert.equal(result.document.shape,'polygon');
    assert.equal(model.mergeSettings(legacy,original,original).document.shape,undefined);
    const polygon=model.parse(JSON.stringify(result.document),null).config;
    const reverse=clone(polygon);reverse.shape='circle';assert.equal(model.mergeSettings(result.document,polygon,reverse).document.shape,'circle');
    // A third supported value is not needed to exercise concurrency: the current
    // value may already match the requested edit, which is safe to keep.
    assert.equal(model.mergeSettings(result.document,original,draft).error,'');
    for(const shape of ['triangle','square','',null,5,true]){const invalid={...base,shape};assert.ok(model.parse(JSON.stringify(invalid),null).error);}
    for(const count of [5,6,7,8]){const value=clone(base);while(value.actions.length<count)value.actions.push(clone(value.actions[0]));value.actions.length=count;value.shape='polygon';assert.equal(model.parse(JSON.stringify(value),null).error,'');}
    for(const count of [4,9]){const value=clone(base);while(value.actions.length<count)value.actions.push(clone(value.actions[0]));value.actions.length=count;assert.ok(model.parse(JSON.stringify(value),null).error);}
});
test('polygon hit areas agree with an independent convex-polygon check, preserving the circular centre',()=>{
    const diameter=400,center=diameter/2;
    for(const count of [3,4,5,6,7,8]){
        const vertices=Array.from({length:count},(_,i)=>{const a=i*2*Math.PI/count-Math.PI/2;return [center+Math.cos(a)*diameter*.48,center+Math.sin(a)*diameter*.48];});
        const inside=(x,y)=>vertices.every((v,i)=>{const next=vertices[(i+1)%count];return (next[0]-v[0])*(y-v[1])-(next[1]-v[1])*(x-v[0])>=-1e-6;});
        for(let x=2;x<diameter;x+=7)for(let y=3;y<diameter;y+=7){
            const active=inside(x,y)&&Math.hypot(x-center,y-center)>=diameter*.18;
            assert.equal(model.hit(x,y,diameter,count,'polygon')>=0,active,`${count} sides at ${x},${y}`);
        }
        for(let i=0;i<count;i++){
            const angle=i*2*Math.PI/count-Math.PI/2;
            assert.equal(model.hit(center+Math.cos(angle)*diameter*.33,center+Math.sin(angle)*diameter*.33,diameter,count,'polygon'),i);
            assert.equal(model.hit(center+Math.cos(angle)*diameter*.17,center+Math.sin(angle)*diameter*.17,diameter,count,'polygon'),-1);
        }
    }
    // The region outside a pentagon edge still belongs to the circular wheel.
    const angle=-Math.PI/2+Math.PI/5,x=center+Math.cos(angle)*diameter*.46,y=center+Math.sin(angle)*diameter*.46;
    assert.equal(model.hit(x,y,diameter,5,'polygon'),-1);assert.ok(model.hit(x,y,diameter,5,'circle')>=0);
    for(const count of [1,2])for(let a=0;a<360;a+=10){const angle=a*Math.PI/180;assert.equal(model.hit(center+Math.cos(angle)*180,center+Math.sin(angle)*180,diameter,count,'polygon'),model.hit(center+Math.cos(angle)*180,center+Math.sin(angle)*180,diameter,count,'circle'));}
});
