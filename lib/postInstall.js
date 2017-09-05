/* global process, e */

"use strict";

var fs = require("fs"),
  _ = require("lodash"),
  path = require("path"),
  colors = require("../conf/myColors"),
  parameters = {},
  envParameters,
  localParameters,
  distParameters,
  generatedScript;

var dirConf = path.join(__dirname, "../conf"),
  paramPath = path.join(dirConf, "parameters.json"),
  paramJSPath = path.join(dirConf, "parameters.js"),
  paramDistPath = path.join(dirConf, "parameters.json.dist");

// parametres d'environnement
envParameters = (function() {
  var _data;

  if (process.env.ISTEX_DEMO_PARAMETERS_FILE && typeof process.env.ISTEX_DEMO_PARAMETERS_FILE === 'string') {
    _data = fs.readFileSync(process.env.ISTEX_DEMO_PARAMETERS_FILE);
  } else {
    console.log("Pas de paramètres d'environnement".muted);
  }
  _data && console.log("Paramètres d'environnement trouvés".info);

  return _data && JSON.parse(_data) || {};

}());


// paramètres locaux
localParameters = (function() {
  var _data;

  try {
    _data = fs.readFileSync(paramPath);
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log("Pas de paramètres locaux".muted);
    } else {
      console.error("Erreur lors de la lecture du fichier \"parameters.json\": \n".danger, e);
      throw e;
    }
  }
  _data && console.log("Paramètres locaux trouvés".info);

  return _data && JSON.parse(_data) || {};
}());

// parametres distants
distParameters = (function() {
  console.log(__dirname);
  var _data = fs.readFileSync(paramDistPath);
  _data && console.log("Paramètres distants trouvés".info);

  return _data && JSON.parse(_data) || {};
}());

// On cascade les parametres
_.defaults(parameters, envParameters, localParameters, distParameters);

generatedScript =
  "/* Ce fichier est généré par npm, merci de ne pas le modifier */ \n " +
  "define(" + JSON.stringify(parameters) + ");";

fs.writeFile(paramJSPath, generatedScript, function(err) {
  if (err) {
    throw err;
  }
  console.log("Fichier \"parameters.js\" généré avec succès.".success);
});