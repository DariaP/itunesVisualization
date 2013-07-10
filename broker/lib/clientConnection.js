var log = require('./logger.js'),
    task = require('../../lib/task.js'),
    config = require('./config.js').config;
/**
* Represents a single connection with a worker
* @param {Stream} clientStream a socket.io compatible stream of data
* @param {Object} tasksRepository provider of tasks;
*/
function NetBrokerClientConnection(clientStream, server, tasksRepository) {

  var sendNextTask = function (task) {
    log("Task " + task.name + " is scheduled for execution by client");
    clientStream.emit("processTask", task);
  };

  clientStream.on('waitingForTask', function (clientInfo) {
    log("Client " + clientInfo.name + " is ready for a task. Scheduling...");

    // schedule with timeout, to prevent
    // requesting itunes too often
    tasksRepository.getTask(function(task) {
      setTimeout(
        function() {
          sendNextTask(task);
        },
        config.sendTaskTimeout
      );
    });
  });

  clientStream.on('requestingItem', function (taskUrl) {
    log("Added urgent task " + taskUrl + ", waiting for result...")
    tasksRepository.addUrgentTask(taskUrl, clientStream.id);
  });

  clientStream.on('taskDone', function (taskResult){
    tasksRepository.saveTask(taskResult);

    if (task.isUrgent(taskResult.originalTask)) {
      server.processUrgentResult(taskResult);
    }
  });
}

module.exports = NetBrokerClientConnection;
