var addConnectionsValue = {
  all : 0,
  regularOnly : 1,
  urgentOnly : 2,
  none : 3
};

var config = {
  brokerPort: 19999,
  mongoAddress: "0.0.0.0", // change me
  mongoPort: 29999,
  mongoTasksDb: 'changeme',
  tasksCollection: "changeme",
  urgentTasksCollection: "changeme",
  scheduledTasksCollection: "changeme",
  tasksDoneCollection: "changeme",
  tasksFailedCollection: "changeme",
  itemsCollection: "changeme",
  waitForTaskTimeout: 500, // in miliseconds
  sendTaskTimeout: 500, // in miliseconds
  checkTaskTimeout: (10 * 1000), // in miliseconds
  checkUrgentTaskTimeout: (5 * 1000), // in miliseconds
  // TODO use this config instead of hardcoded value
  addConnectionsAsSubtasks: addConnectionsValue.all
};

module.exports = { 
                   config : config,
                   addConnectionsValue : addConnectionsValue
                 }
