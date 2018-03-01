'use strict';

var EndPoint = require('./end-point');
var DateFormats = require('./date-formats');
var chkStrArray = require('./check-string-array');
var chkStr = require('./check-string');

exports = module.exports = Task;

function Task(tpl) {
  var self = this;
  if (!(this instanceof Task)) {
    return new Task(tpl);
  }
  
  tpl = tpl || {};
  
  this.src = new EndPoint(tpl.src);
  this.dest = new EndPoint(tpl.dest);
  
  this.include = chkStrArray(tpl.include);
  this.exclude = chkStrArray(tpl.exclude);
  this.flags = chkStrArray(tpl.flags);
  this.options = chkStrArray(tpl.options);
  
  var dateFormats = new DateFormats(tpl.dateFormats);
  function getDateFormat() {
    return dateFormats.node ? dateFormats.node : '';
  }
  function setDateFormat(format) {
    dateFormats.node = chkStr(format);
  }
  Object.defineProperties(this, {
    dateFormat: {enumerable: true, get: getDateFormat, set: setDateFormat},
    dateFormats: {enumerable: false, get: ()=>dateFormats}
  });
}

Task.prototype.export = function() {
  return {
    src: this.src,
    dest: this.dest,
    include: this.include,
    exclude: this.exclude,
    flags: this.flags,
    options: this.options
  };
};

Task.prototype.inspect = function(depth, options) {
  var task = this.export();
  task.dateFormat = this.dateFormat;
  return task;
};

Task.prototype.toJSON = function() {
  var json = this.export();
  json.dateFormats = this.dateFormats;
  return json;
};
