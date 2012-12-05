/*globals require, process, console, exports */

(function () {

	'use strict';

	var cheerio = require('cheerio'),
		nodeIndexToCharIndex,
		charIndexToLocation,
		processElement,
		find;

	// Take a node type and the index of this node (e.g. this is the 5th <li> element) and return the character index of the node
	nodeIndexToCharIndex = function(html, nodeType, n) {
		var i, index = 0;
		nodeType = '<' + nodeType;
		for (i = 0; i <= n; i += 1) {
			index = html.indexOf(nodeType, index + 1);
		}
		return index;
	};

	// Take a string index as input and return the line and column number
	charIndexToLocation = function(html, index, method) {
		var substr = html.substr(0, index),
			lastLineBreak = substr.lastIndexOf('\n') || '',
			lineNumber = (substr.match(/\n/g)||[]).length + 1,
			columnNumber = index - lastLineBreak;
		return [lineNumber, columnNumber, method];
	};

	// Calculate the location of an individual element
	processElement = function($, html, htmlLowerCase, $match, matchHtml) {
		var matchHtmlLen = matchHtml.length,
			charIndex,
			nodeType,
			$similarElements,
			n, len;

		// Method A
		// This method is very fast but only works if the element is unique

		// Find where matchHtml appears in the document
		charIndex = html.indexOf(matchHtml);
		if (charIndex > -1) {
			// If this was the only occurrence, we have the location
			if (html.indexOf(matchHtml, charIndex + matchHtmlLen) === -1) {
				return charIndexToLocation(html, charIndex, 'methodA');
			}
		}

		// Method B
		// This method is slower but will work in all cases

		// Get the elements of this type
		nodeType = $match['0'].name;
		$similarElements = $(nodeType);
		for (n = 0, len = $similarElements.length; n < len; n += 1) {
			if ($match['0'] == $similarElements.eq(n)['0']) {
				// This is the nth element of type nodeType in the document
				charIndex = nodeIndexToCharIndex(htmlLowerCase, nodeType, n);
				return charIndexToLocation(htmlLowerCase, charIndex, 'methodB');
			}
		}

		throw new Error('Unable to calculate the line number for an element of type ' + nodeType);
	};

	// The exported module
	find = function(html, selector, calculateLinesAndColumns) {

		if (!html || !selector) {
			throw new Error('The html and selector parameters are required');
		}

		var $ = cheerio.load(html, {lowerCaseTags: true}),
			$matches = $(selector),
			htmlLowerCase = html.toLowerCase(),
			results = [],
			i, len, $match, matchHtml, location;

		for (i = 0, len = $matches.length; i < len; i += 1) {
			$match = $matches.eq(i);
			matchHtml = $.html($match);
			results[i] = {
				el: $match,
				html: matchHtml
			};
			if (calculateLinesAndColumns) {
				location = processElement($, html, htmlLowerCase, $match, matchHtml);
				results[i].line = location[0];
				results[i].column = location[1];
				results[i].calculationMethod = location[2];
			}
		}

		return results;
	};

	// Export for Node JS
	if (typeof exports !== 'undefined') {
		exports.find = find;
	}

}());
