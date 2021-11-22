const path = require('path');

const express = require('express');
const cookieParser = require('cookie-parser');

const modd = express();
const port = 8080;

modd.env = process.env.ENV || 'staging';
modd.set('view engine', 'ejs');

modd.use(cookieParser());

modd.use(express.json({ limit: '5mb' }));
modd.use(express.urlencoded({ limit: '5mb' }));

modd.use('/engine', express.static(path.resolve(__dirname, 'engine')));
modd.use('/src', express.static(path.resolve(__dirname, 'src')));
modd.use('/assets', express.static(path.resolve(__dirname, 'assets')));

require('./app/routes.js')(modd);
modd.listen(port);
