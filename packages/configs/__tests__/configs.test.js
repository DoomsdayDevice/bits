'use strict';

const configs = require('..');
const assert = require('assert').strict;

assert.strictEqual(configs(), 'Hello from configs');
console.info('configs tests passed');
