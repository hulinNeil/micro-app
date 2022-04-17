const parserKml = require('./template-parser.js');

module.exports = function (source) {
  const code = parserKml(source);
  return code;
};
