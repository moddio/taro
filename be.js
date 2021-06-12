const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

let modd = express();

modd.env = process.env.ENV || 'staging';
const port = 8080;

modd.set('view engine', 'ejs');

modd.use(cookieParser());
modd.use('/engine', express.static(path.join(`${__dirname}/engine`)));
modd.use('/src', express.static(path.join(`${__dirname}/src`)));
modd.use('/assets', express.static(path.join(`${__dirname}/assets`)));

require('./app/routes.js')(modd);

modd.listen(port);
