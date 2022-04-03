import { NextFunction, Request, Response } from "express";
import { pool } from "../database/connect";
import crypto from "crypto";

export default (request: any, response: Response, next: NextFunction) => {
  const token = request.headers.token || null;

  if (!token) return response.status(401).send("Unauthorized!");

  const hash = crypto.createHash("sha256").update(token).digest("base64");

  pool.query(
    "SELECT * FROM session WHERE token = $1",
    [hash],
    (error: any, result: any) => {
      if (error) throw error;
      return next();
    }
  );
};
