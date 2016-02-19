// -----------------------------------------------------------------
// Script de récupération du mapping actuellement sur bulkIndexation
// -----------------------------------------------------------------

var cp = require('child_process');
var fs = require('fs');
//var apiUrl = require('./config.js').apiUrl;
var apiUrl = 'api.istex.fr';
//var apiUrl = 'api-dev.istex.fr';

// En cas de non récupération du mapping, on garde un minimum
var finalMapping = {
  'corpusName': 'string',
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
      if (typeof raw[keys[i]] === 'object') {
        recursiveMapping(raw[keys[i]], road + ((road !== '') ? '.' : '') + keys[i], finalMapping);
      } else {
        if (keys[i] === 'raw') finalMapping[road + '.raw'] = raw[keys[i]];
        finalMapping[road] = raw[keys[i]];
      }
    }
    recursiveMapping(jsonMapping, '', finalMapping);
  };

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

// console.log('Récupération de l\'ensemble des corpus disponibles...');
// raw = cp.execSync('curl -XGET ' + apiURL + '/corpus/', {
//   encoding: 'utf8'
// });

// console.log('Corpus récupérés...');
// try {

//   // Remplacement de la balise <corpusToCharge/> de 050-global.html
//   fs.readFile('./public/documentation/300-search.html', 'utf8', function(err, data) {
//     if (err) {
//       console.log('!!!!!!! ERREUR DE LECTURE DE 300-search.html !!!!!!!');
//       console.log(err);
//     }

//     var result = data.replace(/<corpusToCharge\/>/g, '<pre>' + raw + '</pre>');
//     fs.writeFile('./public/documentation/300-search.html', result, 'utf8', function(err) {
//       if (err) {
//         console.log('!!!!!!! ERREUR D\'ECRITURE DE 300-search.html !!!!!!!');
//         console.log(err);
//       }
//       console.log('Liste des corpus insérée dans 300-search.html !');
//     });
//   });

// } catch (e) {
//   console.log('!!!!!!! ERREUR DE PARSING DU MAPPING RECUPERE !!!!!!!');
//   console.log(e);
// }