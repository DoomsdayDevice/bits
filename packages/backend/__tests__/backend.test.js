'use strict';

const backend = require('..');
const assert = require('assert').strict;

assert.strictEqual(backend(), 'Hello from backend');
console.info('backend tests passed');
