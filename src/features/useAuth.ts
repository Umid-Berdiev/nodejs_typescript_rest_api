import { NextFunction, Request, Response } from "express";
import { pool } from "../database/connect";
import crypto from "crypto";

export default (request: any) => {
  const token = request.headers.token || null;

  const hash = crypto.createHash("sha256").update(token).digest("base64");

  pool.query(
    "SELECT * FROM session WHERE token = $1",
    [hash],
    (error: any, result: any) => {
      if (error) throw error;
      return result.rows[0];
    }
  );
};
