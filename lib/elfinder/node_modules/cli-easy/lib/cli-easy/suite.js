/*
 * suite.js: Test suite for multiple batches of CLI tests
 * 
 * (C) 2011 Nodejitsu Inc.
 * MIT LICENCE
 *
 */

var vows = require('vows'),
    CLIeasy = require('../cli-easy');

var core = exports;

//
// ### function Suite (text)
// #### @text {string} Text to describe this instance.
// Constructor function for the Suite responsible for 
// coalescing multiple batches.
//
var Suite = core.Suite = function Suite (text) {
  //
  // Store cliPath for later usage
  //
  this.suite = vows.describe(text);

  //
  // A batches array
  //
  this.batches = [];

  return new CLIeasy.Batch(this);
};

//
// ### function next (batch)
// Adds a new batch to this suite to be run sequentially.
//
Suite.prototype.next = function(batch) {
  this.batches.push(batch);
  this.suite.addBatch(batch);
  return new CLIeasy.Batch(this);
};

//
// ### function export (target)
// Exports the underlying vows suite to the `target` object.
//
Suite.prototype.export = function (target) {
  this.suite.export(target);
};
