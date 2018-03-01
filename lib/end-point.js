'use strict';

var chkStr = require('./check-string');

exports = module.exports = EndPoint;

function EndPoint(tpl) {
  var self = this;
  if (!(this instanceof EndPoint)) {
    return new EndPoint();
  }
  
  var Host;
  function getHost() {
    return Host;
  }
  function setHost(host) {
    Host = chkStr(host, 'host');
  }
  
  var Usr = '';
  function getUsr() {
    return Usr;
  }
  function setUsr(usr) {
    Usr = chkStr(usr, 'usr');
  }
  
  var Path = '';
  function getPath() {
    return Path;
  }
  function setPath(path) {
    Path = chkStr(path, 'path');
  }
  
  Object.defineProperties(this, {
    host: {enumerable: true, get: getHost, set: setHost},
    usr: {enumerable: true, get: getUsr, set: setUsr},
    path: {enumerable: true, get: getPath, set: setPath}
  });
  
  // initialize
  tpl = tpl || {};
  this.host = tpl.host;
  this.usr = tpl.usr;
  this.path = tpl.path;
}

EndPoint.prototype.export = function() {
  return {
    host: this.host,
    usr: this.usr,
    path: this.path
  };
};

EndPoint.prototype.inspect = function(depth, options) {
  return this.export();
};

EndPoint.prototype.toJSON = function() {
  return this.export();
};
