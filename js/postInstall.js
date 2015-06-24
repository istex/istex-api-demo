var fs = require("fs"),
  _ = require("lodash")
  ;

fs.readFile("js/parameters.json", function (err, data) {
//  if (err) {
//    return console.log(err);
//  }

  var parameters = JSON.parse(data);

  fs.readFile("js/parameters.json.dist", function (err, data) {
    if (err) {
      return console.log(err);
    }

    var distParameters = JSON.parse(data),
      parametersFile
      ;

    _.defaults(parameters, distParameters);
    parametersFile = "define(" + JSON.stringify(parameters) + ");";

    fs.writeFile("js/parameters.js", parametersFile, function (err) {
      if (err) {
        return console.log(err);
      }
    });
  });
});