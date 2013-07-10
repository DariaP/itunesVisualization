var mongodb = require('mongodb'),
    config = require('./lib/config.js').config,
    server = new mongodb.Server(config.mongoAddress, config.mongoPort, { }),
    db = mongodb.Db(config.mongoTasksDb, server, {});

function cleanDb() {
  db.open(function (err, client) {
    if (err) { throw err; }

    var tasksCollection = new mongodb.Collection(client, config.tasksCollection),
        urgentTasksCollection = new mongodb.Collection(client, config.urgentTasksCollection),
        scheduledTasksCollection = new mongodb.Collection(client, config.scheduledTasksCollection),
        tasksDoneCollection = new mongodb.Collection(client, config.tasksDoneCollection),
        tasksFailedCollection = new mongodb.Collection(client, config.tasksFailedCollection),
        itemsCollection = new mongodb.Collection(client, config.itemsCollection);

    tasksCollection.remove();
    urgentTasksCollection.remove();
    scheduledTasksCollection.remove();
    tasksDoneCollection.remove();
    tasksFailedCollection.remove();
    itemsCollection.remove();

    tasksCollection.insert({url: "https://itunes.apple.com/us/app/temple-run/id420009108?mt=8"});

    console.log("done");

    db.close();
  });
}

module.exports =
  {
    cleanDb : cleanDb,
  };
