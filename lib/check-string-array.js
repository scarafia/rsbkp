'use strict';

var chkStr = require('./check-string');

exports = module.exports = function(data, key, msg) {
  key = key || 'key';
  msg = msg || `${key} must be a string or an array of strings`;

  data = data || [];

  if (Array.isArray(data)) {
    for (let el of data) chkStr(el, null, msg);
  } else if ('string' === typeof data) {
    data = [data];
  } else throw new Error(msg);

  return data.filter(el=>(el!==null));
};
