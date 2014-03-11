module.exports = function(express) {
  express.get("/", view);
};

function view(req, res) {
  res.render("base");
}
