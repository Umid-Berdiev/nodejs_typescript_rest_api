import express, { Request, Response } from "express";
import WebSocket from "ws";
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
import useAuth from "./features/useAuth";

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

const wsServer = new WebSocket.Server({
  noServer: true,
});

wsServer.on("connection", (ws) => {
  ws.on("message", (msg) => {
    const text = msg.toString();
    wsServer.clients.forEach((client) => {
      if (client.readyState === ws.OPEN && client !== ws) {
        client.send(text);
      }
    });
  });
});

httpServer.on("upgrade", async function upgrade(request, socket, head) {
  // accepts half requests and rejects half. Reload browser page in case of rejection
  // if (Math.random() > 0.5) {
  //   return socket.end("HTTP/1.1 401 Unauthorized\r\n", "ascii"); //proper connection close in case of rejection
  // }

  //emit connection when request accepted
  wsServer.handleUpgrade(request, socket, head, function done(ws) {
    wsServer.emit("connection", ws, request);
  });
});
