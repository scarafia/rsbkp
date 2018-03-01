'use strict';

/**
 * Module dependencies.
 */

var Collection = require('./lib/collection');
var Host = require('./lib/host');
var Task = require('./lib/task');
var chkStr = require('./lib/check-string');

var fs = require('fs');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
//var Rsync = require('rsync');

/**
 * Expose Rsbkp().
 */
exports = module.exports = Rsbkp;

function Rsbkp(settings) {
  var self = this;
  if (!(this instanceof Rsbkp)) {
    return new Rsbkp(settings);
  }
  EventEmitter.call(this);
  
  // ---------------------------------------------------------------------------
  // settings
  // ---------------------------------------------------------------------------
  settings = settings || {};
  var rsbkpDir = settings.rsbkpDir || process.env.HOME + '/.rsbkp';
  var cfgFile = settings.cfgFile || 'config.json';
  var cfgPath = rsbkpDir + '/' + cfgFile;
  var initialized = false;
  
  // ---------------------------------------------------------------------------
  // collections
  // ---------------------------------------------------------------------------
  var hosts = new Collection(), hostTpl = {
    bkpRoot: ''
  };
  var tasks = new Collection(), taskTpl = {
    src: {host: '', usr: '', path: ''},
    dest: {host: '', usr: '', path: ''},
    include: [],
    exclude: [],
    flags: [],
    options: [],
    dateFormats: {}
  };
  var profiles = new Collection(), profileTpl = {};
  
  // ---------------------------------------------------------------------------
  // properties & methods
  // ---------------------------------------------------------------------------
  var Saved = true;
  function getSaved() {
    return Saved;
  }
  
  var AutoSave;
  function getAutoSave() {
    return AutoSave;
  }
  function setAutoSave(autoSave) {
    if ('boolean' !== typeof autoSave) throw new Error('autoSave must be boolean');
    AutoSave = autoSave;
    if (AutoSave && !Saved) this.save();
  }
  
  var DefaultDateFormat;
  function getDefaultDateFormat() {
    return DefaultDateFormat;
  };
  function setDefaultDateFormat(dateFormat) {
    DefaultDateFormat = taskTpl.dateFormats.node = chkStr(dateFormat, 'dateFormat');
  };
  
  Object.defineProperties(this, {
    saved: {enumerable: true, get: getSaved},
    autoSave: {enumerable: true, get: getAutoSave, set: setAutoSave},
    defaultDateFormat: {enumerable: true, get: getDefaultDateFormat, set: setDefaultDateFormat}
  });
  
  var toDelete = {
    data: [],
    add: function(dir) {
      this.data.push(dir);
    },
    run: function() {
      for (let dir of this.data) {
        if (fs.existsSync(dir)) fs.rmdirSync(dir);
      }
    }
  };
  var save = function(emit=true) {
    toDelete.run();
    let cfg = { hosts: hosts, tasks: tasks, profiles: profiles };
    fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
    Saved = true;
    if (emit) self.emit('saved');
  };
  this.save = function() {
    return new Promise(function(resolve, reject) {
      if (!initialized) {
        reject(new Error('rsbkp not properly initialized; will not save.'));
        return;
      }
      save();
      resolve(true);
    });
  };
  
  this.on('changed', function() {
    Saved = false;
    if (AutoSave) save();
  });
  
  // ---------------------------------------------------------------------------
  // init
  // ---------------------------------------------------------------------------
  this.init = function() {
    return new Promise(function(resolve, reject) {
      if (initialized) {
        reject(new Error('rsbkp already initialized'));
        return;
      };
      if (!fs.existsSync(rsbkpDir)) {
        fs.mkdirSync(rsbkpDir, 0o0700);
      }
      if (fs.existsSync(cfgPath)) {
        let cfg = JSON.parse(fs.readFileSync(cfgPath));
        
        let h = {}; for (let name in cfg.hosts) h[name] = new Host(cfg.hosts[name]);
        let t = {}; for (let name in cfg.tasks) t[name] = new Task(cfg.tasks[name]);
        //let p = {}; for (let name in cfg.profiles) p[name] = new Profile(cfg.profiles[name]);
        let p = {}; for (let name in cfg.profiles) p[name] = cfg.profiles[name];
        
        hosts.addMany(h).then(function() {
          return tasks.addMany(t);
        }).then(function() {
          return profiles.addMany(p);
        }).catch(function(error) {
          reject(error);
        });
      } else {
        save(false);
      }

      self.autoSave = true;
      self.defaultDateFormat = 'YYYY-MM-DD HH:mm:ss'; //'Y-m-d H:i:s' for php;
      
      initialized = true;
      resolve(initialized);
    });
  };
  // ---------------------------------------------------------------------------
  
  // ===========================================================================
  // helpers
  // ===========================================================================
  
  // ===========================================================================
  // hosts
  // ===========================================================================
  this.getHosts = function() {
    return hosts.data;
  };
  
  this.getHostNames = function() {
    return hosts.names;
  };
  
  this.getHostCount = function() {
    return hosts.length;
  };
  
  this.getHost = function(ref) {
    return new Promise(function(resolve, reject) {
      hosts.get(ref).then(function(host) {
        host.data = new Host(host.data);
        resolve(host);
      }).catch(function(error) {
        reject(error);
      });
    });
  };
  
  this.removeHost = function(ref) {
    return new Promise(function(resolve, reject) {
      hosts.remove(ref).then(function(host) {
        self.emit('changed');
        self.emit('hostRemoved', host);
        resolve(host);
      }).catch(function(error) {
        reject(error);
      });
    });
  };
  
  this.setHost = function(name, data, index) {
    return new Promise(function(resolve, reject) {
      hosts.add(name, new Host(data), index).then(function(host) {
        host.data = new Host(host.data);
        self.emit('changed');
        self.emit('hostSet', host);
        resolve(host);
      }).catch(function(error) {
        reject(error);
      });
    });
  };
  
  this.updateHost = function(ref, data) {
    return new Promise(function(resolve, reject) {
      hosts.update(ref, new Host(data)).then(function(host) {
        host.data = new Host(host.data);
        self.emit('changed');
        self.emit('hostUpdated', host);
        resolve(host);
      }).catch(function(error) {
        reject(error);
      });
    });
  };
  
  this.hostTo = function(ref, index) {
    return new Promise(function(resolve, reject) {
      hosts.moveTo(ref, index).then(function (host) {
        host.data = new Host(host.data);
        self.emit('changed');
        self.emit('hostTo', host.index);
        resolve(host);
      }).catch(function(error) {
        reject(error);
      });
    });
  };
  
  this.hostUp = function(ref, count) {
    return new Promise(function(resolve, reject) {
      hosts.moveUp(ref, count).then(function (host) {
        host.data = new Host(host.data);
        self.emit('changed');
        self.emit('hostUp', host.index);
        resolve(host);
      }).catch(function(error) {
        reject(error);
      });
    });
  };
  
  this.hostDown = function(ref, count) {
    return new Promise(function(resolve, reject) {
      hosts.moveDown(ref, count).then(function (host) {
        host.data = new Host(host.data);
        self.emit('changed');
        self.emit('hostDown', host.index);
        resolve(host);
      }).catch(function(error) {
        reject(error);
      });
    });
  };
  
  // ===========================================================================
  // tasks
  // ===========================================================================
  this.getTasks = function() {
    return tasks.data;
  };
  
  this.getTaskNames = function() {
    return tasks.names;
  };
  
  this.getTaskCount = function() {
    return tasks.length;
  };
  
  function snapsDir(name) {
    return rsbkpDir+'/'+name;
  }
  var snapsFile = 'snapshots.json';
  function snapsPath(name) {
    return snapsDir(name)+'/'+snapsFile;
  }
  function snaps(name) {
    var path = snapsPath(name);
    return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : [];
  }
  
  this.getTask = function(ref) {
    return new Promise(function(resolve, reject) {
      tasks.get(ref).then(function(task) {
        task.data = new Task(task.data);
        task.snaps = snaps(task.name);
        resolve(task);
      }).catch(function(error) {
        reject(error);
      });
    });
  };
  
  this.removeTask = function(ref) {
    return new Promise(function(resolve, reject) {
      tasks.remove(ref).then(function(task) {
        toDelete.add(snapsDir(task.name));
        self.emit('changed');
        self.emit('taskRemoved', task);
        resolve(task);
      }).catch(function(error) {
        reject(error);
      });
    });
  };
  
  this.setTask = function(name, data, index) {
    return new Promise(function(resolve, reject) {
      tasks.add(name, new Task(data), index).then(function(task) {
        task.data = new Task(task.data);
        self.emit('changed');
        self.emit('taskSet', task);
        resolve(task);
      }).catch(function(error) {
        reject(error);
      });
    });
  };
  
  this.updateTask = function(ref, data) {
    return new Promise(function(resolve, reject) {
      tasks.update(ref, new Task(data)).then(function(task) {
        task.data = new Task(task.data);
        self.emit('changed');
        self.emit('taskUpdated', task);
        resolve(task);
      }).catch(function(error) {
        reject(error);
      });
    });
  };
  
  this.taskTo = function(ref, index) {
    return new Promise(function(resolve, reject) {
      tasks.moveTo(ref, index).then(function (task) {
        task.data = new Task(task.data);
        self.emit('changed');
        self.emit('taskTo', task.index);
        resolve(task);
      }).catch(function(error) {
        reject(error);
      });
    });
  };
  
  this.taskUp = function(ref, count) {
    return new Promise(function(resolve, reject) {
      tasks.moveUp(ref, count).then(function (task) {
        task.data = new Task(task.data);
        self.emit('changed');
        self.emit('taskUp', task.index);
        resolve(task);
      }).catch(function(error) {
        reject(error);
      });
    });
  };
  
  this.taskDown = function(ref, count) {
    return new Promise(function(resolve, reject) {
      tasks.moveDown(ref, count).then(function (task) {
        task.data = new Task(task.data);
        self.emit('changed');
        self.emit('taskDown', task.index);
        resolve(task);
      }).catch(function(error) {
        reject(error);
      });
    });
  };
  
  this.testTask = function(taskName) {
    
  };
  
  this.runTask = function(taskName) {
    return new Promise(function (fulfill, reject) {
      if (!tasks || !tasks[taskName]) reject(`Task ${taskName} not defined.`);
      else {
        console.log('running...');
        fulfill('Task');
      }
    });
  };
  
  this.runDiff = function(taskName, snapshot) {
    
  };
  
  // ===========================================================================
  // profiles
  // ===========================================================================
//  this.getProfiles = function() {
//    return profiles;
//  };
  
  this.getProfileNames = function() {
    return profiles.names();
  };
  
  this.getProfileCount = function() {
    return profiles.length();
  };
  
  this.getProfile = function(ref) {
    return profiles.get(ref);
  };
  
  this.setProfile = function(profile) {
    this.emit('changed');
    profiles.add(profile);
  };
  
  this.removeProfile = function(ref) {
    this.emit('changed');
    return profiles.remove(ref);
  };
  
  this.updateProfile = function(ref, profile) {
    this.emit('changed');
    profiles.update(ref, profile);
  };
  
  this.profileUp = function(index, count) {
    this.emit('changed');
    return profiles.moveUp(index, count);
  };
  
  this.profileDown = function(index, count) {
    this.emit('changed');
    return profiles.moveDown(index, count);
  };
}
util.inherits(Rsbkp, EventEmitter);
