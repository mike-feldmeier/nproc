var express = require("express");
var stylus = require("stylus");
var nib = require("nib");
var logging = require("femto-logger");

var config = require("./config/config");

// Define directories
var views = __dirname + "/views";
var public = __dirname + "/public";

// Modify the compile function for stylus
function compile(s, path) {
  return stylus(s)
    .set("filename", path)
    .use(nib());
}

// Setup express
var app = express();

app.set("port", config.port || 3000);
app.set("view engine", "jade");
app.set("views", views);
app.use(express.json());
app.use(express.urlencoded());
app.use(stylus.middleware({ src: public, compile: compile }));
app.use(express.static(public));

// Add all routes in the routes directory
require("fs").readdirSync("./routes").forEach(function(file) {
  require("./routes/" + file)(app);
});

// Start application listener
app.listen(app.get("port"), function(err) {
  if(!err) {
    logging.info("Listening on port %d", app.get("port"));
  }
  else {
    logging.fatal("Could not listen on port %d: %s", app.get("port"), err);
  }
});
