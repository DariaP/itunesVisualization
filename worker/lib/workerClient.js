var taskRouter = require('./taskRouter.js');

function log(msg) {
  console.log(msg);
}

function WorkerClient(brokerAddress) {
  this._brokerAddress = brokerAddress;
  // Let's identify ourself. Could also include host name, etc.
  this._workerInfo = {
    name : "Worker 1",
    version: 0.1
  };
}

WorkerClient.prototype.start = function () {
  var self = this;
  this._client = require('socket.io-client');
  this._socket = this._client.connect(this._brokerAddress);
  log("Connecting to the broker: " + this._brokerAddress);
  this._socket.on('connect', function () {
    log("Connected to the broker. Waiting for tasks.");
    self._socket.on('processTask', self._handleProcessTaskRequest.bind(self));
    self._emitReadyForNextTask();
  });
};

WorkerClient.prototype._handleProcessTaskRequest = function(task) {
  log("Received task from broker: " + task.name);
  taskRouter.route(task, this._onTaskCompleted.bind(this));
};

WorkerClient.prototype._onTaskCompleted = function (taskResult){
  this._socket.emit('taskDone', taskResult);
  this._emitReadyForNextTask(); // give me more!
};

WorkerClient.prototype._emitReadyForNextTask = function () {
  // let sever know we are ready for tasks:
  this._socket.emit('waitingForTask', this._workerInfo);
};

module.exports = WorkerClient;
