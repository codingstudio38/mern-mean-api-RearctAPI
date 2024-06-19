require("dotenv").config();
const PORT = process.env.PORT;
const SOCKET_PORT = process.env.SOCKETPORT;
const path = require("path");
const Fileupload = require("express-fileupload");
var cors = require("cors");
const express = require("express");
var bodyParser = require("body-parser");
// const ejs = require("ejs");
const views_path = path.join(__dirname, "./views/");
// const { parentPort, Worker } = require("worker_threads");
const cluster = require("node:cluster");
const os = require("os");
const totalCPUs = os.cpus("").length;
const http = require("http");
const webSocketServer = require("websocket").server;
const UsersController = require("./Controllers/UsersController");
const expressSession = require("express-session");
// if (cluster.isPrimary) {
//     /// for mutiple child server
//     // cluster.isPrimary//cluster.isMaster
//     for (let i = 0; i < totalCPUs; i++) {
//         cluster.fork();
//     }
// } else { }
////web socket///
const serverForWs = http.createServer();
serverForWs.listen(SOCKET_PORT);
const wsServer = new webSocketServer({
    httpServer: serverForWs,
    autoAcceptConnections: false,
});
const clients = {};
var GetUniqueID = () => {
    const now = new Date();
    let month = now.getMonth() + 1;
    let date = now.getDate() + 1;
    return `${now.getFullYear()}_${month <= 9 ? `0${month}` : month}_${date <= 9 ? `0${date}` : date
        }-${now.getHours()}_${now.getMinutes()}_${now.getSeconds()}_${now.getMilliseconds()}`;
};
function originIsAllowed(origin) {
    return true;
}

wsServer.on("request", (request) => {
    if (originIsAllowed(request.origin) === true) {
        console.log(
            new Date() + " Recieved a new connrction from origin " + request.origin
        );
    }
    if (request.resourceURL.query === undefined) {
        console.log(new Date() + " connrction rejected " + request.origin);
        request.reject();
        return false;
    }
    if (request.resourceURL.query.Authorization === undefined) {
        console.log(new Date() + " connrction rejected " + request.origin);
        request.reject();
        return false;
    }
    if (request.resourceURL.query.Authorization === "") {
        console.log(new Date() + " connrction rejected " + request.origin);
        request.reject();
        return false;
    }
    var userID = request.resourceURL.query.Authorization; //`${GetUniqueID()}-${Math.floor(Math.random() * 10000)}`;
    // console.log(request.resourceURL.query.Authorization);
    const connection = request.accept(null, request.origin);
    clients[userID] = connection;
    // wsActiveUser.push({ wsid: userID });
    let data_ = {
        type: "datafromws",
        code: 1000,
        msg: "new client connected..",
        // wsActiveUser: wsActiveUser,
        clientid: userID,
    };
    for (key in clients) {
        clients[key].sendUTF(JSON.stringify(data_));
    }
    UsersController.UpdateUserWsStatus(userID, 1);
    connection.on("message", function (message) {
        if (message.type === "utf8") {
            console.log("Received Message------------------->", message.utf8Data);
            let data = message;
            Object.assign(message, { clientid: userID });
            for (key in clients) {
                clients[key].sendUTF(JSON.stringify(data));
                // clients[key].sendUTF(message);
                // clients[key].sendUTF(message.utf8Data);// not required
            }
        } else if (message.type === "binary") {
            console.log(
                "Received Binary Message of " + message.binaryData.length + " bytes"
            );
            for (key in clients) {
                clients[key].sendBytes(message.binaryData);
            }
        }
    });

    connection.on("close", function (reasonCode, description) {
        console.log("reasonCode-------------->", reasonCode);
        console.log("description-------------->", description);
        console.log("connection close");
        // wsActiveUser.splice(wsActiveUser.indexOf(clients[userID]), 1)
        console.log(
            new Date() + " Peer " + connection.remoteAddress + " disconnected."
        );
        let data_ = {
            type: "datafromws",
            code: 2000,
            msg: "client disconnected..",
            // wsActiveUser: wsActiveUser,
            clientid: userID,
        };
        for (key in clients) {
            clients[key].sendUTF(JSON.stringify(data_));
        }
        UsersController.UpdateUserWsStatus(userID, 0);
    });
});
//web socket////

const app = express();
app.set("view engine", "ejs");
app.set("views", views_path);
app.use(expressSession({
    "resave": false,
    "saveUninitialized": true,
    "lek": 'user_id',
    "secret": 'user secret',
    // cookie: { secure: true }
}));
app.use(express.json());
app.use(Fileupload());
app.use(cors());
app.use(bodyParser.json());
app.use("/users-file", express.static("./public/users/"));
app.use("/users-chat-file", express.static("./public/chat-files/"));
app.use("/assets", express.static("./public/assets/"));
app.use("/post-thumbnail", express.static("./public/thumbnail/"));
app.use("/post-videos", express.static("./public/video_file/"));
app.use(require("./routes/Route"));
app.listen(PORT, () => {
    console.log(`server running on :http://localhost:${process.env.PORT} `);
});
console.log(`cluster is working. pid:${process.pid}`);

