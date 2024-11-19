try {
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
    // const http = require("http");
    // const webSocketServer = require("websocket").server;

    const expressSession = require("express-session");
    const WebsocketController = require("./Controllers/WebsocketController");
    // if (cluster.isPrimary) {
    //     /// for mutiple child server
    //     // cluster.isPrimary//cluster.isMaster
    //     for (let i = 0; i < totalCPUs; i++) {
    //         cluster.fork();
    //     }
    // } else { }
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
    WebsocketController.runWsServer();
    app.use(express.json());
    app.use(Fileupload());
    app.use(cors());
    app.use(bodyParser.json());
    app.use("/users-file", express.static("./public/users/"));
    app.use("/users-chat-file", express.static("./public/chat-files/"));
    app.use("/assets", express.static("./public/assets/"));
    app.use("/post-thumbnail", express.static("./public/thumbnail/"));
    app.use("/post-videos", express.static("./public/video_file/"));
    app.use("/pdf-files", express.static("./public/pdf-export/"));
    app.use(require("./routes/Route"));
    app.listen(PORT, () => {
        console.log(`node server running on :http://localhost:${process.env.PORT} `);
    });
    console.log(`cluster is working. pid:${process.pid}`);
} catch (error) {
    console.error(`Failed to run node server! ${error.message}`);
}