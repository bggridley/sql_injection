// https://github.com/cawilson1/sql_injection_mysql_node/blob/master/index.js
require("dotenv").config();
const express = require("express");
const sql = require("mysql2/promise");
const bodyParser = require("body-parser");
const cors = require("cors");

const PORT = 4000;
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

const pool = sql.createPool({
  host: process.env.HOST,
  user: process.env.DB_USER,
  password: process.env.PASSWORD
});

const API_PREFIX = "victim";

app.post(`/${API_PREFIX}/user`, async (request, response) => {
  try {
    console.log("POST USER");
    if (!request.body.username || !request.body.password) {
      response.status(400).send({ message: "no username entered" });
    }
    const conn = await pool.getConnection();
    const queryResponse = await conn.execute(
      `INSERT INTO vulnsql.user (username, password, ssn, bankAcct) VALUES ('${request.body.username}', '${request.body.password}', '${request.body.ssn}', '${request.body.bankAcct}')`
    );
    conn.release();
    console.log(queryResponse);
    response.status(200).send({ message: queryResponse });
  } catch (error) {
    console.log(error);
    response.status(500).send({ message: error });
  }
});

app.get(`/${API_PREFIX}/user`, async (request, response) => {
  try {
    console.log("GET ONE USER");
    if (!request.query.username || !request.query.password) {
      response.status(400).send({ message: "no username or password entered" });
    }
    const query = `SELECT * FROM vulnsql.user WHERE username = ? AND password = ?`;
    console.log(query);
    const conn = await pool.getConnection();
    const recordset = await pool.execute(query, [request.query.username, request.query.password]);
    console.log(recordset[0]);
    conn.release();
    response.status(200).send({ message: recordset[0] });
  } catch (error) {
    response.status(500).send({ message: error });
  }
});

//update a user
app.put(`/${API_PREFIX}/user`, async (request, response) => {
  try {
    console.log("PUT USER");
    if (!request.body.username || !request.body.password) {
      response.status(400).send({ message: "no username or password entered" });
    }
    const conn = await pool.getConnection();
    const queryResponse = await conn.execute(
      `UPDATE vulnsql.user SET password = '${request.body.password}', ssn = '${request.body.ssn}', bankAcct = '${request.body.bankAcct}' WHERE username = '${request.body.username}' AND password = '${request.body.password}'`
    );
    conn.release();
    console.log(queryResponse);
    response.status(200).send({ message: queryResponse });
  } catch (error) {
    console.log(error);
    response.status(500).send({ message: error });
  }
});

app.listen(PORT, () => console.log(`server running on port ${PORT}`));