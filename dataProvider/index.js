
var request = require('./node_modules/request'),
    cheerio = require('cheerio'),
    downloadAndParse = require('../lib/documentParser.js')(request, cheerio),
    socketIo = require('socket.io');

function getItemAndConnected(itemsProviders, url, depth, gotten, callback) {

  if (depth == 0 || gotten[url] >= depth) {
    console.log("skipping item " + url);
    return;
  }

  console.log("requesting item " + url);

  var i = 0;

  var getItem = function(itemsProviders, url, callback) {
    var getItemInner = function(itemsProviders, i, url, callback) {
      if (i < itemsProviders.length) {
        itemsProviders[i].getItem(url, function (url, result) {
          if (null !== result) {
            callback(url, result);
          } else {
            getItemInner(itemsProviders, ++i, url, callback);
          }
        });
      }
    }

    var i = 0;
    getItemInner(itemsProviders, i, url, callback);
  }

  getItem(itemsProviders, url, function (url, result) {
    var i;
    callback(url, result);
    gotten[url] = depth;
    for(i = 0 ; i < result.similarItems.length; ++i) {
      getItemAndConnected(itemsProviders, result.similarItems[i], depth - 1, gotten, callback);
    }
  });

}

function initializeDb(initializedCallback) {
  var mongodb = require('mongodb'),
      mongoDataProvider = require("../lib/mongoDataProvider.js"),
      config = require('./config.js'),
      dbConfig = {
        mongoAddress: config.mongoAddress,
        mongoPort: config.mongoPort,
        mongoDb: config.mongoTasksDb,
        provider: mongoDataProvider.dbProvider.dataProvider,
        itemsCollection: config.itemsCollection
      };

  mongoDataProvider.initialize(
        mongodb,
        dbConfig,
        function(mongoItemsProvider) {
          initializedCallback(mongoItemsProvider);
        });
}

function initializeGrowlerClient(initializedCallback) {
  var client = require('socket.io-client');
  // TODO move to config
  var socket = client.connect('http://localhost:19999');
  var tasks = {};
  socket.on('connect', function () {
    socket.on('itemData', function (itemData) {
      // item data is similar to structure returned from downloadAndParse()
      // with additional field - url
      var callback = tasks[itemData.url];
      delete tasks[itemData.url];

      if (itemData.error) {
        console.log("Failed to get data for item " + itemData.url);
        return;
      }

      if (undefined != callback) {
        callback(itemData.url, itemData);
      } else {
        console.log("CANT find callback for " + itemData.url);
      }
    })

    var growlerItemsProvider = {
      getItem : function(itemUrl, callback) {
        // Since we have to wait for broker responce,
        // save callback specific for this url for later
        tasks[itemUrl] = callback;
        socket.emit('requestingItem', itemUrl);
      }
    };

    initializedCallback(growlerItemsProvider);
  })
}

function initializeDownloader(initializedCallback) {
  initializedCallback( 
    { 
      getItem : function(itemUrl, callback) {
        downloadAndParse(itemUrl, function(err, url, result) {
          if (err) {
            console.log("Error parsing " + url + ", err message: '" + err.errorComment + "', err value : " + err.errorValue);
          } else {
            callback(url, result);
          }
        });
      }
    }
  );
}

function initializeNetwork(itemsProviders) {
  // TODO move to config
  var io = socketIo.listen(9999, { log: false });

  console.log("Ready");

  io.sockets.on('connection', function (socket) {
    gotten = [];

    socket.on('reset', function (task) {
      gotten = [];
    });

    socket.on('getItem', function (task) {
      getItemAndConnected(itemsProviders, // Provider to ask for item data
                          task.url,       // Url of first item
                          task.depth,     // Depth of children graph for the item
                          gotten,         // List of items already requested
                                          // by this client - to avoid downloading
                                          // the same item twice
                          function(url, result) { // Callback to call on each item
                            result.url = url;
                            socket.emit('data', result);
                          });
    });
  });
}

// first is 'node', second is a path to the script
var mode = process.argv[2];

if ("web" == mode) {
  initializeDownloader(
    function (webItemsProvider) {
      initializeNetwork([webItemsProvider]);
    });
} else if ("db" == mode) {
  initializeDb( 
    function (dbItemsProvider) {
      initializeNetwork([dbItemsProvider]);
    }
  );
} else {
  initializeDb( function (dbItemsProvider) {
    initializeGrowlerClient(function (growlerItemsProvider) {
      var providers = [dbItemsProvider, growlerItemsProvider];
      initializeNetwork(providers);
    })
  });
}



