define(["../../conf/config", "../vendor/handlebars-v4.0.10", "text!./views/tooltipTemplate.html"],
  function(config, handlebars, tooltipTemplate) {

    return {

      generate: function() {

        tooltipGeneration(handlebars.compile(tooltipTemplate), handlebars, config);

      }
    };
  }
);

function tooltipGeneration(tooltipCompile, handlebars, config) {

  handlebars.registerHelper('stringHTML', function(context) {
    var html = context;
    return new handlebars.SafeString(html);
  });

  handlebars.registerHelper('docURL', function(context) {
    return config.apiUrl + ((context[0] === '/') ? context.slice(1) : context);
  });

  $("#catWosTooltip").html(tooltipCompile({
    title: 'Catégorie(s) WOS',
    explanation: 'Cette facette permet de préciser la <b class="text-primary">catégorie Web Of Science (WOS)</b> sur laquelle porte la requête.',
    references: {
      doc: [{
        text: 'Autres champs uniquement liés à l\'article',
        href: '/documentation/fields/#autres-champs-uniquement-lies-a-larticle'
      }],
      extern: [{
        text: 'Site officiel du Web Of Science',
        href: 'http://clarivate.com/scientific-and-academic-research/research-discovery/web-of-science/'
      }, {
        text: 'Web Of Science sur Wikipédia',
        href: 'https://fr.wikipedia.org/wiki/Web_of_Science'
      }]
    },
    chunkIn: ['&facet=wos[*]'],
    chunkOut: ['WOSChunkOut']
  }));

  $("#corpusTooltip").html(tooltipCompile({
    title: 'Corpus',
    explanation: 'Cette facette permet de préciser le <b class="text-primary">corpus éditeur</b> sur lequel porte la requête.',
    references: {
      doc: [{
        text: 'Exemples classiques de recherche',
        href: '/documentation/search/#exemples-classiques-de-recherche'
      }, {
        text: 'Liste des éditeurs disponible via l\'API',
        href: '/corpus'
      }, {
        text: 'Autres champs uniquement liés à l\'article',
        href: '/documentation/fields/#autres-champs-uniquement-lies-a-larticle'
      }]
    },
    chunkIn: ['&facet=corpusName[*]'],
    chunkOut: ['corpusChunkOut']
  }));

  $("#datePubliTooltip").html(tooltipCompile({
    title: 'Date de publication',
    explanation: 'Cette facette permet de préciser la <b class="text-primary">période de publication</b> sur laquelle porte la requête.',
    references: {
      doc: [{
        text: 'Champs dépendant de la granularité',
        href: '/documentation/fields/#champs-dependant-de-la-granularite'
      }]
    },
    chunkIn: ['&facet=publicationDate'],
    chunkOut: ['pubDateChunkOut']
  }));

  $("#typePubliTooltip").html(tooltipCompile({
    title: 'Type de publication et de contenu',
    explanation: 'Cette facette permet de préciser le <b class="text-primary">type de publication et/ou de contenu</b> sur lequel porte la requête.',
    references: {
      doc: [{
        text: 'Champs dépendant de la granularité',
        href: '/documentation/fields/#champs-dependant-de-la-granularite'
      }]
    },
    chunkIn: ['&facet=host.genre[*]>genre[*]'],
    chunkOut: ['articleTypeChunkOut']
  }));

  $("#catIniTooltip").html(tooltipCompile({
    title: 'Catégorie(s) Inist',
    explanation: 'Cette facette permet de préciser la <b class="text-primary">catégorie Inist</b> sur laquelle porte la requête.',
    references: {
      doc: [{
        text: 'Autres champs uniquement liés à l\'article',
        href: '/documentation/fields/#autres-champs-uniquement-lies-a-larticle'
      }],
      extern: [{
        text: 'Site officiel des catégories Inist',
        href: 'http://inist-category.lod.istex.fr'
      }]
    },
    chunkIn: ['&facet=categories.inist[*]'],
    chunkOut: ['inistChunkOut']
  }));

  $("#catSciTooltip").html(tooltipCompile({
    title: 'Catégorie(s) Science-Metrix',
    explanation: 'Cette facette permet de préciser la <b class="text-primary">catégorie Science-Metrix</b> sur laquelle porte la requête.',
    references: {
      doc: [{
        text: 'Autres champs uniquement liés à l\'article',
        href: '/documentation/fields/#autres-champs-uniquement-lies-a-larticle'
      }],
      extern: [{
        text: 'Site officiel de Science-Metrix',
        href: 'http://www.science-metrix.com/fr/classification'
      }]
    },
    chunkIn: ['&facet=categories.scienceMetrix[*]'],
    chunkOut: ['sciMetrixChunkOut']
  }));

  $("#langTooltip").html(tooltipCompile({
    title: 'Langue(s)',
    explanation: 'Cette facette permet de préciser la <b class="text-primary">langue du document</b> sur laquelle porte la requête.',
    references: {
      doc: [{
        text: 'Champs dépendant de la granularité',
        href: '/documentation/fields/#champs-dependant-de-la-granularite'
      }]
    },
    chunkIn: ['&facet=language[*]'],
    chunkOut: ['langChunkOut']
  }));

  $("#typeEnrichTooltip").html(tooltipCompile({
    title: 'Types d\'enrichissement',
    explanation: 'Cette facette permet de préciser les <b class="text-primary">types d\'enrichissement</b> présents dans les résultats sur lequel porte la requête.',
    references: {
      doc: [{
        text: 'Autres champs uniquement liés à l\'article',
        href: '/documentation/fields/#autres-champs-uniquement-lies-a-larticle'
      }]
    },
    chunkIn: ['&facet=enrichments.type[*]'],
    chunkOut: ['enrichTypeChunkOut']
  }));

  $("#qualityTooltip").html(tooltipCompile({
    title: 'Qualité',
    explanation: 'Cet ensemble de facettes permet de préciser la <b class="text-primary">qualité du document</b> souhaitée sur laquelle porte la requête. La qualité porte sur le nombre de mots et de caractères dans le texte, ou sur la version du PDF proposé par l\'éditeur.',
    references: {
      doc: [{
        text: 'Explications sur les indicateurs de qualité',
        href: '/documentation/fields/#explication-sur-les-indicateurs-de-qualite'
      }]
    },
    chunkIn: ['&facet=score', '&facet=pdfWordCount', '&facet=pdfCharCount', '&facet=pdfVersion[*]', '&facet=refBibsNative'],
    chunkOut: ['qualityChunkOut']
  }));
}