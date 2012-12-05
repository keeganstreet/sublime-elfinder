var fs = require('fs'),
	domtosource = require('../'),
	doc = fs.readFileSync(__dirname + '/example-html/page1.html', 'utf8'),
	results = domtosource.find(doc, '.green', true);

console.log(results);
