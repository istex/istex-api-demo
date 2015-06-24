/* global process */

"use strict";

var fs = require("fs"),
  _ = require("lodash"),
  finalParameters = {},
  envParameters,
  parameters,
  distParameters,
  generatedScript,
  data
  ;

// parametres d'environnement
if (process.env.ISTEX_DEMO_PARAMETERS_FILE && typeof process.env.ISTEX_DEMO_PARAMETERS_FILE === 'string') {
  data = fs.readFileSync(process.env.ISTEX_DEMO_PARAMETERS_FILE);
} else {
  console.log("Pas de paramètres d'environnement");
}

envParameters = data && JSON.parse(data) || {};


// parametres locaux
try {
  data = fs.readFileSync("js/parameters.json");
} catch(e) {
  if (e.code === 'ENOENT') {
    console.info("Pas de paramètres locaux");
  } else {
    console.error("Erreur lors de la lecture du fichier parameters.json: ", e);
    throw e;
  }
}
parameters = data && JSON.parse(data) || {};


// parametres distants
data = fs.readFileSync("js/parameters.json.dist");
distParameters = data && JSON.parse(data);

// On cascade les parametres
_.defaults(finalParameters, envParameters);
_.defaults(finalParameters, parameters);
_.defaults(finalParameters, distParameters);

generatedScript =
  "/* Ce fichier est généré par npm, merci de ne pas le modifier */ \n "
  + "define(" + JSON.stringify(finalParameters) + ");";

fs.writeFile("js/parameters.js", generatedScript, function (err) {
  if (err) {
    throw err;
  }
});

