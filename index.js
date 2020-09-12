#!/usr/bin/env node
let WebSocketServer = require('websocket').server;
let http = require('http');
let NodeRSA = require('node-rsa');
let aesjs = require('aes-js');
let crypto = require('crypto');

const rsakey = new NodeRSA("-----BEGIN PUBLIC KEY----- MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAor8nQt6VVNClBUQmaNeZNeUCcfZ4IeLV1sUACZ5/fcfrgycp9ew3KtWOiHXqlFSGQp3qgMi5bhUDaGn89WqIDTfdgrTB1mIgkncWvx5H1J7ODYf7QzFalMMjdpaSbDHsDACvOAWFoBtruOR6hOH337WaNLGNZd6kbnG4wGK86PJqE0pVaYo74WzgVe+8YXM/NTCgTQy0TplzMTCkBFM9wyAU7bONuMZoggp65nvYOfvTqk3YtxUzgbIg4BfORnTwzC2UraXQTlbFzJjhsguAQ0OG2iNA+ZHjzI2uSepunlyP8woxKDliyfiqsDW24ynIjdooLJV5KqJhDHHsQZOuWQIDAQAB -----END PUBLIC KEY-----");

let server = http.createServer(function(request, response) {
  console.log((new Date()) + ' Received request for ' + request.url);
  response.writeHead(404);
  response.end();
});
server.listen(process.env.PORT || 8080, function() {
  console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
  httpServer: server,
  autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {
  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
    return;
  }
  let connection;
  try {
    connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    let key = crypto.randomBytes(32);
    let iv = crypto.randomBytes(16);
    let verifyCode = Math.floor(Math.random() * 2147483647);
    connection.sendUTF(rsakey.encrypt(JSON.stringify({
      "VERIFY": verifyCode,
      "KEY": key.toString("base64"),
      "IV": iv.toString("base64")
    }), 'base64'));
    connection.on('message', function(encmessage) {
      let aes = new aesjs.ModeOfOperation.cbc(key, iv);
      let message = aesjs.utils.utf8.fromBytes(aes.decrypt(Buffer.from(encmessage.utf8Data, 'base64')));
      if (encmessage.type === 'utf8') {
        try {
          console.log('Received Message: ' + message);
          if(JSON.parse(message).VERIFY = verifyCode) {
            console.log(JSON.parse(message).POS);
            aes = new aesjs.ModeOfOperation.cbc(key, iv);
            gnvc();
            connection.sendUTF(Buffer.from(aes.encrypt(JSON.stringify({
              "VERIFY": verifyCode
            }))).toString("base64"));
          } else {
            connection.sendUTF("Connection unverifiable.");
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
    connection.on('close', function(reasonCode, description) {
      console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
    function gnvc(){
      verifyCode = Math.floor(Math.random() * 2147483647);
    }
  } catch(e) {
    wsServer.close();
    console.error(e);
  }
});
