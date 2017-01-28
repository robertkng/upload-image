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






var http      = require("http");
var express   = require("express");
var mysql     = require('promise-mysql');
var bodyParser= require('body-parser');
var cookieParser = require('cookie-parser');
var fs        = require('fs');
var request = require('request');

var base_url = (function() {
  if(process.env.PRODUCTION)
    return "http://a3096843.ngrok.io";
  return "http://localhost:8080";
})();

var port = (function() {
  if(process.env.PRODUCTION) return { http: 80 };
  else return { http: 8080 };
})();

var httpApp = express();
httpApp.set('views', __dirname + "/app/views");
httpApp.set('view engine', 'jade');
httpApp.use(express.static(__dirname + "/static/",{
  setHeaders: function(res, path) {
    res.setHeader('Access-Control-Allow-Headers', 'accept, authorization, content-type, x-requested-with');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

httpApp.use(bodyParser.json({limit: '50mb', parameterLimit: 10000}));
httpApp.use(bodyParser.urlencoded({limit: '50mb', parameterLimit: 10000, extended: true}));
httpApp.use(cookieParser());
httpApp.disable('x-powered-by');
httpApp.disable('content-length');
httpApp.disable('content-type');
httpApp.disable('etag');

httpApp.use(function (req, res, next) {
  req.PRODUCTION = process.env.PRODUCTION;
  res.locals.base_url = base_url;
  res.setHeader('Access-Control-Allow-Headers', 'accept, authorization, content-type, x-requested-with');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

var router = express.Router();
httpApp.use('/', router);

require('./app/controllers/index')(router);

router.get('/api/status', function(req,res) {
  res.status(200).send({ online: true });
});

var httpServer = http.createServer(httpApp).listen(port.http);
console.log("Listening on port:", port.http);

