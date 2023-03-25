'use strict';

const spreadsheets = require('..');
const assert = require('assert').strict;

assert.strictEqual(spreadsheets(), 'Hello from spreadsheets');
console.info('spreadsheets tests passed');
