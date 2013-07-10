
var getDownloadAndParseFunc = function(request, cheerio) {
  return function(url, callback) {
    downloadAndParse(request, cheerio, url, callback);
  }
}

/* Will call 'callback' with arguments (err, url, result)
 * result is a structure with fields:
 * id (string)
 * similarItems (array of strings)
 * similarItemsId (array of strings)
 * screenshots (array of strings)
 * title (string)
 * author (string)
 * description (string of html)
 * picture (string)
 * price (string)
 * category (string)
 * version (string)
 * rating (number in a form of string - appstore rating)
 * currentVersionRating (string - customers rating)
 * allVersionsRating (string - customers rating)
 * if 'err' is not undefined, it will contain fields:
 * errorComment
 * errorValue
 * 'result' will be partially filled
 */
var downloadAndParse = function(request, cheerio, url, callback) {

  request({ uri:url }, function (error, response, body) {
    if (error) {
      console.log('Error when contacting ' + url + ', error: ' + error);
      callback(
        {
          errorComment: 'Error when contacting ' + url + ' (error)',
          errorValue: error
        },
        url,
        {}
      );
    } else if (response.statusCode !== 200) {
      callback(
        {
          errorComment: 'Error when contacting ' + url + ' (returned status)',
          errorValue: response.statusCode
        },
        url,
        {}
      );
    } else {
      var $ = cheerio.load(body);

      var result = {similarItems : [],
                    similarItemsId : [],
                    screenshots : []},
          h2, div, href,
          content, title, centerStack, screenshots,
          leftStack, productData,
          customerRatings, customerRatingsArray = [],

          resultStringFields = ["title",
                                "author",
                                "description",
                                "picture",
                                "price",
                                "category",
                                "version",
                                "rating",
                                "currentVersionRating", 
                                "allVersionsRating"],
          resultArrayFields = ["similarItems",
                               "similarItemsId",
                               "screenshots"],
          j, fieldName, arrayValue,
          err = undefined;

      result.id = url.match(/\/id([0-9]*)/)[1];

      h2 = $("h2:contains('Customers Also Bought')");
      div = h2.parent('div').parent('div').find('.small');

      div.each(function(){
        href = $(this).find(".artwork-link").attr('href');
        result.similarItems.push(href);
        result.similarItemsId.push(href.match(/\/id([0-9]*)/)[1]);
      })

      // item data
      
      content = $("#desktopContentBlockId");

      title = content.find("#title").find(".left");
      result.title = title.find("h1").html();
      result.author = title.find("h2").html();
      // Check 'author' now because we want to apply
      // 'substring' method to result - will fail if null
      if (null === result.author ) {
        callback(
          {
            errorComment: 'Error parsing author',
            errorValue: 0
          },
          url,
          result
        );
        return;
      }
      result.author = result.author.substring("By ".length);

      centerStack = content.find(".center-stack");

      result.description = centerStack.find("h4:contains('Description')")
                                   .parent('div')
                                   .find('p')
                                   .html();

      screenshots = centerStack.find(".screenshots")
                                   .find('img');

      screenshots.each(function(){
        result.screenshots.push($(this).attr('src'));
      })

      leftStack = content.find("#left-stack");

      productData = leftStack.find(".product");

      result.picture = productData.find(".artwork").find('img').attr('src');
      result.price = productData.find(".price").html();
      result.category = productData.find(".genre").find("a").html();

      // helper to get version: gets only actual text of element
      // without children tags
      var justText = function(query) {
          return query.clone()
                  .children()
                  .remove()
                  .end()
                  .text();
      };

      result.version = productData.find("span:contains('Version')")
                               .parent('li').text().match(/Version: ([0-9.]*)/)[1];
      result.rating = productData.find(".app-rating")
                                 .find("a")
                                 .html();
      // Check 'rating' now because we want to apply
      // 'substring' method to result - will fail if null
      if (null === result.rating ) {
        callback(
          {
            errorComment: 'Error parsing rating',
            errorValue: 0
          },
          url,
          result
        );
        return;
      }
      result.rating = result.rating.substring("Rated ".length);

      // ratings may or may not exist

      customerRatings = leftStack.find(".customer-ratings").find("div");

      customerRatings.each(function(){
        customerRatingsArray.push($(this));
      })

      result.currentVersionRating = "Not available";
      result.allVersionsRating = "Not available";

      for (i = 0 ; i < customerRatingsArray.length ; ++i) {

        if ("All Versions:" === customerRatingsArray[i].text()) {
          result.allVersionsRating = customerRatingsArray[++i].attr("aria-label");
        }
        if ("Current Version:" === customerRatingsArray[i].text()) {
          result.currentVersionRating = customerRatingsArray[++i].attr("aria-label");
        }
      }

      // check result

      // Will not change 'result' unless there is an error,
      // in this case will fill 'result' with error data
      checkString = function(stringToCheck, fieldName, resultStructure) {
        if ("string" != typeof(stringToCheck)) {
          err = { 
                          error: true,
                          errorComment: "Error parsing " + fieldName,
                          errorValue: resultBuff };
        }
      };

      for (i = 0 ; i < resultStringFields.length ; ++i) {
        fieldName = resultStringFields[i];
        if ("string" != typeof(result[fieldName])) {
          err = { 
            errorComment: "Error parsing " + fieldName,
            errorValue: 0
          };
        }
      }

      for (i = 0 ; i < resultArrayFields.length ; ++i) {
        fieldName = resultStringFields[i];
        arrayValue = result[fieldName];
        if (0 === arrayValue.length) {
            err = { 
              errorComment: "Error parsing " + fieldName + ", array is empty",
              errorValue: 0
            };
        }
        for (j = 0 ; j < arrayValue.length ; ++j) {
          if ("string" != typeof(arrayValue[j])) {
            err = { 
              errorComment: "Error parsing " + fieldName + ", value #" + j + " is not a string",
              errorValue: 0
            };
          }
        }
      }

      callback(err, url, result);
    }
  });
}

module.exports = getDownloadAndParseFunc;
