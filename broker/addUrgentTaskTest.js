
  var client = require('socket.io-client');
  var socket = client.connect('http://localhost:19999');
  socket.on('connect', function () {
    socket.on('itemData', function (itemData) {
      console.log(itemData);
    })
    socket.emit('requestingItem', "https://itunes.apple.com/us/app/youtube/id544007664?mt=8");
    console.log("done");
  });

