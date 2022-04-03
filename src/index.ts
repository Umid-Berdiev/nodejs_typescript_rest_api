import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import {
  index,
  getUsers,
  getUserById,
  signupUser,
  updateUser,
  deleteUser,
  loginUser,
} from "./database/queries";
import auth from "./middleware/auth";

const app = express();
const port = 8889;

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.post("/signup", signupUser);
app.post("/login", loginUser);
app.use(auth);
// console.log("auth");

app.get("/", index);

app.get("/users", getUsers);
app.get("/users/:id", getUserById);
app.put("/users/:id", updateUser);
app.delete("/users/:id", deleteUser);

app.listen(port, () => {
  console.log(`App running on port ${port}.`);
});
