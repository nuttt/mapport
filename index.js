#!/usr/bin/env node

var net = require('net');
var cluster = require('cluster');

// master process
if (cluster.isMaster) {
  cluster.fork();
  process.on('SIGTERM', function(){
    process.exit(0);
  });

  cluster.on('exit', function(worker, code, signal) {
    if(code != 0){
      console.log("worker " + worker.id + ": exit (code=exited, status=" + code + ")");
      cluster.fork()
    }
  });

// main task
} else {
  var portRegex = /^(\d+)$/
  var addrRegex = /^(?:([A-Za-z0-9\.\-]+):)?(\d+)$/

  var errorHandler = function(text) {
    return function(e) {
      console.log("mapport: " + text);
      console.log(e.stack);
      // process.exit(1);
    }
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

    sourceConn.on("error", errorHandler("Source Connection Error"));
    destinationConn.on("error", errorHandler("Destination Connection Error"));

    sourceConn.pipe(destinationConn);
    destinationConn.pipe(sourceConn);
  });

  server.on('error', (e) => {
    if (e.code == 'EACCES') {
        console.log("Non-privileged user (not root) can't open a listening socket on ports below 1024.");
    }else{
        console.log("Source Server Error");
    }
  });
  server.listen(sourcePort, function(){
    console.log("Mapping " + sourcePort + " --> " + destinationHost + ":" + destinationPort);
  });
}
