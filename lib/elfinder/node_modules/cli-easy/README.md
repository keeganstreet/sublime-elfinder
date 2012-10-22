# CLIeasy 

A fluent (i.e. chainable) syntax for generating vows tests for CLI applications.

## Purpose
CLIeasy is designed to be a simple way to test CLI applications in [node.js][0] and Javascript. The primary design goal was to reduce the number of lines of test code required to fully cover all primary and edge use cases of a given CLI application. 

## Getting Started
If you're going to use CLIeasy (and I hope you do), it's worth taking a moment to understand the way that [vows][1] manages flow control. Read up here on [vowsjs.org][2] (Under "Structure of a test suite"), or just remember vows uses this grammatical structure:

```
  Suite   → Batch*
  Batch   → Context*
  Context → Topic? Vow* Context*
```

Got it? Good. There is a 1-to-1 relationship between a CLIeasy suite and a vows suite; CLIeasy is essentially a simpler syntax to manage a particular set of vows-based tests that conform to this pattern:

1. Tests are performed by starting a CLI application 
2. Assertions are made against the `stdout` and `stderr` output.
3. Rinse. Repeat.

Here's a sample of the boilerplate code that CLIeasy eliminates:

``` js
  var exec = require('child_process').exec,
      vows = require('vows'),
      assert = require('assert');
  
  vows.describe('uname').addBatch({
    "When using uname": {
      "calling without arguments": {
        topic: function () {
          exec('uname', this.callback);
        },
        "should return `Linux`": function (err, stdout, stderr) {
          assert.match(stdout, /Linux/);
        }
      }
    }
  }).export(module);
```

This same code can be implemented like this using CLIeasy:

``` js
  var CLIeasy = require('cli-easy'),
      assert = require('assert');
      
  CLIeasy.describe('uname');
    .use('uname')
    .discuss('when using uname')
    .discuss('calling without arguments')
      .expect('should return Linux', 'Linux\n')
    .export(module);
```

<a name="using-cli-easy">
## Using CLIeasy in your own project
There are two ways to use CLIeasy in your own project:

1. Using npm
2. Using vows directly

### Using CLIeasy with npm
If you've used the `npm test` command in [npm][5] before, this should be nothing new. You can read more about the [npm test command here][6]. All you need to do is add the following to your `package.json` file:

``` js
 {
   "dependencies": {
     "cli-easy": "0.1.x"
   },
   "scripts": {
     "test": "vows test/*-test.js"
   }
 }
```

**Note:** `test/*-test.js` is at your discretion. It's just an expression for all test files in your project. 

After adding this to your `package.json` file you can run the following to execute your tests:

``` bash
  $ cd path/to/your/project
  $ npm install
  $ npm test
```

### Using CLIeasy with vows
When you install CLIeasy or take it as a dependency in your `package.json` file it will not install [vows][5] globally, so to use vows you must install it globally.

``` bash
  $ [sudo] npm install vows -g
```

After installing vows you can simply run it from inside your project:

``` bash
  $ cd /path/to/your/project
  $ vows
```

## Installation

### Installing npm (node package manager)

``` bash
  $ curl http://npmjs.org/install.sh | sh
```

### Installing CLIeasy

``` bash
  $ [sudo] npm install cli-easy
```

## Run Tests
Tests are written in vows and give complete coverage of all APIs and storage engines.

``` bash
  $ npm test
```

## Roadmap

1. [Get feedback][6] on what else could be exposed through this library.
2. Improve it.
3. Repeat (1) + (2).

#### Authors: [Fedor Indutny](http://nodejitsu.com), [Charlie Robbins](http://nodejitsu.com)
#### License: MIT

[0]: http://nodejs.org
[1]: http://indexzero.github.com/cli-easy
[2]: http://vowsjs.org
[7]: http://npmjs.org
[8]: https://github.com/isaacs/npm/blob/master/doc/test.md
[6]: http://github.com/flatiron/cli-easy/issues
