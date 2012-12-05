# DOM to Source

This module wraps around Cheerio and magically calculates the line and column number where DOM elements appear in the HTML source code.

## Usage

```js
var fs = require('fs'),
  domtosource = require('domtosource'),
  doc = fs.readFileSync('file.html', 'utf8'),
  results = domtosource.find(doc, '.green', true);
```

## Inputs

In the usage example above, you can see that domtosource.find() takes three parameters.

1) The HTML source code to search in

2) The CSS selector to search for

3) true if you want to calculate the line and column numbers

## Return values

DomToSource returns an array containing the elements that matched your selector, and their line and column numbers in the HTML source:

```js
[
  {
    el: { '0': [Object], length: 1 },
    html: '<li class="green">Green <span class="green">test</span></li>',
    line: 12,
    column: 5,
    calculationMethod: 'methodA'
  },
  {
  	el: { '0': [Object], length: 1 },
    html: '<span class="green">test</span>',
    line: 12,
    column: 29,
    calculationMethod: 'methodA'
  },
  {
  	el: { '0': [Object], length: 1 },
    html: '<li class="green">Green</li>',
    line: 16,
    column: 5,
    calculationMethod: 'methodB'
 	},
  {
  	el: { '0': [Object], length: 1 },
    html: '<li class="green">Green</li>',
    line: 17,
    column: 5,
    calculationMethod: 'methodB'
  }
]
```

The calculation method return value indicates which method was used to calculate the line and column number. This is used for unit test purposes because some methods are faster than others, but only work in certain situations. It is not something you need to worry about as a user.
