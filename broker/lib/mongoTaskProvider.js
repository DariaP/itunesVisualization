var log = require('./logger.js'),
    configs = require('./config.js'),
    config = configs.config,
    addConnectionsValue = configs.addConnectionsValue;

function initializer(initializedCallback) {
  var mongodb = require('mongodb'),
      mongoProvider = require('../../lib/mongoDataProvider.js'),
      dbConfig = {
        mongoAddress: config.mongoAddress,
        mongoPort: config.mongoPort,
        mongoDb: config.mongoTasksDb,
        provider: mongoProvider.dbProvider.tasksProvider,
        itemsCollection: config.itemsCollection,
        tasksCollection: config.tasksCollection,
        urgentTasksCollection: config.urgentTasksCollection,
        scheduledTasksCollection: config.scheduledTasksCollection,
        tasksDoneCollection: config.tasksDoneCollection,
        tasksFailedCollection: config.tasksFailedCollection,
        waitForTaskTimeout: config.waitForTaskTimeout,
        addConnectionsAsTasks: mongoProvider.addConnectionsAsTasks.regularOnly,
        checkUrgentTaskTimeout: config.checkUrgentTaskTimeout,
        checkTaskTimeout: config.checkTaskTimeout
      };

  mongoProvider.initialize(
        mongodb,
        dbConfig,
        function(mongoItemsProvider) {
          initializedCallback(mongoItemsProvider);
        });
}

module.exports = initializer;
