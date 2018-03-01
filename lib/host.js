'use strict';

var chkStr = require('./check-string');

exports = module.exports = Host;

function Host(tpl) {
  var self = this;
  if (!(this instanceof Host)) {
    return new Host(tpl);
  }
  
  tpl = tpl || {};
  
  this.bkpRoot = chkStr(tpl.bkpRoot);
}

Host.prototype.export = function() {
  return {
    bkpRoot: this.bkpRoot
  };
};

Host.prototype.inspect = function(depth, options) {
  return this.export();
};

Host.prototype.toJSON = function() {
  return this.export();
};
