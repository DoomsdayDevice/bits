'use strict';

const eslintConfigCommon = require('..');
const assert = require('assert').strict;

assert.strictEqual(eslintConfigCommon(), 'Hello from eslintConfigCommon');
console.info('eslintConfigCommon tests passed');
