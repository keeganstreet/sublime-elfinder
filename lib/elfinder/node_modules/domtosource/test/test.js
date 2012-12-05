var fs = require('fs'),
	domtosource = require('../'),
	assert = require('assert');

describe('domtosource', function() {

	describe('Test bad inputs', function() {

		it ('should throw an error if the html is empty', function() {
			assert.throws(function() {
				var results = domtosource.find('', '.green', true);
			});
		});

		it ('should throw an error if the selector is empty', function() {
			assert.throws(function() {
				var doc = fs.readFileSync(__dirname + '/example-html/page1.html', 'utf8'),
				results = domtosource.find(doc, '', true);
			});
		});
	});

	describe('Test .green', function() {

		var doc = fs.readFileSync(__dirname + '/example-html/page1.html', 'utf8'),
			results = domtosource.find(doc, '.green', true);

		it ('should return 4 results', function() {
			assert.equal(4, results.length);
		});

		it ('should be able to use method A (the fast method) for unique elements', function() {
			assert.equal(results[0].calculationMethod, 'methodA');
			assert.equal(results[1].calculationMethod, 'methodA');
			assert.equal(results[2].calculationMethod, 'methodB');
			assert.equal(results[3].calculationMethod, 'methodB');
		});

		it ('should calculate line and column numbers correctly', function() {
			assert.equal(results[0].line, 12);
			assert.equal(results[1].line, 12);
			assert.equal(results[2].line, 16);
			assert.equal(results[3].line, 17);
			assert.equal(results[0].column, 5);
			assert.equal(results[1].column, 29);
			assert.equal(results[2].column, 5);
			assert.equal(results[3].column, 5);
		});
	});

	describe('Test a document with no line breaks', function() {
		var doc = fs.readFileSync(__dirname + '/example-html/page1-oneline.html', 'utf8'),
			results = domtosource.find(doc, '.green', true);

		it ('should return 4 results', function() {
			assert.equal(4, results.length);
		});

		it ('should be able to use method A (the fast method) for unique elements', function() {
			assert.equal(results[0].calculationMethod, 'methodA');
			assert.equal(results[1].calculationMethod, 'methodA');
			assert.equal(results[2].calculationMethod, 'methodB');
			assert.equal(results[3].calculationMethod, 'methodB');
		});

		it ('should calculate line and column numbers correctly', function() {
			assert.equal(results[0].line, 1);
			assert.equal(results[1].line, 1);
			assert.equal(results[2].line, 1);
			assert.equal(results[3].line, 1);
			assert.equal(results[0].column, 199);
			assert.equal(results[1].column, 223);
			assert.equal(results[2].column, 316);
			assert.equal(results[3].column, 348);
		});
	});

	describe('Test a large document', function() {
		var doc = fs.readFileSync(__dirname + '/example-html/theage.largepage', 'utf8'),
			results = domtosource.find(doc, 'p', true);

		it ('should return 473 results', function() {
			assert.equal(473, results.length);
		});
	});

	// Test method B and capitalised element names
	describe('Test a document with some capitalised element names', function() {
		var doc = fs.readFileSync(__dirname + '/example-html/page1-caps.html', 'utf8'),
			results = domtosource.find(doc, '.green', true);

		it ('should be able to use method A (the fast method) for unique elements', function() {
			assert.equal(results[0].calculationMethod, 'methodA');
			assert.equal(results[1].calculationMethod, 'methodA');
			assert.equal(results[2].calculationMethod, 'methodB');
			assert.equal(results[3].calculationMethod, 'methodB');
		});

		it ('should calculate line and column numbers correctly', function() {
			assert.equal(results[0].line, 12);
			assert.equal(results[1].line, 12);
			assert.equal(results[2].line, 16);
			assert.equal(results[3].line, 17);
			assert.equal(results[0].column, 5);
			assert.equal(results[1].column, 29);
			assert.equal(results[2].column, 5);
			assert.equal(results[3].column, 5);
		});

		it ('should return HTML for each result', function() {
			assert.equal(results[0].html, '<li class="green">Green <span class="green">test</span></li>');
			assert.equal(results[1].html, '<span class="green">test</span>');
			// KNOWN ERROR: LI is converted to li
			assert.equal(results[2].html, '<li class="green">Green</li>');
			assert.equal(results[3].html, '<li class="green">Green</li>');
		});
	});
});
