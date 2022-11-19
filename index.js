const {client} = require('./db');
require('dotenv').config();
const express = require('express');


client.connect();

const server = express();

const PORT = 3000;

const morgan = require('morgan');



server.use(morgan('dev'));

server.use(express.json());

server.listen(PORT, () => {
    console.log('The server is up on port', PORT)
});

server.use((req, res, next) => {
    console.log("<____Bodu Logger START___>");
    console.log(req.body);
    console.log("<____Body Logger END___>");

    next();
})

const apiRouter = require('./api');
server.use('/api', apiRouter);