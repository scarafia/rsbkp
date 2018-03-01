'use strict';

var chkStr = require('./check-string');

exports = module.exports = DateFormats;

function DateFormats(tpl) {
  var self = this;
  if (!(this instanceof DateFormats)) {
    return new DateFormats(tpl);
  }
  
  //this.node = '';
  
  var msg = 'wrong date format';
  
  tpl = tpl || '';
  switch (typeof tpl) {
    case 'object':
      for (let key in tpl) {
        this[key] = chkStr(tpl[key], null, msg);
      }
      break;
    case 'string':
      this.node = tpl;
      break;
    default:
      throw new Error(msg);
  }
}
