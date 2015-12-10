#!/usr/bin/env node

var net = require('net');

var portRegex = /^(\d+)$/
var addrRegex = /^(?:([A-Za-z0-9\.\-]+):)?(\d+)$/

var errorHandler = function(e) {
  console.log(e);
  process.exit(1);
}

var destinationAddr = process.argv.pop()
var sourcePort = process.argv.pop()

if (!sourcePort.match(portRegex) || !destinationAddr.match(addrRegex)) {
  console.log("Usage: mapport sourcePort [destinationHost:]destinationPort");
  return;
}

var destinationHost = addrRegex.exec(destinationAddr)[1] || "localhost";
var destinationPort = addrRegex.exec(destinationAddr)[2];

var server = net.createServer(function(sourceConn){
  var destinationConn = net.createConnection({
    host: destinationHost,
    port: destinationPort
  });

  destinationConn.on("error", errorHandler);

  sourceConn.pipe(destinationConn);
  destinationConn.pipe(sourceConn);
});

server.on("error", errorHandler);
server.listen(sourcePort, function(){
  console.log("Mapping " + sourcePort + " ➜ " + destinationHost + ":" + destinationPort);
});
