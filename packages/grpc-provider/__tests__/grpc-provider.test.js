'use strict';

const grpcProvider = require('..');
const assert = require('assert').strict;

assert.strictEqual(grpcProvider(), 'Hello from grpcProvider');
console.info('grpcProvider tests passed');
