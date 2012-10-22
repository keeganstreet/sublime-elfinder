/*
 * cli-easy-test.js: Core tests for the cli-easy module
 * 
 * (C) 2011 Nodejitsu Inc.
 * MIT LICENCE
 *
 */
 
var vows = require('vows'),
    assert = require('assert');

var CLIeasy = require('../lib/cli-easy');

vows.describe('Cli-easy').addBatch({
  'CLIeasy.describe()': {
    topic: function() {
      return CLIeasy.describe('node');
    },
    'should return': {
      'CLIeasy.Batch instance': function(Batch) {
        assert.instanceOf(Batch, CLIeasy.Batch);
      },
      'object with property suite': {
        topic: function(Batch) {
          return Batch._suite;
        },
        'which is instance of CLIeasy.Suite': function(Suite) {
          assert.instanceOf(Suite, CLIeasy.Suite);
        }
      }
    }
  }
}).export(module);
