module.exports = function(router) {
  var fs = require('fs');

  router.get("/", function(req,res) {
    return res.render("index", { title: 'Homepage', message: 'Homepage'});
  });

  router.get("/leaderboard", function(req,res) {
    return res.render("leaderboard", { title: 'Upload', message: 'Add that file bro!'});
  });

  router.get("/upload/manifest", function(req,res) {
    return res.render("upload", { title: 'Upload', message: 'Add that file bro!'});
  });

  router.get("/synchronize/manifest", function(req,res) {
    return res.render("synchronize", { title: 'Upload', message: 'Add that file bro!'});
  });

  router.get("/synchronize/manifest/review", function(req,res) {
    var locals = {};
    locals.title = "Review";
    locals.message = "";
    locals.review = [
      {
        consignee_name: "AL-RABIE SAUDI FOODS CO LTD",
        match_name: "AL-RABIE FOODS CO"
      },
      {
        consignee_name: "SAUDI MANAR COMPANY FORMANUFACTURING AND",
        match_name: "MANAR FORMANUFACTURING"
      },
      {
        consignee_name: "SAUDI LIGHTING COMPANY LTD",
        match_name: "SAUDI LIGHTING LTD"
      },
      {
        consignee_name: "DYWIDAG - SYSTEMS INTERNATIONAL SAUDI ARABIA",
        match_name: "DYWIDAG - SAUDI ARABIA"
      },
      {
        consignee_name: "SAUDI ELECTRICAL TRANSFORMERS FACTO",
        match_name: "SAUDI TRANSFORMERS"
      },
      {
        consignee_name: "KENDA LAND TRADING EST.  KINGDOM OF SAUDI ARABIA",
        match_name: "KENDA LAND KINGDOM, SAUDI ARABIA"
      }
    ];
    return res.render("review", locals);
  });

  router.post("/synchronize/manifest", function(req,res) {
    var doQueries = function(arr) {
     var index;
     var doNextQuery = function() {
       if(!index && index !== "0" && index !== 0) index = 0;
       else index = index + 1;
       obj = arr[index];
       if(!obj) {
          return res.send({ success: true });
       }
       req.DB.query("select c.* from Consignees c where c.name = ?", [obj.CONSIGNEE_NAME], function(err, rows) {
         if(err) { return res.send(err); }
         if(!rows[0]) {
           req.DB.query("select Consignees.*, match (Consignees.name) against (?) AS relevance from Consignees where match (name) against (?) order by relevance desc", [obj.CONSIGNEE_NAME,obj.CONSIGNEE_NAME], function(err, rows) {
             if(err) { return res.send(err); }
             if(rows[0]) {
               var row = rows[0];
               if(row.relevance >= 0.1) {
                 req.DB.query("select * from Consignees.* c left join ConsigneeCommoCodes ccc on c.group_id = ccc.consignee_group_id left join ConsigneeAgents ca on c.group_id = ca.consignee_group_id left join ConsigneePOLs cp on c.group_id = cp.consignee_group_id where c.group_id = ?", row.group_id, function(req,res) {
                   if(err) { console.log(err); return; }
                   if(!rows[0]) return;

                   var one,two,three;

                   // if same commo code
                   for(var key in rows) {
                     if((obj["Commo Code"] == rows[key].commo_code)) {
                       one = true;
                     }
                   }
                   for(var key2 in rows) {
                     if(obj.AGENT_NAME == rows[key].agent_name) {
                       two = true;
                     }
                   }
                   for(var key3 in rows) {
                     if(obj.POL == rows[key].pol) {
                       three = true;
                     }
                   }
                   if(one && two && three) {
                      req.DB.query("insert into Consignees set ?", { name: obj.CONSIGNEE_NAME, group_id: rows[0].group_id });
                   }
                   doNextQuery();
                 });
               } else {
                 doNextQuery();
               }
             } else {
               // add consignee
               req.DB.query("insert into Consignees set ?", { name: obj.CONSIGNEE_NAME, group_id: new Date().getTime() }, function(err, response) {
                 if(err) { return res.send(err); }
                 var consignee_id = response.insertId;
                 req.DB.query("select group_id from Consignees where id = ?", [consignee_id], function(err, rows) {
                   consignee_group_id = rows[0].group_id;
                   // add commo code
                   if(obj["Commo Code"] !== "null")
                     req.DB.query("insert into ConsigneeCommoCodes set ?", { consignee_group_id: consignee_group_id, commo_code: obj["Commo Code"] });
                   // add agent
                   if(obj.AGENT_NAME !== "--")
                     req.DB.query("insert into ConsigneeAgents set ?", { consignee_group_id: consignee_group_id, agent_name: obj.AGENT_NAME });
                   // add pols
                   req.DB.query("insert into ConsigneePOLs set ?", { consignee_group_id: consignee_group_id, pol: obj.POL});

                   doNextQuery();
                 });
               });
             }
           });
         } else {
            doNextQuery();
         }
       });
     };
     doNextQuery();
    };
    var formCallback = function(err, fields, files) {
      if(!files.file[0].originalFilename) return res.redirect("/synchronize/manifest");
      var filepath = "temp/" + files.file[0].originalFilename;
      var dest = fs.createWriteStream(filepath);
      var source = fs.createReadStream(files.file[0].path);
      source.pipe(dest);
      source.on('end', function() {
        var arr = [];
        var obj = {};
        var csv = require("fast-csv");
          csv.fromPath(filepath)
           .on("data", function(data) {
             // get all csv rows as objects in array.
             if(!Object.keys(obj).length) {
              for(var key in data) {
                obj[data[key]] = true;
              }
             } else {
              var index = 0;
              var newObj = {};
              for(var key2 in obj) {
                newObj[key2] = data[index];
                index = index + 1;
              }
              arr.push(newObj);
             }
           })
           .on("end", function() {
             setTimeout(function() {
               doQueries(arr);
             }, 2000);
           });
      });
      source.on('error', function(err) {
        res.send({ error: true });
      });
    };

    var multiparty = require('multiparty');
    var form = new multiparty.Form();
    form.parse(req,formCallback);
  });

  router.post("/upload/manifest", function(req,res) {
    var formCallback = function(err, fields, files) {
      var filepath = "temp/" + files.file[0].originalFilename;
      var dest = fs.createWriteStream(filepath);
      var source = fs.createReadStream(files.file[0].path);
      source.pipe(dest);
      source.on('end', function() {
        var arr = [];
        var csv = require("fast-csv");
          csv.fromPath(filepath)
           .on("data", function(data){
               arr.push(data);
           })
           .on("end", function(){
               res.send(JSON.stringify(arr));
           });
      });
      source.on('error', function(err) {
        res.send({ error: true });
      });
    };

    var multiparty = require('multiparty');
    var form = new multiparty.Form();
    form.parse(req,formCallback);
  });

  router.post("/manifest/confirmation", function(req,res) {
    var multiparty = require('multiparty');
    var form = new multiparty.Form();
    form.parse(req, function(err, fields, files) {
      var cargostatus = fields.cargostatus[0];
      if(cargostatus == "3DAYS") {
        //trigger 3day text to driver.
        Helper.sendSms("+19084567890", "Your cargo will arrive in 3 days.", function() {
          //trigger 3day text to cosignee.
          Helper.sendMail("appkat.nick@gmail.com", "Cargo Update", "<p>Your cargo will arrive in 3 days.</p><p>Need to hire an agent for delivery? We can help! <a href=''>Click here</a> to learn more.</p>", function() {
            res.render("confirmation", { message: "Your cargo will arrive in 3 days." });
          });
        });
      } else {
        // Trigger pickup text to driver.
        Helper.sendSms("+19084567890", "Your cargo is ready for pickup. When will you arrive to pick up?", function() {
          // Trigger pickup text to cosignee.
          Helper.sendMail("appkat.nick@gmail.com", "Cargo Update",  "<p>Your cargo is ready for pick up.</p><p>Need to hire an agent for delivery? We can help! <a href=''>Click here</a> to learn more.</p>", function() {
            res.render("confirmation", { message: "Your cargo is ready for pickup." });
          });
        });
      }
    });
  });

  router.post("/text/response", function(req,res) {
    var message = req.body.Body;
    var oneHour = message.match("1 hour");
    var tomorrow = message.match("tomorrow");
    var threeDays = message.match("3 days");
    var okOk = message.match("Ok ok");

    if(oneHour) {
      //confirm pick up message received driver
      Helper.sendSms("+19084567890", "Great! We will be ready for you.", function() {
        // Trigger pickup text to cosignee.
        Helper.sendMail("appkat.nick@gmail.com", "Cargo Update", "Your driver confirmed pick up in 1 hour.", function() {
          res.send({success:true});
        });
      });
    } else if (tomorrow) {
      //confirm pick up message received driver
      Helper.sendSms("+19084567890", "Please arrive promptly at 11am tomorrow morning.", function() {
        // Trigger pickup text to cosignee.
        Helper.sendMail("appkat.nick@gmail.com", "Cargo Update", "Your driver has been scheduled for pick up at 11am tomorrow morning.", function() {
          res.send({success:true});
        });
      });
    } else if (threeDays) {
      //confirm pick up message received driver
      Helper.sendSms("+19084567890", "Please arrive promptly at 11am on Wednesday.", function() {
        // Trigger pickup text to cosignee.
        Helper.sendMail("appkat.nick@gmail.com", "Cargo Update", "Your driver has acknowledged pick up in 3 days. Your account will be charged $1500/day during this period.", function() {
          res.send({success:true});
        });
      });
    } else if (okOk) {
      //confirm pick up message received driver
      Helper.sendSms("+19084567890", "Jeez make up your mind bro.", function() {
        // Trigger pickup text to cosignee.
        Helper.sendMail("appkat.nick@gmail.com", "Cargo Update", "Your driver has confirmed pick up in 2 hours.", function() {
          Helper.sendSms("+19084567890", "Just kidding! You're confirmed for 2 hours from now.", function() {});
          res.send({success:true});
        });
      });
    }
  });
};
