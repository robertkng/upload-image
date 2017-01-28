module.exports = function(router) {
  var fs = require('fs');

  router.get("/", function(req,res) {
    return res.render("index", { title: 'Homepage', message: 'Homepage'});
  });

  router.get("/uploadImage", function(req,res) {
    return res.render("uploadImage", { title: 'Upload', message: 'Add that file bro!'});
  });

  router.post("/synchronize/manifest", function(req,res) {

    var multiparty = require('multiparty');
    var form = new multiparty.Form();
    form.parse(req,formCallback);
  });

};
