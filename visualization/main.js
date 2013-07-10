            
    function onLoad() {

      // To prevent showing item if something fails
      $('#itemData').hide();

      function DataClient(url, dataCallback, connectionClosedCallback) {

        var serverUnavailable = function () {
          // TODO after timeout, try to reconnect to the server
          // and remove this text if successfully connected
          $('#itemData').text("Temporary unavailable");
          $('#itemData').show();
          connectionClosedCallback();
        };

        if (typeof io === 'undefined') {
          serverUnavailable();
        }

        var socket = io.connect(url);
        socket.on('data', dataCallback);
        socket.on('disconnect', function() {
          serverUnavailable();
        });

        this.requestData = function(url) {
          var task = { url : url, 
                       depth : 3 };
          socket.emit('getItem', task);
        }

        this.reset = function(url) {
          socket.emit('reset');
        }
      };

      var showItemInfo = function(item) {

        $('#title').text(item.title);
        $('#linkInner').attr("href", item.url);

        $('#author').text(item.author);
        $('#category').text("category: " + item.category);

        $('#price').text(item.price);
        if ("Free" == item.price) {
          $('#price').css("color", "green");
        } else {
          $('#price').css("color", "red");
        }

        $('#description').html(item.description);

        var i, screenshots = "", width = 0;
        for (i = 0 ; i < item.screenshots.length ; ++i) {
          width += 110;
          screenshots += "<img src='" + item.screenshots[i] + "'/>"
        }
        // TODO enlarge images on click
        $('#screenshotsInner').html(screenshots);
        $('#screenshotsInner').width(width + "px");

        $('#itemData').show();
      };

      // onNodeClickCallback = showItemInfo
      function getOnClickCallback() {
        var nowShowing = null;
        return function(item) {
          if (item.id === nowShowing) {
            $('#itemData').hide();
            nowShowing = null;
          } else {
            nowShowing = item.id;
            showItemInfo(item);
          }
        }
      }

      graphBuilder = new GraphBuilder({
        container : document.getElementById('graph'),
        onNodeClick : getOnClickCallback(),
        onNodeDbClick : function(item) {
          dataClient.requestData(item.url);
        }
      });

      dataClient = new DataClient('http://localhost:9999',
                                   graphBuilder.newNode,
                                   graphBuilder.clean);

      $('.navbar-form').submit(function(e) {
        e.preventDefault();

        $('#itemData').hide();

        var freeOnly = $('#showFreeCheckbox').is(':checked');
        graphBuilder.newGraph(freeOnly);

        dataClient.reset();
        dataClient.requestData($('#item').val());
      });
    };
