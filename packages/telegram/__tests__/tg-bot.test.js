'use strict';

const tgBot = require('..');
const assert = require('assert').strict;

assert.strictEqual(tgBot(), 'Hello from tgBot');
console.info('tgBot tests passed');
