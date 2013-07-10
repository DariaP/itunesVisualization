      function GraphBuilder(settings) {

        var graph = Viva.Graph.graph(), 
            renderer,
            undrawedItems,
            drawedItems,
            showOnlyFreeItems = false;

        var graphics = Viva.Graph.View.svgGraphics();

        graphics.node(function(node) {

          var ui = Viva.Graph.svg('g');

          ui.append('image')
            .attr('width', 50)
            .attr('height', 50)
            .link(node.data.picture);

          if (settings.onNodeClick) {
            $(ui).click(function (e) {
              settings.onNodeClick(node.data);
            });
          }

          if (settings.onNodeDbClick) {
            $(ui).dblclick(function (e) {
              settings.onNodeDbClick(node.data);
            });
          }

          if (!node.data.visible) {
            ui.attr('opacity', '0.2');
          }

          return ui;

        }).placeNode(function(ui, pos){
          ui.attr("transform", "translate(" + (pos.x - 25) + ", " + (pos.y - 25) + ")");
        }).link( function(link) {
          var ui = Viva.Graph.svg('path')
              .attr('stroke', 'grey');

          ui.from = graph.getNode(link.fromId);
          ui.to = graph.getNode(link.toId);

          if (!ui.from.data.visible || !ui.to.data.visible) {
            ui.attr('opacity', '0.1');
          } 
               
          return ui;
        }).placeLink(function(linkUI, fromPos, toPos) {
               
          var data = "M";
          data += Math.round(fromPos.x) + ',' + Math.round(fromPos.y);
          data += 'L' + Math.round(toPos.x) + ',' + Math.round(toPos.y);

          linkUI.attr("d", data);
        });

        renderer = Viva.Graph.View.renderer(graph, 
        {
          container: settings.container,
          graphics : graphics
        });
        renderer.run();

        this.newGraph = function(freeOnly) {
          showOnlyFreeItems = freeOnly;
          this.clean();
        };

        this.clean = function() {
          undrawedItems = {};
          drawedItems = {};
          graph.clear();
          renderer.reset();
        }

        this.newNode = function(result) {
          var i, undrawedLinks, id;
          // For some reason we got item already existing in a graph
          if (true == drawedItems[result.id]) {
            return;
          }

          if (showOnlyFreeItems == true && "Free" != result.price) {
            result.visible = false;
          } else {
            result.visible = true;
          }

          // Draw item
          graph.addNode(result.id, result);

          // Mark as drawn
          drawedItems[result.id] = true;

          // If there is a list of links from existing nodes
          // to new node (waiting for item data) - add links
          // to graph
          if (undefined !== undrawedItems[result.id]) {
            undrawedLinks = undrawedItems[result.id];
            for (i = 0 ; i < undrawedLinks.length ; i++) {
              graph.addLink(result.id, undrawedLinks[i]);
            }
          }

          // Check other connections of new item 
          for (i = 0 ; i < result.similarItemsId.length ; i++) { 
            id = result.similarItemsId[i];

            if (true == drawedItems[id]) {
              // If node exists, add link
              // Assuming that graph can be directed
              graph.addLink(result.id, id);
            } else {
              // add node and link to the list
              // of items waiting for information about them
              // (picture, title etc)
              if (undefined === undrawedItems[id]) {
                undrawedItems[id] = [result.id];
              } else {
                undrawedItems[id].push(result.id);
              }
            }
          }
        };
      };
