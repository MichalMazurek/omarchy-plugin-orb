import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

// Exercise the installer's actual file-write/reload transaction without running
// the plugin manager or touching the current user's desktop configuration.
const installer = fs.readFileSync(new URL('../install', import.meta.url), 'utf8');
const start = installer.indexOf('backup=$(mktemp -d ');
assert.ok(start >= 0, 'Installer transaction must be present');
const transaction = installer.slice(start);
const setup = `
config_dir=$ORB_TEST_CONFIG
config="$config_dir/omarchy/orb.json"
bindings="$config_dir/hypr/bindings.lua"
module="$config_dir/hypr/orb.lua"
id=io.github.tcballard.orb
canonical='SUPER + ALT + O'
desktop_click=false
`;

for (const failure of ['configerrors', 'reload', 'query', 'none']) {
  for (const previous of [[], ['bindings.lua'], ['orb.lua'], ['bindings.lua', 'orb.lua']]) {
    test(`${failure === 'none' ? 'successful install' : failure + ' failure'}; previous files: ${previous.join(', ') || 'none'}`, () => {
      const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'orb-rollback-'));
      try {
        const config = path.join(fixture, 'config'), hypr = path.join(config, 'hypr');
        const bin = path.join(fixture, 'bin');
        fs.mkdirSync(hypr, {recursive:true}); fs.mkdirSync(bin);
        const originals = new Map(previous.map(file => [file,
          file === 'orb.lua' ? '-- Orb shortcut wheel: managed by omarchy-plugin-orb/install\n-- original module\n'
            : '-- user binding\nrequire("orb") -- Orb shortcut wheel\n']));
        for (const [file, content] of originals) {
          fs.writeFileSync(path.join(hypr, file), content, {mode:0o640});
        }
        fs.writeFileSync(path.join(hypr, 'unrelated.lua'), '-- leave alone\n');
        fs.writeFileSync(path.join(bin, 'hyprctl'), `#!/bin/bash
case "$1" in
  reload)
    if [[ ! -e "$ORB_TEST_CONFIG/reloaded" ]]; then
      touch "$ORB_TEST_CONFIG/reloaded"
      [[ $ORB_TEST_FAILURE != reload ]] || exit 1
    else
      touch "$ORB_TEST_CONFIG/rollback-reloaded"
    fi
    ;;
  configerrors)
    [[ $ORB_TEST_FAILURE != query ]] || exit 1
    [[ $ORB_TEST_FAILURE != configerrors ]] || echo 'Fixture: invalid Orb binding'
    ;;
  *) exit 2 ;;
esac
exit 0
`, {mode:0o755});
        const result = spawnSync('bash', ['-euo', 'pipefail', '-c', setup + transaction], {
          encoding:'utf8', timeout:10000,
          env:{...process.env, PATH:bin + path.delimiter + process.env.PATH,
            ORB_TEST_CONFIG:config, ORB_TEST_FAILURE:failure}
        });
        assert.ifError(result.error);
        assert.equal(fs.readFileSync(path.join(hypr, 'unrelated.lua'), 'utf8'), '-- leave alone\n');
        if (failure === 'none') {
          assert.equal(result.status, 0, result.stderr);
          assert.match(result.stdout, /Orb installed/);
          assert.match(fs.readFileSync(path.join(hypr, 'orb.lua'), 'utf8'), /o\.bind\(/);
          const bindings = fs.readFileSync(path.join(hypr, 'bindings.lua'), 'utf8');
          assert.equal(bindings.split('require("orb") -- Orb shortcut wheel').length - 1, 1);
          assert.equal(fs.existsSync(path.join(config, 'rollback-reloaded')), false);
          return;
        }
        assert.equal(result.status, 1, result.stderr);
        assert.match(result.stderr, /Shortcut installation failed:/);
        for (const file of ['bindings.lua', 'orb.lua']) {
          const destination = path.join(hypr, file);
          if (originals.has(file)) {
            assert.equal(fs.readFileSync(destination, 'utf8'), originals.get(file));
            assert.equal(fs.statSync(destination).mode & 0o777, 0o640);
          } else assert.equal(fs.existsSync(destination), false, `${file} must be removed`);
        }
        assert.ok(fs.existsSync(path.join(config, 'rollback-reloaded')));
      } finally {
        fs.rmSync(fixture, {recursive:true, force:true});
      }
    });
  }
}
