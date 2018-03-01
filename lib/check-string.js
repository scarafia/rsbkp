'use strict';

exports = module.exports = function(str, key, msg) {
  key = key || 'key';
  msg = msg || `${key} must be a string`;
  
  str = str || '';
  if ('string' !== typeof str) throw new Error(msg);
  
  return str;
};
