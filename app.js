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

function sendRequestToServer(req, res, attempt = 0) {
 const server = getNextServer();
 const url = `http://${server.ip}:${server.port}${req.originalUrl}`;
 const requestOptions = {
    url: url,
    method: req.method,
    headers: req.headers,
    body: req.body,
    timeout: 1000,
 };

 const proxyRequest = request(requestOptions);

 proxyRequest.on('error', function(err) {
    console.error(`Error al conectar con el servidor: ${err.message}`);
    if (attempt >= servers.length - 1) {
      res.status(500).send("No servers available");
    } else {
      sendRequestToServer(req, res, attempt + 1);
    }
 });

 proxyRequest.on('response', function(response) {
    response.pipe(res);
    logServerResponse(req, server);
 });

 req.pipe(proxyRequest);
}

function logServerResponse(req, server) {
 const currentDate = new Date().toISOString();
 console.log(`${currentDate}: ${req.method}: ${server.ip}:${server.port}${req.originalUrl}`);
 if (req.body) {
    console.log(`Payload: ${JSON.stringify(req.body)}`);
 }
}

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
