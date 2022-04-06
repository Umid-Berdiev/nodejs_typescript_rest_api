import express, { Request, Response } from "express";
import { WebSocketServer } from "ws";
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

const wsServer = new WebSocketServer({ port: 8887 });

wsServer.on("connection", (ws) => {
  ws.on("message", (data) => {
    const content = JSON.parse(data.toString());
    console.log("data: ", content);

    wsServer.clients.forEach((client) => {
      if (client.readyState === ws.OPEN && client !== ws) {
        if (content.type === "attachment") {
          client.send(data.toString());
        } else client.send(data.toString());
      }
    });
  });
});

httpServer.on("upgrade", async function upgrade(request, socket, head) {
  //emit connection when request accepted
  wsServer.handleUpgrade(request, socket, head, function done(ws) {
    wsServer.emit("connection", ws, request);
  });
});
