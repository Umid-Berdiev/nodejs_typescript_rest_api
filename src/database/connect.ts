const Pool = require("pg").Pool;

export const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "postgres",
  database: "rest_api_db",
  port: 5432,
});
