'use strict';

const s3 = require('..');
const assert = require('assert').strict;

assert.strictEqual(s3(), 'Hello from s3');
console.info('s3 tests passed');
