require('dotenv').config();
const PORT = process.env.PORT;
const SOCKET_PORT = process.env.SOCKETPORT;
const path = require('path');
const Fileupload = require('express-fileupload');
var cors = require('cors')
const express = require('express');
var bodyParser = require("body-parser");
const ejs = require('ejs');
const views_path = path.join(__dirname, "./views/");
////web socket///
const http = require('http');
const webSocketServer = require('websocket').server;
const server = http.createServer();
server.listen(SOCKET_PORT);
const wsServer = new webSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});
const clients = {};
const UsersController = require('./Controllers/UsersController');
var GetUniqueID = () => {
    const now = new Date();
    let month = now.getMonth() + 1;
    let date = now.getDate() + 1;
    return `${now.getFullYear()}_${month <= 9 ? `0${month}` : month}_${date <= 9 ? `0${date}` : date}-${now.getHours()}_${now.getMinutes()}_${now.getSeconds()}_${now.getMilliseconds()}`;
}
function originIsAllowed(origin) {
    return true;
}

var wsActiveUser = [];
wsServer.on('request', (request) => {
    if (originIsAllowed(request.origin) === true) {
        console.log(new Date() + ' Recieved a new connrction from origin ' + request.origin);
    }
    if (request.resourceURL.query === undefined) {
        console.log(new Date() + ' connrction rejected ' + request.origin);
        request.reject(); return false;
    }
    if (request.resourceURL.query.Authorization === undefined) {
        console.log(new Date() + ' connrction rejected ' + request.origin);
        request.reject(); return false;
    }
    if (request.resourceURL.query.Authorization === '') {
        console.log(new Date() + ' connrction rejected ' + request.origin);
        request.reject(); return false;
    }
    var userID = request.resourceURL.query.Authorization;//`${GetUniqueID()}-${Math.floor(Math.random() * 10000)}`;
    // console.log(request.resourceURL.query.Authorization);
    const connection = request.accept(null, request.origin);
    clients[userID] = connection;
    // wsActiveUser.push({ wsid: userID });
    let data_ = {
        type: 'datafromws',
        code: 1000,
        msg: "active users list and new connected client",
        // wsActiveUser: wsActiveUser,
        clientid: userID
    };
    for (key in clients) {
        clients[key].sendUTF(JSON.stringify(data_));
    }
    UsersController.UpdateUserWsStatus(userID, 1);
    connection.on('message', function (message) {
        if (message.type === 'utf8') {
            console.log('Received Message------------------->', message.utf8Data);
            let data = message;
            Object.assign(message, { clientid: userID })
            for (key in clients) {
                clients[key].sendUTF(JSON.stringify(data));
                // clients[key].sendUTF(message);
                // clients[key].sendUTF(message.utf8Data);// not required
            }
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            for (key in clients) {
                clients[key].sendBytes(message.binaryData);
            }
        }
    });


    connection.on('close', function (reasonCode, description) {
        console.log('reasonCode-------------->', reasonCode);
        console.log('description-------------->', description);
        console.log('connection close');
        // wsActiveUser.splice(wsActiveUser.indexOf(clients[userID]), 1)
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        let data_ = {
            type: 'datafromws',
            code: 2000,
            msg: "active users list and disconnected client",
            // wsActiveUser: wsActiveUser,
            clientid: userID,
        };
        for (key in clients) {
            clients[key].sendUTF(JSON.stringify(data_));
        }
        UsersController.UpdateUserWsStatus(userID, 0);
    });

});

////web socket////

const app = express();
app.set("view engine", "ejs");
app.set("views", views_path);
app.use(express.json());
app.use(Fileupload());
app.use(cors())
app.use(bodyParser.json());
app.use("/users-file", express.static('./public/users/'));
app.use("/users-chat-file", express.static('./public/chat-files/'));
app.use(require('./routes/Route'));
app.listen(PORT);
