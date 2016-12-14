// ---------------------------------------------------------
// Script de récupération du mapping actuellement en ligne
// ---------------------------------------------------------

var cp = require('child_process');
var fs = require('fs');
var apiUrl = 'https://api.istex.fr';

// En cas de non récupération du mapping, on garde un minimum
var finalMapping = {
  'corpusName': 'select',
  'title': 'string',
  'author.name': 'string',
  'subject.value': 'string'
};

console.log('Récupération du mapping...');
var raw = cp.execSync('curl -XGET ' + apiUrl + '/mapping', {
  encoding: 'utf8'
});

console.log('Mapping récupéré...');
try {

  var jsonMapping = JSON.parse(raw);

  function recursiveMapping(raw, road, finalMapping) {
    var keys = Object.keys(raw);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] !== 'corpusName') {
        if (typeof raw[keys[i]] === 'object') {
          recursiveMapping(raw[keys[i]], road + ((road !== '') ? '.' : '') + keys[i], finalMapping);
        } else {
          if (keys[i] === 'raw') finalMapping[road + '.raw'] = raw[keys[i]];
          finalMapping[road] = raw[keys[i]];
        }
      }
    }
  }

  recursiveMapping(jsonMapping, '', finalMapping);

  // Ecriture de mapping.json
  fs.writeFile('./js/mapping.json', JSON.stringify(finalMapping), 'utf8', function(err) {
    if (err) {
      console.log('!!!!!!! ERREUR D\'ECRITURE DU MAPPING.JSON !!!!!!!');
      console.log(err);
    }
    console.log('Mapping formaté dans mapping.json !');
  });

} catch (e) {
  console.log('!!!!!!! ERREUR DE PARSING DU MAPPING RECUPERE !!!!!!!');
  console.log(e);
}