'use strict';

const openai = require('..');
const assert = require('assert').strict;

assert.strictEqual(openai(), 'Hello from openai');
console.info('openai tests passed');
