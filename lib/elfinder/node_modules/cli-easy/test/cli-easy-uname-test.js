/*
 * cli-easy-uname-test.js: Sample tests for the `uname` command
 * 
 * (C) 2011 Nodejitsu Inc.
 * MIT LICENCE
 *
 */
 
var CLIEasy = require('../lib/cli-easy');

CLIEasy.describe('uname test')
       .use('uname')
       .discuss('calling without arguments')
         .expect('should return Linux', 'Linux\n')
       .undiscuss()
       .discuss('calling with -p')
         .arg('-p')
         .expect('should return current arch type', /x86_64/)
       .undiscuss()
       .discuss('calling with -r')
         .arg('-r')
         .expect('should return kernel version', function(version) {
           var re = /^(\d+)\.(\d+)\.(\d+)\-(\d+)-([^\d]+)\n$/,
               match = version.match(re);
           if (match === null) return false;
           if (parseInt(match[1]) < 2) return false;
           return true;
         })
       .undiscuss()
       .discuss('calling with wrong arguments')
         .arg('-wrong-arg')
         .run('-another-wrong-arg')
         .expect('should exit with code = 1', null, 1)
         .expect('should write to stderr', null, /invalid option/)
       .undiscuss()
       .export(module);
