'use strict';

const typeormProvider = require('..');
const assert = require('assert').strict;

assert.strictEqual(typeormProvider(), 'Hello from typeormProvider');
console.info('typeormProvider tests passed');
