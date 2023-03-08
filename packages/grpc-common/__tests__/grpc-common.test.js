'use strict';

const grpcCommon = require('..');
const assert = require('assert').strict;

assert.strictEqual(grpcCommon(), 'Hello from grpcCommon');
console.info('grpcCommon tests passed');
