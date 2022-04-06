import express, { Request, Response } from "express";
// import { WebSocketServer } from "ws";
const WebSocketServer = require("websocket").server;
import bodyParser from "body-parser";
import {
  blogs,
  getUsers,
  getUserById,
  signupUser,
  updateUser,
  deleteUser,
  loginUser,
} from "./database/queries";
import auth from "./middleware/auth";
import cors from "cors";
import { isArrayBuffer } from "util/types";

const app = express();
const port = 8888;

app.use(bodyParser.json());
app.use(cors());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.post("/signup", signupUser);
app.post("/login", loginUser);
app.get("/blogs", blogs);
app.use(auth);
// console.log("auth");

app.get("/users", getUsers);
app.get("/users/:id", getUserById);
app.put("/users/:id", updateUser);
app.delete("/users/:id", deleteUser);

const httpServer = app.listen(port, () => {
  console.log(`App running on port ${port}.`);
});

const wsServer = new WebSocketServer({
  httpServer: httpServer,
  // autoAcceptConnections: false
});

let clients: {
  readyState: any;
  sendUTF: (arg0: string) => void;
  sendBytes: (arg0: { length: string }) => void;
}[] = [];

wsServer.on("request", function (request: any) {
  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    console.log(
      new Date() + " Connection from origin " + request.origin + " rejected."
    );
    return;
  }

  var connection = request.accept("echo-protocol", request.origin);
  console.log(new Date() + " Connection accepted.");
  // console.log("request: ", request.key);
  clients.push(connection);
  connection.on(
    "message",
    function (message: {
      type: string;
      utf8Data: string;
      binaryData: { length: string };
    }) {
      // console.log('received msg: ', message);

      clients.forEach(
        (client: {
          readyState: any;
          sendUTF: (arg0: string) => void;
          sendBytes: (arg0: { length: string }) => void;
        }) => {
          if (client.readyState === connection.OPEN && client !== connection) {
            if (message.type === "utf8") {
              console.log("Received Message: " + message.utf8Data);
              client.sendUTF(message.utf8Data);
            } else if (message.type === "binary") {
              console.log(
                "Received Binary Message of " +
                  message.binaryData.length +
                  " bytes"
              );
              client.sendBytes(message.binaryData);
            }
          }
        }
      );
    }
  );
  connection.on("close", function (reasonCode: any, description: any) {
    console.log(
      new Date() + " Peer " + connection.remoteAddress + " disconnected."
    );
  });
});

// wsServer.on("connection", (ws) => {
//   ws.on("message", (message) => {
//     // const content = JSON.parse(data.toString());

//     // console.log("data: ", content);
//     if (message.type === "utf8") {
//       console.log("Received Message: " + message.utf8Data);
//       ws.sendUTF(message.utf8Data);
//     } else if (message.type === "binary") {
//       console.log(
//         "Received Binary Message of " + message.binaryData.length + " bytes"
//       );
//       ws.sendBytes(message.binaryData);
//     }

//     wsServer.clients.forEach((client) => {
//       if (client.readyState === ws.OPEN && client !== ws) {
//         // if (content.type === "attachment") {
//         //   client.send(data.toString());
//         // } else client.send(data.toString());
//         client.send(message);
//       }
//     });
//   });
// });

// httpServer.on("upgrade", async function upgrade(request, socket, head) {
//   //emit connection when request accepted
//   wsServer.handleUpgrade(request, socket, head, function done(ws) {
//     wsServer.emit("connection", ws, request);
//   });
// });

function originIsAllowed(_origin: any) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}
