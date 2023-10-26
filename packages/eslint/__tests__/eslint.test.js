'use strict';

const eslint = require('..');
const assert = require('assert').strict;

assert.strictEqual(eslint(), 'Hello from eslint');
console.info('eslint tests passed');
