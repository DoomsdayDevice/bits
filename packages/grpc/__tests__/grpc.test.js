'use strict';

const grpc = require('..');
const assert = require('assert').strict;

assert.strictEqual(grpc(), 'Hello from grpc');
console.info('grpc tests passed');
