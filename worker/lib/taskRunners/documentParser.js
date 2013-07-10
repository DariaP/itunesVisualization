var log = require('../logger.js'),
    request = require('../../node_modules/request'),
    cheerio = require('cheerio'),
    downloadAndParse = require('../../../lib/documentParser.js')(request, cheerio),
    config = require('../config.js'),
    fs = require('fs');

/* Will return 'result' object with fields:
 * similarItems (array of strings)
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
 */

function parseDocument(task, taskCompletedCallback) {
  downloadAndParse (
    task.name,
    function(err, url, result) {
      var taskResult;

      if (err) {
        taskResult = {
          error: true,
          errorComment: err.errorComment
        }
        if (0 !== err.errorValue) {
          taskResult.errorValue = err.errorValue;
        } else {
          taskResult.errorValue = result;
        }
      } else {
        taskResult = result;
      }

      taskCompletedCallback(
        {
          originalTask: task,
          taskResult: taskResult
        }
      );
    }
  );
}

module.exports = parseDocument;
