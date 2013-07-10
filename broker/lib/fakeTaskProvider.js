var log = require('./logger.js'),
    Task = require('./task.js');
// This is super simple task provider for easy testing. It doesn't
// save or retrieve any tasks.
var fakeTasksRepository = {
  getTask : function (taskCallback) {
    // fake client needs to be async.
    setTimeout(function () {
      log("Sending dummy task");
      taskCallback(new Task("Dummy " + Math.random() * 100));
    }, 0);
  },
  saveTask: function (taskResult) {
    setTimeout(function () {
      log("Saving task...");
      console.dir(taskResult);
    }, 0);
  }
};

module.exports = function (initializedCallback) {
  setTimeout(function () {
    initializedCallback(fakeTasksRepository);
  }, 0);
};
