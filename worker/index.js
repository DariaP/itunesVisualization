var Worker = require('./lib/workerClient.js');
var config = require('./lib/config.js');
var worker = new Worker(config.brokerAddress);

worker.start();
