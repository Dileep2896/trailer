import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { SCHEMA_FILE, schemaText } from '../scripts/gen-schema.mjs';
import { ENGINE } from '../scripts/runtime.mjs';
import { LEGACY_KEYS, validate } from '../scripts/lib.mjs';
import { normalizeConfig } from '../src/config.mjs';

const require = createRequire(join(ENGINE, 'package.json'));
const Ajv2020 = require('ajv/dist/2020').default;
const schema = JSON.parse(readFileSync(SCHEMA_FILE, 'utf8'));
const check = new Ajv2020({ allErrors: true, strict: false, allowUnionTypes: true }).compile(schema);
const clean = (c) => Object.fromEntries(Object.entries(c).filter(([k]) => !LEGACY_KEYS.includes(k)));
const FIX = resolve(ENGINE, 'test', 'fixtures');
const read = (f) => JSON.parse(readFileSync(f, 'utf8'));

test('the committed schema matches gen-schema output', () => {
  assert.equal(readFileSync(SCHEMA_FILE, 'utf8'), schemaText(), 'run: node engine/scripts/gen-schema.mjs');
});

const good = [resolve(ENGINE, '..', 'examples', 'driftcheck', '.trailer', 'trailer.config.json'), ...readdirSync(FIX).filter((f) => f.startsWith('good-')).map((f) => join(FIX, f)), ...readdirSync(resolve(ENGINE, 'templates')).map((f) => join(ENGINE, 'templates', f))];

for (const f of good) {
  test(`valid: ${f.slice(resolve(ENGINE, '..').length + 1)}`, () => {
    const c = read(f);
    assert.equal(check(clean(c)), true, JSON.stringify(check.errors?.slice(0, 5)));
    for (const cut of [null, ...Object.keys(c.cuts ?? {})]) {
      const n = normalizeConfig(c, cut ? { cut } : {});
      assert.deepEqual(validate(n, c).errors, [], `cut ${cut}`);
    }
  });
}

for (const f of readdirSync(FIX).filter((x) => x.startsWith('bad-'))) {
  test(`invalid: ${f}`, () => {
    const c = read(join(FIX, f));
    const field = c.$expect;
    delete c.$expect;
    assert.equal(check(clean(c)), false);
    assert.ok(check.errors.some((e) => `${e.instancePath} ${JSON.stringify(e.params)}`.includes(field)), `schema should flag ${field}: ${JSON.stringify(check.errors)}`);
    let n;
    try {
      n = normalizeConfig(c);
    } catch (e) {
      assert.ok(String(e.message).includes(field.split('/').pop()));
      return;
    }
    assert.ok(validate(n, c).errors.some((e) => e.includes(field.split('/').pop())), `validate should flag ${field}`);
  });
}
