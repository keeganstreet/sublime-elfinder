/*
 * batch.js: Batch object responsible for abstracting vows tests
 *
 * (C) 2011 Nodejitsu Inc.
 * MIT LICENCE
 *
 */

var CLIEasy = require('../cli-easy'),
    assert = require('assert'),
    exec = require('child_process').exec;

//
// ### function Batch (suite)
// #### @suite {CLIeasy.Suite} Suite this instance belongs to
// Constructor function for the Batch object responsible for
// abstracting vows tests.
//
var Batch = exports.Batch = function Batch (suite) {
  this._suite = suite;

  //
  // Initialize instance properties
  //
  this._command = null;
  this._args = [];

  //
  // Create a batch history. This will allow us to
  // return to previous batch
  // on .undiscuss() call
  //
  this._rootBatch = this._batch = {};
  this._batchHistory = {
    current: this._batch,
    args: this._args
  };

  //
  // Save a reference for previous batchHistory state
  // so we can simply go back when `undiscuss` is called
  //
  this._batchHistory.previous = this._batchHistory;

  return this;
};

//
// ### function use (command)
// #### @command {string} Command to execute
// Setup CLI location and default arguments, (use `.arg()` for that).
//
Batch.prototype.use = function (command) {
  this._command = command;
  return this;
};

//
// ### function arg (arg)
// #### @arg {string} Argument to use in this batch
// Add argument to args hierarchy. Calling `.discuss()` will copy `args`
// to sub-batch. Calling `.undiscuss()` will return it to previous state
// (Even if it was changed with `.arg()` in sub-batch)
//
Batch.prototype.arg = function (arg) {
  if (typeof arg === 'string') {
    this._batchHistory.args.push(arg || '');
  }
  else if (Array.isArray(arg)) {
    this._batchHistory.args = this._batchHistory.args.concat(arg);
  }
  
  return this;
};

//
// ### function args (arg)
// #### @args {Array} Args to use in this batch.
// Set the entire args hierarchy. Calling `.discuss()` will copy `args`
// to sub-batch. Calling `.undiscuss()` will return it to previous state
// (Even if it was changed with `.arg()` in sub-batch)
//
Batch.prototype.args = function (args) {
  this._batchHistory.args = args;
  return this;
};



//
// ### function run (args, options)
// Add topic to current (or root) vow
//
Batch.prototype.run = function (args, options) {
  var cmd = this._command;

  //
  // Setup default options
  //
  options || (options = {});

  args = this._batchHistory.args.concat(args || '');

  this._batch.topic = function () {
    var callback = this.callback;

    //
    // Execute defined command with arguments and passed options
    //
    exec([cmd].concat(args).join(' '), onExec);

    //
    // Combine results in one object and pass them to callback
    // Add err to result, because we want it to be a part of
    // test assertions
    //
    function onExec (err, stdout, stderr) {
      callback(null, {
        err: err,
        stdout: stdout,
        stderr: stderr
      });
    };
  };

  return this;
};

//
// ### function discuss (test)
// #### @test {string} Text to add to this vows context
// Discusses the specified `text` by creating a new context
// in the vows structure.
//
Batch.prototype.discuss = function (text) {
  //
  // Create new batch history state
  // and a sub-section in `this._batch`
  // Copy args from parent
  //
  this._batchHistory = {
    current: this._batch = this._batch[text] || (this._batch[text] = {}),
    args: [].concat(this._batchHistory.args),
    previous: this._batchHistory
  };

  return this;
};

//
// ### function undiscuss ()
// Pop out from sub-batch to parent
// (Does nothing for root batch)
//
Batch.prototype.undiscuss = function () {
  this._batchHistory = this._batchHistory.previous;
  this._batch = this._batchHistory.current;
  return this;
};

//
// ### function next ()
// Add a batch to suite and return a new one
//
Batch.prototype.next = function () {
  return this._suite.next(this._rootBatch);
};

//
// ### function export (target)
// Export suite to the specified `target` object.
// (Vows .export() method wrapper)
//
Batch.prototype.export = function (target) {
  this._suite.next(this._rootBatch);
  this._suite.export(target);
};

//
// ### function expect (text, stdout, err)
// #### @text {string} Discussion text for the assertion function
// #### @stdout {string} Text to assert from the cli tool.
// #### @err {string} Assertion text to use
// Add test assertion with the specified `text`, `stdout`, and `err`.
//
Batch.prototype.expect = function (text, stdout, err) {
  //
  // In case std is:
  //
  // * String - Check if result is equal to std
  // * RegExp - Check if result.match(std) != null
  // * Function - call it and assert that return value will be true
  // * Other - Check if result is empty
  //
  function assertStd (result, std) {
    var message = 'Expected value to match following regexp: ' + std + ', but got: ' + result;

    if (typeof std === 'string' || typeof std === 'number') {
      assert.equal(result && result.code || result, std);
    }
    else if (std instanceof RegExp) {
      assert.isNotNull(result.match(std), message);
    }
    else if (typeof std === 'function') {
      assert.ok(std(result));
    }
    else if (typeof result !== 'string' && result !== null) {
      assert.equal(result.code, 0);
    }
  };

  this._batch[text] = function (result) {
    assertStd(result.stdout, stdout);
    assertStd(typeof err === 'number' ? result.err : result.stderr, err);
  };

  //
  // .run() will be called implicitly
  // if it wasn't called before
  //
  return this._batch.topic ? this : this.run();
};
