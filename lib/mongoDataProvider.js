
// TODO better names

var Tasks = require('./task.js');

var dbProvider = {
  dataProvider : 0,
  tasksProvider : 1
};

var addConnectionsAsTasks = {
  all : 0,
  regularOnly : 1,
  urgentOnly : 2,
  none : 3
};

function getMongoDataProvider(collections) {
   return {
      getItem : function(itemUrl, callback) {
        collections.itemsCollection.findOne({url: itemUrl}, {}, function (err, doc) {
          if (null !== doc) {
            callback(itemUrl, doc.data);
          } else {
            callback(itemUrl, null);
          }
       });
      }
    };
}

function getMongoTaskProvider(collections, dbConfig) {

  // ------ Private helpers --------------------

  // Move task from scheduled to new
  var restoreScheduledTask = function(task, discardUrgent) {

    if (!discardUrgent && Tasks.isUrgent(task)) {
      collections.urgentTasksCollection.insert(task);
    } else {
      collections.tasksCollection.insert({url : task.url});
    }
    collections.scheduledTasksCollection.remove({url : task.url});
  };

  // Call 'callback' if task is in collection
  var checkIfNotInCollection = function(collection, taskUrl, callback) {
    collection.findOne({url: taskUrl}, {}, function (err, doc) {
      if (null === doc) {
        callback(taskUrl);
      }
    });
  };

  // Call 'callback' if task is not in collection
  var checkIfIsInCollection = function(collection, taskUrl, callback) {
    collection.findOne({url: taskUrl}, {}, function (err, doc) {
      if (null !== doc) {
        callback(taskUrl);
      }
    });
  };

  // Function gets task from one of the collections
  // (Priority is an order of elements in array)
  // Or waits until something appear in any collection
  var waitForTaskInner = function(tasksCollections, i, callback) {
    tasksCollections[i].findOne({}, {}, function (err, doc) {
      if (null !== doc) {
        callback(i, doc);
      } else {
        if (i < tasksCollections.length - 1) {
          // If there are unchecked collections - continue
          waitForTaskInner(tasksCollections, ++i, callback);
        } else {
          // Schedule new check
          setTimeout(
            function() {
              console.log("Waiting for task..");
              waitForTaskInner(tasksCollections, 0, callback);
            },
            dbConfig.waitForTaskTimeout
          );
        }
      }
    });
  };
  var waitForTask = function(tasksCollections, callback) {
    waitForTaskInner(tasksCollections, 0, callback);
  };

  var shouldAddConnectionsAsTasks = function(task) {

    if (addConnectionsAsTasks.all == dbConfig.addConnectionsAsTasks) {
      return true;
    } else if (addConnectionsAsTasks.regularOnly == dbConfig.addConnectionsAsTasks) {
      if (false == Tasks.isUrgent(task)) {
        return true;
      }
    } else if (addConnectionsAsTasks.urgentOnly == dbConfig.addConnectionsAsTasks) {
      if (true == Tasks.isUrgent(task)) {
        return true;
      }
    }
    return false;
  };

  // Add items as new tasks
  addTasks = function(items) {

    for (i = 0 ; i < items.length ; i++ ) {
      checkIfNotInCollection(collections.scheduledTasksCollection, items[i], function(taskUrl) {
        checkIfNotInCollection(collections.tasksDoneCollection, taskUrl, function(taskUrl) {
          checkIfNotInCollection(collections.tasksFailedCollection, taskUrl, function(taskUrl) {
            checkIfNotInCollection(collections.tasksCollection, taskUrl, function(taskUrl) {
              collections.tasksCollection.insert({url: taskUrl});
            });
          });
        });
      });
    }
  };

  var scheduleTaskCheck = function(doc, timeout) {
    setTimeout(
      function() {
        checkIfIsInCollection(
          collections.scheduledTasksCollection,
          doc.url,
          function() {
            // TODO: pass logger as argument
            console.log("Restoring " + doc.url + " from scheduled tasks");
            // false == do not discard urgency of task
            restoreScheduledTask(doc, false);
          });
        }, 
      timeout
    );
  }

  // --------- startup sequence -------------

  // On statrup, need to restore all tasks that are scheduled
  // on previous run
  collections.scheduledTasksCollection.find({}, {})
    .toArray(function(err, docs) {
      for (var i = 0 ; i < docs.length ; ++i) {
        // true == discard urgent tasks since we don't
        // have clients for them anyway
        restoreScheduledTask(docs[i], true);
      }
    });

  // ------------ Public api ----------------

  return {

    // Call 'taskRetrievedCallback' when task is ready
    getTask : function(taskRetrievedCallback) {

      var tasksCollections = [
        collections.urgentTasksCollection,
        collections.tasksCollection
      ];

      waitForTask(
        tasksCollections, 
        function(i, doc) {
          var j, task, timeout;

          // Remove task from all collections to handle case
          // when task is scheduled in several collections
          for (j = 0 ; j < tasksCollections.length ; ++j) {
            tasksCollections[j].remove({url : doc.url});
          }

          if (i === 0) { // Urgent task - from first collection
            task = new Tasks.UrgentTask(doc.url.toString(), doc.client.toString());
            timeout = dbConfig.checkUrgentTaskTimeout;
          } else { // Regular task - from second collection
            task = new Tasks.Task(doc.url.toString());
            timeout = dbConfig.checkTaskTimeout;
          }

          // mark task as scheduled
          collections.scheduledTasksCollection.insert(doc);

          // schedule check
          // to ensure that task is processed
          scheduleTaskCheck(doc, timeout);

          // task ready,return value
          taskRetrievedCallback(task);
      });
    },

    // Add task to be scheduled immediately
    addUrgentTask : function(taskUrl, clientId) {
      collections.urgentTasksCollection.insert({url: taskUrl, client: clientId});
    },

    // Process result of a task
    saveTask : function(task) {

      // doesn't matter if task failed - unmark task as 'scheduled'
      collections.scheduledTasksCollection.remove({url: task.originalTask.name});

      if (task.taskResult.hasOwnProperty("error")) {
        collections.tasksFailedCollection.insert(task);
        return;
      }

      collections.itemsCollection.insert({url: task.originalTask.name,
                                    data: task.taskResult});

      collections.tasksDoneCollection.insert({url: task.originalTask.name});

      if (shouldAddConnectionsAsTasks(task.originalTask)) {
        // TODO: if parent was urgent - add child as urgent
        addTasks(task.taskResult.similarItems);
      }
    }

  };
}

function initialize(mongodb, dbConfig, initializedCallback) {
  var server = new mongodb.Server(dbConfig.mongoAddress, dbConfig.mongoPort, { }),
      db = mongodb.Db(dbConfig.mongoDb, server, {});

  db.open(function (err, client) {
    if (err) { throw err; }

    var collections;

    if (dbConfig.provider === dbProvider.dataProvider) {
      collections = 
      {
        itemsCollection : new mongodb.Collection(client, dbConfig.itemsCollection)
      }; 

      initializedCallback(getMongoDataProvider(collections));
    } else if (dbConfig.provider === dbProvider.tasksProvider) {
      collections = 
      {
        tasksCollection : new mongodb.Collection(client, dbConfig.tasksCollection),
        urgentTasksCollection : new mongodb.Collection(client, dbConfig.urgentTasksCollection),
        scheduledTasksCollection : new mongodb.Collection(client, dbConfig.scheduledTasksCollection),
        tasksDoneCollection : new mongodb.Collection(client, dbConfig.tasksDoneCollection),
        tasksFailedCollection : new mongodb.Collection(client, dbConfig.tasksFailedCollection),
        itemsCollection : new mongodb.Collection(client, dbConfig.itemsCollection)
      }; 
      initializedCallback(getMongoTaskProvider(collections, dbConfig));
    }
  });
}

module.exports = 
  {
    initialize : initialize,
    dbProvider : dbProvider,
    addConnectionsAsTasks : addConnectionsAsTasks
  };

