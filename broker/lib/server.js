var config = require('./config.js').config,
    log = require('./logger.js'),
    NetBrokerClientConnection = require('./clientConnection.js');

/* This class is responsible for handling incoming workers connections
 * @param {Object} tasksRepository - provider of tasks.
 */
function NetBrokerServer(tasksRepository) {
  if (!tasksRepository) {
    throw new Error("Task repository was not defined");
  }
  this._tasksRepository = tasksRepository;
}

NetBrokerServer.prototype.start = function () {
  this._clients = {};
  this._lastClientId = 0;
  this._server = require('socket.io').listen(config.brokerPort, { log: false });
  this._server.on('connection', this._onClientConnected.bind(this));
  log("Net broker server started");
};

NetBrokerServer.prototype._onClientConnected = function (clientSocket) {
  // Give every client a unique id and save new client in dict
  var client = {socket : clientSocket,
                id : this._lastClientId,
                emit: function(task, data) {
                  clientSocket.emit(task, data);
                },
                on: function(message, callback) {
                  clientSocket.on(message, callback);
                }};
  this._clients[this._lastClientId++] = client;

  var clientConnection = new NetBrokerClientConnection(client, this, this._tasksRepository);
  log("New worker connected");
};

NetBrokerServer.prototype.processUrgentResult = function(taskResult) {
  var client = this._clients[taskResult.originalTask.client],
      result;
  if (taskResult.taskResult.error) {
    result = { error: true, url: taskResult.originalTask.name };
  } else {
    result = taskResult.taskResult;
    result.url = taskResult.originalTask.name;
  }

  client.emit("itemData", result);
};

module.exports = NetBrokerServer;
