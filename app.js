const express = require("express");
const cors = require("cors");
const app = express();
const request = require("request");
require("dotenv").config();

const servers = [
  {
    ip: process.env.SERVER_1_IP,
    port: process.env.SERVER_1_PORT,
  },
  {
    ip: process.env.SERVER_2_IP,
    port: process.env.SERVER_2_PORT,
  },
  {
    ip: process.env.SERVER_3_IP,
    port: process.env.SERVER_3_PORT,
  },
];
let currentIndex = 0;

function getNextServer() {
  const server = servers[currentIndex];
  currentIndex = (currentIndex + 1) % servers.length;
  return server;
}

function sendRequestToServer(req, res) {
  const server = getNextServer();
  const url = `http://${server.ip}:${server.port}${req.originalUrl}`;
  req.pipe(request(url)).pipe(res);
}

app.use((req, res, next) => {
  const currentDate = new Date().toLocaleString();
  const server = getNextServer();
  const url = `http://${server.ip}:${server.port}${req.originalUrl}`;
  if (res.statusCode >= 400) {
    console.error(
      `${currentDate} - Error: ${res.statusCode} ${res.statusMessage} - ${req.method} ${req.url}`
    );
    if (res.locals.errorMessage) {
      console.error(`Payload: ${res.locals.errorMessage}`);
    }
  } else {
    console.log(`${currentDate} - ${req.method} ${url}`);
    if (req.body) {
      console.log(`Payload: ${JSON.stringify(req.body)}`);
    }
  }
  next();
});

app.use(cors());

app.all("*", (req, res) => {
  if (servers.length === 0) {
    res.status(500).send("No servers available");
    return;
  }

  sendRequestToServer(req, res);
});

const PORT = process.env.PORT;
const IP_ADDRESS = process.env.IP_ADDRESS;
app.listen(PORT, IP_ADDRESS, () => {
  console.log(`Load balancer running on http://${IP_ADDRESS}:${PORT}`);
});
