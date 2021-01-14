var express = require('express');
var app = express();

var Server = app.listen(/*process.env.PORT ||*/ 3000);

app.use(express.static('public'));

console.log("The server is up and running! :) Just type 'localhost:3000' into your Browser and you are good to go!");

var socket = require('socket.io');

var io = socket(Server);

io.sockets.on('connection', newConnection);

function newConnection(socket) {
    console.log('new connection: ' + socket.id);

    socket.on('arduino', arduinoMsg);

    function arduinoMsg(data) {
        socket.broadcast.emit('arduino', data);
    }
}