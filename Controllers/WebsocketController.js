const http = require("http");
const webSocketServer = require("websocket").server;
const UsersController = require("./UsersController");
const SOCKET_PORT = process.env.SOCKETPORT;
const clients = {};
function originIsAllowed(origin) {
    return true; // Add your logic to allow specific origins
}
const runWsServer = () => {
    const serverForWs = http.createServer();
    serverForWs.listen(SOCKET_PORT);

    const wsServer = new webSocketServer({
        httpServer: serverForWs,
        autoAcceptConnections: false,
    });

    wsServer.on("request", (request) => {
        if (originIsAllowed(request.origin)) {
            console.log(new Date() + " Received a new connection from origin " + request.origin);
        }

        if (!request.resourceURL.query || !request.resourceURL.query.Authorization || request.resourceURL.query.Authorization === "") {
            console.log(new Date() + " Connection rejected " + request.origin);
            request.reject();
            return;
        }

        const userID = request.resourceURL.query.Authorization;
        const connection = request.accept(null, request.origin);
        clients[userID] = connection;

        let data_ = {
            type: "datafromws",
            code: 1000,
            msg: "New client connected..",
            clientid: userID,
        };

        for (let key in clients) {
            clients[key].sendUTF(JSON.stringify(data_));// Notify all clients of the new connection
        }
        UsersController.UpdateUserWsStatus(userID, 1);// update new connected user status

        connection.on("message", function (message) {
            if (message.type === "utf8") {
                console.log("Received Message:", message.utf8Data);
                let data = { ...message, clientid: userID };
                // Broadcast message to all clients
                for (let key in clients) {
                    clients[key].sendUTF(JSON.stringify(data));
                }
            } else if (message.type === "binary") {
                console.log("Received Binary Message of " + message.binaryData.length + " bytes");
                // Broadcast binary message to all clients
                for (let key in clients) {
                    clients[key].sendBytes(message.binaryData);
                }
            }
        });

        connection.on("close", function (reasonCode, description) {
            console.log(new Date() + " Peer " + connection.remoteAddress + " disconnected.");

            // Notify all clients of the disconnection
            let data_ = {
                type: "datafromws",
                code: 2000,
                msg: "Client disconnected..",
                clientid: userID,
            };

            for (let key in clients) {
                clients[key].sendUTF(JSON.stringify(data_));
            }
            UsersController.UpdateUserWsStatus(userID, 0);// update disconnected user status
        });
    });
    console.log(`WebSocket server listening on port ${SOCKET_PORT}`);
};
module.exports = { runWsServer, clients };
