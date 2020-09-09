#!/usr/bin/env node
var WebSocketServer = require('websocket').server;
var http = require('http');
var NodeRSA = require('node-rsa');

const key = new NodeRSA("-----BEGIN PUBLIC KEY-----MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAor8nQt6VVNClBUQmaNeZNeUCcfZ4IeLV1sUACZ5/fcfrgycp9ew3KtWOiHXqlFSGQp3qgMi5bhUDaGn89WqIDTfdgrTB1mIgkncWvx5H1J7ODYf7QzFalMMjdpaSbDHsDACvOAWFoBtruOR6hOH337WaNLGNZd6kbnG4wGK86PJqE0pVaYo74WzgVe+8YXM/NTCgTQy0TplzMTCkBFM9wyAU7bONuMZoggp65nvYOfvTqk3YtxUzgbIg4BfORnTwzC2UraXQTlbFzJjhsguAQ0OG2iNA+ZHjzI2uSepunlyP8woxKDliyfiqsDW24ynIjdooLJV5KqJhDHHsQZOuWQIDAQAB-----END PUBLIC KEY-----");
 
var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(process.env.PORT || 8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});
 
wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
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
    
    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    var verifyCode = "VERIFY:" + Math.floor(Math.random() * 2147483647);
    connection.sendUTF(key.encrypt(verifyCode, 'base64'));
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            if(message.utf8Data = verifyCode) {
              connection.sendUTF(key.encrypt("Verified connection!", 'base64'));
            }
            connection.sendUTF("Connection unverifiable.");
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});
