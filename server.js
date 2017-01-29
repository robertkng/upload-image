// 'use strict'
// const express       = require('express');
// const logger        = require('morgan');
// const path          = require('path');
// const cookieParser  = require('cookie-parser');
// const bodyParser    = require('body-parser');
// const app           = express();
// const PORT          = process.argv[2] || process.env.PORT || 3000;

// app.set('view engine', 'ejs');
// app.set('views', 'views');

// app.use(logger('dev'));

// app.use(express.static(path.join(__dirname, 'dist')));

// app.use(cookieParser());

// app.use(bodyParser.urlencoded({ extended: true }));

// app.use(bodyParser.json());

// app.use('/', require('./routes/index.js'));
// app.use('/index', require('./routes/index.js'));

// app.listen(PORT, () => console.log('server is listening on ', PORT));






const http            = require("http");
const express         = require("express");
const mysql           = require('promise-mysql');
const bodyParser      = require('body-parser');
const cookieParser    = require('cookie-parser');
const fs              = require('fs');
const request         = require('request');

const base_url = (function() {
  if(process.env.PRODUCTION)
    return "http://a3096843.ngrok.io";
  return "http://localhost:8080";
})();

const port = (function() {
  if(process.env.PRODUCTION) return { http: 80 };
  else return { http: 3000 };
})();

const httpApp = express();
httpApp.set('views', __dirname + "/app/views");
httpApp.set('view engine', 'jade');
httpApp.use(express.static(__dirname + "/static"));

httpApp.use(cookieParser());

const router = express.Router();
httpApp.use('/', router);

require('./app/controllers/index')(router);

router.get('/api/status', function(req,res) {
  res.status(200).send({ online: true });
});

const httpServer = http.createServer(httpApp).listen(port.http);
console.log("Listening on port:", port.http);

