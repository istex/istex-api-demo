/*global jquery: true, angular: true, $: true, define: true, e: true, DOMException: true, istexMustacheTemplate: true */
/*jslint node: true, browser: true, unparam: true */
/*jslint indent: 2 */

define(
  [
    "config",
    "vendor/handlebars",
    "controllers/results",
    "vendor/jsonview/jquery.jsonview-1.2.3",
    "polyfill"
  ],
  function(config, handlebars, results) {
    "use strict";

    var searchPageController = {},
      timeStamp = null,
      ctrlScope;

    // On récupére le scope du controleur Angular
    if (angular) {
      ctrlScope = angular.element('[ng-controller=istexAppCtrl]').scope();
    }
    ctrlScope.app.apiUrl = config.apiUrl.rtrim('/ ');
    ctrlScope.safeApply();

    searchPageController.manageError = function(err) {
      $("button").button('reset');
      $(".alert span").html("Houston ... Problem!" + err.responseText);
      $(".alert").alert();
    };

    searchPageController.search = function(searchPage, searchPageHistory) {
      var
        query = "document/?q=",
        fields = [],
        //      ctrlScope,
        minCopyright,
        maxCopyright,
        minPubdate,
        maxPubdate,
        minWordCount,
        maxWordCount,
        minCharCount,
        maxCharCount,
        minScore,
        maxScore,
        corpusQuery,
        queryFrom,
        facetQuery,
        softHyphen;

      if (searchPage.searchField) {
        ctrlScope.helper.searchKeys.query = "q=" + searchPage.searchField;
        fields.push(encodeURIComponent(searchPage.searchField));
      } else {
        ctrlScope.helper.searchKeys.query = "q=*";
        fields.push('*');
      }

      if (searchPage.editor[0] !== '-1') {
        getField(searchPage.editor, 'corpus', 'corpusName.raw', ctrlScope.helper, fields, 'array', false);
      }

      if (searchPage.sortBy) {
        ctrlScope.helper.sort.query = '&sortBy=' + searchPage.sortBy;
      } else {
        ctrlScope.helper.sort.query = undefined;
      }

      getField(searchPage.enrichType, 'enrichType', 'enrichments.type.raw', ctrlScope.helper, fields, 'array', false);
      getField(searchPage.hostGenre, 'publicationType', 'host.genre.raw', ctrlScope.helper, fields, 'array', false);
      getField(searchPage.genre, 'articleType', 'genre.raw', ctrlScope.helper, fields, 'array', false);
      getField(searchPage.pubdate, 'pubDate', 'publicationDate', ctrlScope.helper, fields, 'range', false);
      getField(searchPage.WOS, 'WOS', 'categories.wos.raw', ctrlScope.helper, fields, 'array', false);
      getField(searchPage.sciMetrix, 'sciMetrix', 'categories.scienceMetrix.raw', ctrlScope.helper, fields, 'array', false);
      getField(searchPage.inist, 'inist', 'categories.inist.raw', ctrlScope.helper, fields, 'array', false);
      getField(searchPage.language, 'lang', 'language.raw', ctrlScope.helper, fields, 'array', false);

      // Facette qualité
      ctrlScope.helper.quality.query = '';

      getField(searchPage.score, 'score', 'qualityIndicators.score', ctrlScope.helper, fields, 'range', true);
      getField(searchPage.PDFWordCount, 'PDFWordCount', 'qualityIndicators.pdfWordCount', ctrlScope.helper, fields, 'range', true);
      getField(searchPage.PDFCharCount, 'PDFCharCount', 'qualityIndicators.pdfCharCount', ctrlScope.helper, fields, 'range', true);
      getField(searchPage.PDFVersion, 'PDFVersion', 'qualityIndicators.pdfVersion.raw', ctrlScope.helper, fields, 'array', true);

      if (searchPage.refBibsNative) {
        if (searchPage.refBibsNative.length === 1) {
          ctrlScope.helper.refBibsNative.query = " AND qualityIndicators.refBibsNative:" + searchPage.refBibsNative[0];
          ctrlScope.helper.quality.query += ctrlScope.helper.refBibsNative.query;
          fields.push("qualityIndicators.refBibsNative:" + searchPage.refBibsNative[0]);
        } else {
          ctrlScope.helper.refBibsNative.query = null;
        }
      }

      var qParameter = fields.join(" AND ");
      query += qParameter;

      // Facette
      if (!searchPage.facet) {
        searchPage.facet = 'corpusName[*]';
      }
      facetQuery = "&facet=" + searchPage.facet;
      query += facetQuery;

      // Ajout de l'option size
      ctrlScope.helper.size.query = '&size=' + searchPage.resultsPerPage;
      query += "&size=" + searchPage.resultsPerPage;
      searchPage.currentPage = 1; // nouvelle recherche => retour page 1

      if (searchPage.sortBy) {
        ctrlScope.helper.sortBy.query = '&sortBy=' + searchPage.sortBy;
        query += '&sortBy=' + searchPage.sortBy;
      }

      if (searchPage.rankBy) {
        ctrlScope.helper.rankBy.query = '&rankBy=' + searchPage.rankBy;
        query += '&rankBy=' + searchPage.rankBy;
      }

      // Ajout des options non modifiable dans le demonstrateur
      query += "&output=*&stats";

      ctrlScope.safeApply();

      softHyphen = "<wbr>";
      // Construction du contenu des tooltips (sur plusieurs lignes pour la lisibilité)
      var tooltipsContent = "<p class='h4'>" + config.apiUrl + "document/?" + softHyphen +
        "<mark class='bg-searchKeys'>" + (ctrlScope.helper.searchKeys.query || '') + "</mark>" + softHyphen +
        "<mark class='bg-corpus'>" + (ctrlScope.helper.corpus.query || '') + "</mark>" + softHyphen +
        "<mark class='bg-publicationType'>" + (ctrlScope.helper.publicationType.query || '') + "</mark>" + softHyphen +
        "<mark class='bg-articleType'>" + (ctrlScope.helper.articleType.query || '') + "</mark>" + softHyphen +
        "<mark class='bg-author'>" + (ctrlScope.helper.author.query || '') + "</mark>" + softHyphen +
        "<mark class='bg-title'>" + (ctrlScope.helper.title.query || '') + "</mark>" + softHyphen +
        "<mark class='bg-subject'>" + (ctrlScope.helper.subject.query || '') + "</mark>" + softHyphen +
        "<mark class='bg-pubDate'>" + (ctrlScope.helper.pubDate.query || '') + "</mark>" + softHyphen +
        "<mark class='bg-wos'>" + (ctrlScope.helper.WOS.query || '') + "</mark>" + softHyphen +
        "<mark class='bg-lang'>" + (ctrlScope.helper.lang.query || '') + "</mark>" + softHyphen +
        "<mark class='bg-score'>" + (ctrlScope.helper.score.query || '') + "</mark>" + softHyphen +
        "<mark class='bg-pdfWordCount'>" + (ctrlScope.helper.PDFWordCount.query || '') + "</mark>" + softHyphen +
        "<mark class='bg-pdfCharCount'>" + (ctrlScope.helper.PDFCharCount.query || '') + "</mark>" + softHyphen +
        "<mark class='bg-pdfVersion'>" + (ctrlScope.helper.PDFVersion.query || '') + "</mark>" + softHyphen +
        "<mark class='bg-refBibsNative'>" + (ctrlScope.helper.refBibsNative.query || '') + "</mark>" + softHyphen +
        "<mark class='bg-facets'>" + (facetQuery.replace(/,/g, ",<wbr>") || '') + "</mark>" + softHyphen +
        "<mark class='bg-from'>" + (queryFrom || '') + "</mark>" + softHyphen +
        "<mark class='bg-size'>&size=" + searchPage.resultsPerPage + "</mark>" + softHyphen +
        "<mark class='bg-sortBy'>" + (ctrlScope.helper.sortBy.query || '') + "</mark>" + softHyphen +
        "<mark class='bg-output'>&output=*</mark>" + softHyphen +
        "<mark class='bg-stats'>&stats</mark>" + "</p>";

      $("#request-tooltip-content").html(tooltipsContent);

      searchPageHistory.push(searchPage);

      searchPageController.checkSyntax(qParameter, function(syntaxOK) {
        if (syntaxOK) {
          searchPageController.request(searchPage, config.apiUrl + query);
          $("#search-warning").fadeOut();
        } else {
          $("#search-warning").fadeIn();
          console.log("syntaxe de la requête incorrecte.");
        }
      });
    };

    searchPageController.request = function(searchPage, url) {
      $("#searchButton").button('loading');
      $("#result").css("opacity", 0.4);
      $("#reqForApi").val(url);
      var timeStampLocal = (new Date()).getTime();
      timeStamp = timeStampLocal;
      var request = {
        url: url + '&sid=istex-api-demo',
        dataType: "jsonp",
        crossDomain: true,
        success: function(data) {
          //Vérification qu'il n'y a pas eu d'autres requêtes entretemps, sinon annulation
          if (timeStamp === timeStampLocal) {
            try {
              localStorage && localStorage.setItem(url, JSON.stringify(data));
            } catch (e) {
              if (e instanceof DOMException && e.name === 'QuotaExceededError') {
                localStorage.clear();
                console.log("localStorage cleared");
              } else {
                throw e;
              }
            } finally {
              results.displayResults(searchPage, data, url);
              $(document).trigger("resultsLoaded");
            }
          }
        },
        error: function(err) {
          //Vérification qu'il n'y a pas eu d'autres requêtes entretemps, sinon annulation
          if (timeStamp === timeStampLocal) {
            searchPageController.manageError(err);
          }
        },
        timeout: 30000
      };

      localStorage && localStorage.refreshIfNeeded();

      setTimeout(function() {
        if (timeStamp === timeStampLocal) {
          if (localStorage && localStorage.getItem(url)) {
            results.displayResults(searchPage, JSON.parse(localStorage.getItem(url)), url);
          } else {
            $.ajax(request);
          }

          $("#result").removeClass('hide');
          $(document).trigger("resultsLoaded");
          $(".istex-pager").removeClass('hide');
          $(".pager").removeClass('hide');

          $(".pageTips").attr('href', ctrlScope.app.apiUrl + '/documentation/results/#parametres-de-pagination');

        }
      }, 618);
    };

    searchPageController.checkSyntax = function(qParam, callback) {
      var syntaxOK = true;
      var q = qParam.trim();
      // teste que le nb de double-quotes est pair
      if (syntaxOK) syntaxOK = nbChar(q, "\"") % 2 === 0;
      // teste que la requete ne finit pas par ':' ni '.'
      if (syntaxOK) syntaxOK = ":".indexOf(q[q.length - 1]) < 0;
      // teste qu'on a le même nb de '(' que de ')'
      if (syntaxOK) syntaxOK = nbChar(q, "\\(") === nbChar(q, "\\)");
      // teste qu'on a le même nb de '[' + '{' que de ']' + '}'
      if (syntaxOK) syntaxOK = (nbChar(q, "\\[") + nbChar(q, "\\{")) === (nbChar(q, "\\]") + nbChar(q, "\\}"));
      callback(syntaxOK);
    };

    return searchPageController;
  }
);

function nbChar(q, regex) {
  var r = new RegExp(regex, 'g');
  return (q.match(r) || []).length;
}

function getField(field, scopeField, qFragment, ctrlScopeHelper, fields, type, quality) {
  if (field && field.length > 0) {
    var contains;
    switch (type) {
      case 'array':
        contains = '(\"' + encodeURIComponent(field.join("\" OR \"")) + '\")';
        break;
      case 'string':
        contains = "\"" + encodeURIComponent(field) + "\"";
        break;
      default:
        contains = encodeURIComponent(field);
        break;
    }
    ctrlScopeHelper[scopeField].query = " AND " + qFragment + ":" + contains;
    if (quality) ctrlScopeHelper.quality.query += ctrlScopeHelper[scopeField].query;
    fields.push(qFragment + ":" + contains);
  } else {
    ctrlScopeHelper[scopeField].query = null;
  }
}