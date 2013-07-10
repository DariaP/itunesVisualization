var log = require('./logger.js');
// Defines handlers for each task type:
var routeTable = {
  'parseDocument' : require('./taskRunners/documentParser.js'),
  'archive': require('./taskRunners/archiver.js')
};

// the sole purpose of the router is to match incoming task type with actual task handler
var router = {
  route : function (task, taskCompletedCallback) {
    log("Routing task: %s (%s)", task.type, task.name);
    if (routeTable.hasOwnProperty(task.type)) {
      routeTable[task.type](task, taskCompletedCallback);
    } else {
      log("Couldn't find task runner for " + task.type + ". Task dropped: ");
    }
  }
};

module.exports = router;
