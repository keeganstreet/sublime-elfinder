/*
 * cli-easy: Chainable syntax for generating CLI vows test suites
 * 
 * (C) 2011 Nodejitsu Inc.
 * MIT LICENCE
 *
 */

var CLIeasy = exports;

//
// ### Export core components of `CLIeasy`.
//
CLIeasy.Batch = require('./cli-easy/batch').Batch;
CLIeasy.Suite = require('./cli-easy/suite').Suite;

//
// ### function describe (text) 
// #### @text {string} Text to describe the suite returned
// Creates a new Suite for the specified `text`.
//
CLIeasy.describe = function describe (text) {
  return new CLIeasy.Suite(text);
};