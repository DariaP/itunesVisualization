var log = require('./lib/logger.js'),
    whenTaskProviderReady = require('./lib/mongoTaskProvider.js'),
    Broker = require('./lib/server.js');

log('Initializing growler broker...');

whenTaskProviderReady(function (taskProvider) {
  var broker = new Broker(taskProvider);
  broker.start();
});
