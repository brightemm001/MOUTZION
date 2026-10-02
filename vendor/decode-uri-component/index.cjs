'use strict';
// query-string 7 requires a function. Upstream 0.5 is ESM; Metro and supported Node
// versions expose its default export here. Keep the actual patched implementation upstream.
const decoder = require('decode-uri-component-fixed');
module.exports = decoder.default || decoder;
