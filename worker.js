const htmlparser2 = require('htmlparser2');
const { DomHandler } = require('domhandler');

var htmlString = `xxxxx`;

const addNode = DomHandler.prototype.addNode;
DomHandler.prototype.addNode = function (node) {
  node.__custom__ = 'test';
  addNode.call(this, node);
};
var handler = new DomHandler(undefined, {});
new htmlparser2.Parser(handler, {}).end(htmlString);
console.log(handler.root.children);
