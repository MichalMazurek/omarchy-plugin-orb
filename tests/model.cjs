const assert = require('node:assert/strict');
const fs = require('node:fs');
const model = require('../Model.js');
const defaults = model.parse(fs.readFileSync(`${__dirname}/../config.example.json`, 'utf8'), null);
assert.equal(defaults.error, '');
assert.equal(defaults.config.actions.length, 6);
assert.equal(model.parse('{', defaults.config).config, defaults.config);
assert.ok(model.parse('{"actions":[]}', defaults.config).error);
const adversarial = JSON.parse(fs.readFileSync(`${__dirname}/../config.example.json`, 'utf8'));
adversarial.actions[0].command = ['sh', null];
assert.ok(model.parse(JSON.stringify(adversarial), defaults.config).error);
adversarial.actions[0].command = ['printf', '$(touch /tmp/no)'];
adversarial.actions[0].label = '<img src="x">';
assert.equal(model.parse(JSON.stringify(adversarial), defaults.config).config.actions[0].label, '<img src="x">');
for (const size of [340, 440, 600]) {
  assert.equal(model.hit(size / 2, size / 2, size), -1);
  assert.equal(model.hit(-10, -10, size), -1);
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 - 90) * Math.PI / 180;
    assert.equal(model.hit(size/2 + Math.cos(angle)*size*.33, size/2 + Math.sin(angle)*size*.33, size), i);
  }
}
// Corners, off-screen cursor, bars on each edge, logical fractional-scale dimensions.
for (const [w,h] of [[1920,1200],[1280,800],[800,600]]) {
  for (const reserved of [[0,30,0,0],[55,0,0,0],[0,0,60,45]]) {
    for (const [x,y] of [[0,0],[w,0],[0,h],[w,h],[-100,-100],[w/2,h/2]]) {
      const p = model.placement(x,y,w,h,reserved,440);
      assert.ok(p.x >= reserved[0]); assert.ok(p.y >= reserved[1]);
      assert.ok(p.x+p.size <= w-reserved[2]);
      assert.ok(p.y+p.size+38 <= h-reserved[3]);
    }
  }
}
console.log('PASS: six sectors, dead zone, config validation, all edges and reserved bounds');
