var logging = require("femto-logger");
var controller = require("../controllers/services");

module.exports = function(express) {
  express.get("/services", list);
  express.get("/services/:id", detail);
  express.get("/services/:id/start", start);
  express.get("/services/:id/stop", stop);
  express.post("/services/header", addHeader);
  express.put("/services/:id/header", updateHeader);
  express.del("/services/:id", remove);
};

function list(req, res) {
  controller.list(function(err, items) {
    if(!err) {
      res.send(items);
    }
    else {
      logging.error("Could not list services from persistence: %s", err);
      res.send(500);
    }
  });
}

function detail(req, res) {
  controller.detail(req.params.id, function(err, item) {
    if(!err) {
      if(item != null) {
        res.send(item);
      }
      else {
        res.send(404);
      }
    }
    else {
      logging.error("Could not get service %s from persistence: %s", req.params.id, err);
      res.send(500);
    }
  });
}

function start(req, res) {
  controller.start(req.params.id, function(err, service) {
    if(!err) {
      if(detail != null) {
        res.send(service.detail);
      }
      else {
        res.send(404);
      }
    }
    else {
      logging.error("Could not process service %s: %s", req.params.id, err);
      res.send(500);
    }
  });
}

function stop(req, res) {
  controller.stop(req.params.id, function(err, service) {
    if(!err) {
      if(detail != null) {
        res.send(service.detail);
      }
      else {
        res.send(404);
      }
    }
    else {
      logging.error("Could not process service %s: %s", req.params.id, err);
         res.send(500);
    }
  });
}

function addHeader(req, res) {
  controller.create(req.body, function(err) {
    if(!err) {
      res.send(204);
    }
    else {
      logging.error("Could not create service header: %s", err);
      res.send(500);
    }
  });
}

function updateHeader(req, res) {
  controller.update(req.params.id, req.body, function(err) {
    if(!err) {
      res.send(204);
    }
    else {
      logging.error("Could not update service header %d: %s", req.params.id, err);
      res.send(500);
    }
  });
}

function remove(req, res) {
  controller.remove(req.params.id, function(err) {
    if(!err) {
      res.send(204);
    }
    else {
      logging.error("Could not remove service %d: %s", req.params.id, err);
      res.send(500);
    }
  });
}

function replaceAll(s, find, replace) {
  return s.split(find).join(replace);
}
