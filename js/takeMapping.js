// ---------------------------------------------------------
// Script de récupération du mapping actuellement en ligne
// ---------------------------------------------------------

var cp = require('child_process');
var fs = require('fs');
var _ = require('lodash');

// En cas de non récupération du mapping, on garde un minimum
var finalMapping = {
  'corpusName'   : 'select',
  'title'        : 'string',
  'author.name'  : 'string',
  'subject.value': 'string'
};

var fieldsToOmit = [
  'enrichments.nerd.mimetype',
  'enrichments.nerd.orginal',
  'namedEntities.nerd',
  'namedEntities.unitex',
  'eissn',
  'eisbn',
  'host.pmid',
  'host.sici',
  'host.subject.lang',
  'serie.eisbn',
  'serie.isbn',
  'serie.issue.raw',
  'serie.journalId',
  'serie.pages.first',
  'serie.pages.last',
  'serie.pages.total',
  'serie.pii',
  'serie.pmid',
  'serie.sici',
  'serie.subject.lang',
  'serie.subject.value',
  'serie.volume',
  'refBibs.issn',
  'refBibs.isbn',
  'refBibs.issue',
  'refBibs.volume',
  'refBibs.host.author.affiliations',
  'refBibs.host.doi',
  'refBibs.serie.doi',
  'refBibs.serie.isbn',
  'refBibs.serie.issn',
  'refBibs.serie.issue',
  'refBibs.serie.pages.first',
  'refBibs.serie.pages.last',
  'refBibs.serie.volume'
];

fs.readFile('js/parameters.js', 'utf8', (err, fileContent) => {
  if (err) throw err;

  // Getting the JSON part of the config file
  const configStart = fileContent.indexOf('{');
  const configEnd = fileContent.lastIndexOf('}');
  const configString = fileContent.substring(configStart, configEnd + 1);
  const config = JSON.parse(configString);

  // If config.default_api_url isn't a URL it's most likely a reference
  // to another key. If so, get the value of this other key.
  const apiUrl = isValidURL(config.default_api_url) ? config.default_api_url : config[config.default_api_url];

  console.log('Récupération du mapping...');
  const raw = cp.execSync('curl -XGET ' + apiUrl + 'mapping', {
    encoding: 'utf8'
  });
  console.log('Mapping récupéré...');
  try {

    const jsonMapping = _.omit(JSON.parse(raw), fieldsToOmit);

    function recursiveMapping (raw, road, finalMapping) {
      const keys = Object.keys(raw);
      for (let i = 0; i < keys.length; i++) {
        if (keys[i] === 'corpusName') continue;

        if (typeof raw[keys[i]] === 'object') {
          recursiveMapping(raw[keys[i]], road + ((road !== '') ? '.' : '') + keys[i], finalMapping);
        } else {
          // if the original value is 'keyword' or 'text', it needs to be converted to 'string' to
          // work with query-builder
          const key = keys[i] === 'raw' ? `${road}.raw` : road;
          const value = raw[keys[i]] === 'keyword' || raw[keys[i]] === 'text' ? 'string' : raw[keys[i]];
          finalMapping[key] = value;
        }
      }
    }

    recursiveMapping(jsonMapping, '', finalMapping);

    // Ecriture de mapping.json
    fs.writeFile('./js/mapping.json', JSON.stringify(finalMapping), 'utf8', (err) => {
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
});

function isValidURL(url) {
  try {
    const _url = new URL(url);
  } catch (err) {
    return false;
  }
 
  return true;
}
