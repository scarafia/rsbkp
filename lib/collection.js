'use strict';

exports = module.exports = Collection;

function chkName(name) {
  if (!name || 'string' !== typeof name || !isNaN(name)) throw new Error('name must be a string');
}
function chkInt(int, key) {
  key = key || 'key';
  if (!(Number.isInteger(int) || (int===''+parseInt(int)))) throw new Error(`${key} must be an integer`);
}

function chkRef(ref) {
  var msg = 'ref must be an integer or a string';
  if (isNaN(ref)) {
    if (!ref || 'string' !== typeof ref) throw new Error(msg);
  } else {
    if (!(Number.isInteger(ref) || (ref===''+parseInt(ref)))) throw new Error(msg);
  }
}

function Collection() {
  var self = this;
  if (!(this instanceof Collection)) {
    return new Collection();
  }
  
  var Names = [];
  function getNames() {
    // to avoid external modification
    return Names.filter(()=>true);
  };
  
  var Data = {};
  function getData() {
    // keep Names order
    var data = {};
    for (let key of Names) {
      data[key] = Data[key];
    }
    // to avoid external modification
    return JSON.parse(JSON.stringify(data));
  }
  
  Object.defineProperties(this, {
    names: {enumerable: true, get: getNames},
    data: {enumerable: true, get: getData},
    length: {enumerable: true, get: ()=>Names.length}
  });
  
  var get = this.get = function(ref) {
    chkRef(ref);
    return new Promise(function(resolve, reject) {
      let index = -1, name = '';
      if (isNaN(ref)) {
        name = ref;
        index = Names.indexOf(name);
        if (!Data[name]) {
          reject(new Error(`${name} does not exist.`));
          return;
        }
      } else {
        index = ref;
        name = Names[index];
        if (index < 0 || index >= Names.length) {
          reject(new Error(`Index ${index} out of range.`));
          return;
        }
      }
      
      resolve({ index: index, name: name, data: Data[name] });
    });
  };
  
  var remove = function(el) {
    Names.splice(el.index, 1);
    delete Data[el.name];
  };
  this.remove = function(ref) {
    chkRef(ref);
    return new Promise(function(resolve, reject) {
      get(ref).then(function(el) {
        remove(el);
        resolve(el);
      }).catch(function(error) {
        reject(error);
      });
    });
  };
  
  var add = function(el) {
      Names.splice(el.index, 0, el.name);
      Data[el.name] = el.data;
  };
  this.add = function(name, data, index=this.length) {
    chkName(name); chkInt(index);
    return new Promise(function(resolve, reject) {
      if (Data[name]) {
        reject(new Error(`${name} already exists.`));
        return;
      }
      if (index < 0 || index > self.length) {
        reject(new Error(`Index ${index} out of range.`));
        return;
      }
      
      let el = {index: index, name: name, data: data};
      add(el);
      resolve(el);
    });
  };
  this.addMany = function(many, index=this.length) {
    return new Promise(function(resolve, reject) {
      if (index < 0 || index > self.length) {
        reject(new Error(`Index ${index} out of range.`));
        return;
      }
      for (let name in many) {
        if (Data[name]) {
          reject(new Error(`${name} already exists.`));
          return;
        }
        let el = {index: index, name: name, data: many[name]};
        add(el);
        index++;
      }
      resolve();
    });
  };
  
  var update = function(el, data) {
    Data[el.name] = el.data = data;
  };
  this.update = function(ref, data) {
    chkRef(ref);
    return new Promise(function(resolve, reject) {
      get(ref).then(function(el) {
        update(el, data);
        resolve(el);
      }).catch(function(error) {
        reject(error);
      });
    });
  };
  
  var rename = function(el, name) {
    remove(el);
    el.name = name;
    add(el);
  };
  this.rename = function(ref, name) {
    chkRef(ref); chkName(name);
    return new Promise(function(resolve, reject) {
      get(ref).then(function(el) {
        if (el.name === name) {
          reject(new Error("Can't move to itself."));
          return;
        }
        if (Data[name]) {
          reject(new Error(`'${name}' already exits.`));
          return;
        }
        rename(el, name);
        resolve(el);
      }).catch(function(error) {
        reject(error);
      });
    });
  };
  
  var move = this.move = function(el, index) {
    Names.splice(el.index, 1);
    el.index = index;
    Names.splice(el.index, 0, el.name);
  };
  
  this.moveTo = function(ref, index) {
    chkRef(ref); chkInt(index);
    if (index < 0) index = 0;
    if (index >= self.length) index = self.length-1;
    return new Promise(function(resolve, reject) {
      get(ref).then(function(el) {
        move(el, index);
        resolve(el);
      }).catch(function(error) {
        reject(error);
      });
    });
  };
  
  this.moveUp = function(ref, count = 1) {
    chkRef(ref); chkInt(count);
    return new Promise(function(resolve, reject) {
      get(ref).then(function(el) {
        let index = el.index - count;
        if (index < 0) index = 0;
        move(el, index);
        resolve(el);
      }).catch(function(error) {
        reject(error);
      });
    });
  };
  
  this.moveDown = function(ref, count = 1) {
    chkRef(ref); chkInt(count);
    return new Promise(function(resolve, reject) {
      get(ref).then(function(el) {
        let index = el.index + count;
        if (index >= self.length) index = self.length-1;
        move(el, index);
        resolve(el);
      }).catch(function(error) {
        reject(error);
      });
    });
  };
}

Collection.prototype.toJSON = function() {
  return this.data;
};
