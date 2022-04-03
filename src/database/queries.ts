import { Request, Response } from "express";
import { pool } from "./connect";
import bcrypt from "bcrypt";
import crypto, { BinaryLike } from "crypto";

import fromBase64 from "base64url";
import { User } from "../interfaces/User";

export const index = (request: Request, response: Response) => {
  const blogs = [
    {
      title: "Yoshi finds eggs",
      snippet: "Lorem ipsum dolor sit amet consectetur.",
    },
    {
      title: "Mario finds stars",
      snippet: "Lorem ipsum dolor sit amet consectetur.",
    },
    {
      title: "How to defeat bowser",
      snippet: "Lorem ipsum dolor sit amet consectetur.",
    },
  ];

  response.json(blogs);
};

export const getUsers = (request: Request, response: Response) => {
  pool.query("SELECT * FROM users", (error: any, result: any) => {
    if (error) throw error;
    const users = result.rows?.map((user: User) => ({
      username: user.username,
      email: user.email,
      id: user.id,
    }));

    response.status(200).json(users);
  });
};

export const getUserById = (request: Request, response: Response) => {
  const userId = parseInt(request.params.id);

  pool.query(
    "SELECT * FROM users WHERE id = $1",
    [userId],
    (error: any, result: any) => {
      if (error) throw error;
      const foundUser = { ...result.rows[0] };
      delete foundUser.password;
      response.status(200).json(foundUser);
    }
  );
};

// signup user
export const signupUser = async (request: Request, response: Response) => {
  const { username, email, password } = request.body;
  // console.log(request.body);

  if (!(username && email && password)) {
    return response.status(400).send({ error: "Data not formatted properly" });
  }

  // now we set user password to hashed password
  const salt = await bcrypt.genSalt(10);
  const hashedPwd = await bcrypt.hash(password, salt);

  pool.query(
    "INSERT INTO users (username, email, password) VALUES($1, $2, $3)",
    [username, email, hashedPwd],
    async (error: any, result: any) => {
      if (error) throw error;

      // now we set token and hashed token
      const token: BinaryLike = await new Promise((resolve, reject) => {
        crypto.randomBytes(16, (error, data) => {
          error ? reject(error) : resolve(fromBase64(data.toString("base64")));
        });
      });

      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("base64");

      pool.query(
        "INSERT INTO session (token, user_id) VALUES($1, $2)",
        [hashedToken, result.rows[0]?.id],
        (error: any, result2: any) => {
          if (error) throw error;
          response.status(201).send({ token, user_id: result.rows[0]?.id });
        }
      );
    }
  );
};

export const updateUser = (request: Request, response: Response) => {
  const userId = request.params.id;
  const { username, email, password } = request.body;

  pool.query(
    "UPDATE users SET username = $1, email = $2, password = $3 WHERE id = $4",
    [username, email, password, userId],
    (error: any, result: any) => {
      if (error) throw error;
      response.status(200).send(`User modified with ID: ${userId}`);
    }
  );
};

export const deleteUser = (request: Request, response: Response) => {
  const userId = request.params.id;

  pool.query(
    "DELETE FROM users WHERE id = $1",
    [userId],
    (error: any, result: any) => {
      if (error) throw error;
      response.status(200).send(`User deleted with ID: ${userId}`);
    }
  );
};

// login route
export const loginUser = async (request: Request, response: Response) => {
  const body = request.body;
  // console.log("body: ", body);

  pool.query(
    "SELECT * FROM users WHERE email = $1",
    [body.email],
    async (error: any, result: any) => {
      // console.log("result: ", result);

      if (error) throw error;

      // check user password with hashed password stored in the database
      const validPassword = await bcrypt.compare(
        body.password,
        result.rows[0]?.password
      );
      if (validPassword) {
        const user = result.rows[0];

        const token: BinaryLike = await new Promise((resolve, reject) => {
          crypto.randomBytes(16, (error, data) => {
            error
              ? reject(error)
              : resolve(fromBase64(data.toString("base64")));
          });
        });

        const hashedToken = crypto
          .createHash("sha256")
          .update(token)
          .digest("base64");

        pool.query(
          "INSERT INTO session (token, user_id) VALUES($1, $2)",
          [hashedToken, result.rows[0]?.id],
          (error: any, result2: any) => {
            if (error) throw error;
            // response.status(201).send({ token, user_id: result.rows[0]?.id });
            delete user.password;
            response
              .status(201)
              .header({ Authorization: token })
              .json({ token, ...user });
          }
        );
      } else {
        response.status(400).json({ error: "Invalid Password" });
      }
    }
  );
};
