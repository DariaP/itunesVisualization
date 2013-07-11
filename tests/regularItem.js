var log = require('../broker/lib/logger.js'),
    cleanDb = require('../broker/cleanDb.js').cleanDb
    whenTaskProviderReady = require('../broker/lib/mongoTaskProvider.js'),
    Broker = require('../broker/lib/server.js'),

    Worker = require('../worker/lib/workerClient.js'),
    config = require('../worker/lib/config.js');

cleanDb();

setTimeout(function() {
  whenTaskProviderReady(function (taskProvider) {

    var broker = new Broker(taskProvider),
        worker = new Worker(config.brokerAddress);

    broker.start();

    // wait while broker is initialized
    setTimeout(
      function() {
        worker.start()
      },
      4000
    );
  });
}, 3000);
