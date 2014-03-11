var fs = require("fs");
var cx = require("cloneextend");
var spawn = require("child_process").spawn;
var uuid = require("node-uuid");
var logging = require("femto-logger");
var config = require("../config/config");

var services = null;

var TEMPLATE = {
  detail: {
    header: {
      id: "",
      name: null,
      cwd: null,
      cmdline: null,
      running: false,
    },
    output: null
  },
  process: null
};

var list = exports.list = function(callback) {
  load(function(err, items) {
    if(!err) {
      var headers = [];

      for(key in items) {
        headers.push(items[key].detail.header);
      }

      callback(null, headers);
    }
    else {
      callback(err);
    }
  });
};

var detail = exports.detail = function(id, callback) {
  load(function(err, items) {
    if(!err) {
      callback(null, items[id] ? items[id].detail : null);
    }
    else {
      callback(err);
    }
  });
};

var service = exports.service = function(id, callback) {
  load(function(err, items) {
    if(!err) {
      callback(null, items[id]);
    }
    else {
      callback(err);
    }
  });
};

var create = exports.create = function(header, callback) {
  load(function(err, items) {
    if(!err) {
      var service = cx.clone(TEMPLATE);
      service.detail.header = header;
      service.detail.header.id = uuid.v1();
      service.detail.header.running = false;
      services[service.detail.header.id] = service;

      save(callback);
    }
    else {
      callback(err);
    }
  });
};

var update = exports.update = function(id, header, callback) {
  load(function(err, items) {
    if(!err) {
      header.running = items[id].detail.header.running;
      items[id].detail.header = header;
      save(callback);
    }
    else {
      callback(err);
    }
  });
};

var remove = exports.remove = function(id, callback) {
  load(function(err, items) {
    if(!err) {
      if(items[id].detail.header.running) {
        stop(id);
      }

      delete items[id];
      save(callback);
    }
    else {
      callback(err);
    }
  });
};

var start = exports.start = function(id, callback) {
  service(id, function(err, service) {
    if(!err) {
      if(service != null) {
        var split = service.detail.header.cmdline.split(" ");
        var cmd = split[0];
        var args = split.slice(1);

        service.detail.output = "";

        service.process = spawn(cmd, args, {cwd: service.detail.header.cwd});

        service.process.stdout.on("data", function(data) {
          service.detail.output += replaceAll(data.toString(), "\n", "<br>");
        });

        service.process.stderr.on("data", function(data) {
          service.detail.output += replaceAll(data.toString(), "\n", "<br>");
        });

        service.process.on("error", function(err) {
          service.detail.output += ("<br>" + err);
          service.detail.header.running = false;
        });

        service.process.on("exit", function(code) {
          service.detail.output += ("<br>Process exited with code " + code);
          service.detail.header.running = false;
        });

        service.detail.header.running = true;
        callback(null, service);
      }
      else {
        callback(null, null);
      }
    }
    else {
      callback(err);
    }
  });
}

var stop = exports.stop = function(id, callback) {
  service(id, function(err, service) {
    if(!err) {
      if(service != null) {
        if(service.process) {
          service.process.kill();
        }
        service.detail.header.running = false;
        callback(null, service);
      }
      else {
        callback(null, null);
      }
    }
    else {
      callback(err);
    }
  });
}

function load(callback) {
  if(services === null) {
    services = {};
    fs.readFile(config.datafile, function(err, data) {
      if(!err) {

        var headers = JSON.parse(data);
        for(var i=0; i < headers.length; i++) {
          var service = cx.clone(TEMPLATE);
          service.detail.header = headers[i];
          service.detail.header.running = false;
          services[service.detail.header.id] = service;
        }

        callback(null, services);
      }
      else {
        if(err.code !== 'ENOENT') {
          callback(err);
        }
      }
    });
  }
  else {
    callback(null, services);
  }
}

function save(callback) {
  var headers = [];

  for(id in services) {
    var header = cx.clone(services[id].detail.header);
    delete header.running;
    headers.push(header);
  }

  fs.writeFile(config.datafile, JSON.stringify(headers), callback);
}

function replaceAll(s, find, replace) {
  return s.split(find).join(replace);
}
