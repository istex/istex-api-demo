/*global jquery: true, angular: true, $: true, define: true, e: true, DOMException: true, istexMustacheTemplate: true */
/*jslint node: true, browser: true, unparam: true */
/*jslint indent: 2 */

define(
  [
    "config",
    "vendor/mustache",
    "controllers/results",
    "vendor/jsonview/jquery.jsonview",
    "polyfill"
  ],
  function(config, mustache, results) {
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
    (function() {
      var err = $.ajax({
        url: config.apiUrl + "corpus",
        dataType: "jsonp",
        success: function(data, status, xhr) {
          var corpusTemplate = "{{#corpusList}}<option value={{key}}>{{key}}</option>{{/corpusList}}";
          $('#editorField').append(mustache.render(corpusTemplate, {
            corpusList: data
          }));
        }
      });
      window.setTimeout(function() {
        console.log(err);
      }, 60000);
    }());

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
        fields.push(searchPage.searchField);
      } else {
        ctrlScope.helper.searchKeys.query = "q=*";
        fields.push('*');
      }

      if (searchPage.editor[0] !== '-1') {
        var corpusQuery = '(\"' + searchPage.editor.join("\" OR \"") + '\")';
        ctrlScope.helper.corpus.query = " AND corpusName:" + corpusQuery;
        fields.push("corpusName:" + corpusQuery);
      } else {
        ctrlScope.helper.corpus.query = null;
      }

      if ($("#advancedSearchPanel").is(':visible')) {

        if (searchPage.author !== "" && searchPage.author !== undefined) {
          ctrlScope.helper.author.query = " AND author.name:\"" + searchPage.author + "\"";
          fields.push("author.name:\"" + searchPage.author + "\"");
        }
        if (searchPage.title !== "" && searchPage.title !== undefined) {
          ctrlScope.helper.title.query = " AND title:\"" + searchPage.title + "\"";
          fields.push("title:\"" + searchPage.title + "\"");
        }
        if (searchPage.keywords !== "" && searchPage.keywords !== undefined) {
          ctrlScope.helper.subject.query = " AND subject.value:\"" + searchPage.keywords + "\"";
          fields.push("subject.value:\"" + searchPage.keywords + "\"");
        }
      }

      if (searchPage.genre.length > 0) {
        var articleTypeQuery = '(\"' + searchPage.genre.join("\" OR \"") + '\")';
        ctrlScope.helper.articleType.query = " AND genre:" + articleTypeQuery;
        fields.push("genre:" + articleTypeQuery);
      } else {
        ctrlScope.helper.articleType.query = null;
      }

      if (searchPage.copyrightdate) {
        ctrlScope.helper.copyrightDate.query = " AND copyrightDate:" + searchPage.copyrightdate;
        fields.push("copyrightDate:" + searchPage.copyrightdate);
      }
      if (searchPage.pubdate !== undefined) {
        ctrlScope.helper.pubDate.query = " AND publicationDate:" + searchPage.pubdate;
        fields.push("publicationDate:" + searchPage.pubdate);
      }

      if (searchPage.WOS.length > 0) {
        var wosQuery = '(\"' + searchPage.WOS.join("\" OR \"") + '\")';
        ctrlScope.helper.WOS.query = " AND categories.wos:" + wosQuery;
        fields.push("categories.wos:" + wosQuery);
      } else {
        ctrlScope.helper.WOS.query = null;
      }

      if (searchPage.language.length > 0) {
        var langQuery = '(\"' + searchPage.language.join("\" OR \"") + '\")';
        ctrlScope.helper.lang.query = " AND language:" + langQuery;
        fields.push("language:" + langQuery);
      } else {
        ctrlScope.helper.lang.query = null;
      }

      // Facette qualité
      ctrlScope.helper.quality.query = '';
      if (searchPage.score !== undefined) {
        ctrlScope.helper.score.query = " AND qualityIndicators.score:" + searchPage.score;
        ctrlScope.helper.quality.query += ctrlScope.helper.score.query;
        fields.push("qualityIndicators.score:" + searchPage.score);
      }

      if (searchPage.PDFWordCount !== undefined) {
        ctrlScope.helper.PDFWordCount.query = " AND qualityIndicators.pdfWordCount:" + searchPage.PDFWordCount;
        ctrlScope.helper.quality.query += ctrlScope.helper.PDFWordCount.query;
        fields.push("qualityIndicators.pdfWordCount:" + searchPage.PDFWordCount);
      }

      if (searchPage.PDFCharCount !== undefined) {
        ctrlScope.helper.PDFCharCount.query = " AND qualityIndicators.pdfCharCount:" + searchPage.PDFCharCount;
        ctrlScope.helper.quality.query += ctrlScope.helper.PDFCharCount.query;
        fields.push("qualityIndicators.pdfCharCount:" + searchPage.PDFCharCount);
      }

      if (searchPage.PDFVersion.length > 0) {
        var pdfQuery = '(\"' + searchPage.PDFVersion.join("\" OR \"") + '\")';
        ctrlScope.helper.PDFVersion.query = " AND qualityIndicators.pdfVersion:" + pdfQuery;
        ctrlScope.helper.quality.query += ctrlScope.helper.PDFVersion.query;
        fields.push("qualityIndicators.pdfVersion:" + pdfQuery);
      } else {
        ctrlScope.helper.PDFVersion.query = null;
      }

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

      // Facets (à compléter au fur et à mesure de l'ajout de fonctionnalités)
      facetQuery = "&facet=corpusName[*],genre[*],pdfVersion[*],refBibsNative,wos[*],language[*]";
      if (searchPage.reaffine && ($("#slider-range-copyright").slider("instance") !== undefined)) {
        minCopyright = $("#slider-range-copyright").slider("values", 0);
        maxCopyright = $("#slider-range-copyright").slider("values", 1);
        minPubdate = $("#slider-range-pubdate").slider("values", 0);
        maxPubdate = $("#slider-range-pubdate").slider("values", 1);
        minWordCount = $("#slider-range-PDFWordCount").slider("values", 0);
        maxWordCount = $("#slider-range-PDFWordCount").slider("values", 1);
        minCharCount = $("#slider-range-PDFCharCount").slider("values", 0);
        maxCharCount = $("#slider-range-PDFCharCount").slider("values", 1);
        minScore = $("#slider-range-score").slider("values", 0);
        maxScore = $("#slider-range-score").slider("values", 1);
        facetQuery += ",copyrightDate[" + minCopyright + "-" + maxCopyright + "]";
        facetQuery += ",publicationDate[" + minPubdate + "-" + maxPubdate + "]";
        facetQuery += ",pdfWordCount[" + minWordCount + "-" + maxWordCount + "]";
        facetQuery += ",pdfCharCount[" + minCharCount + "-" + maxCharCount + "]";
        facetQuery += ",score[" + minScore + "-" + maxScore + "]";
      } else {
        facetQuery += ",copyrightDate,publicationDate,pdfWordCount,pdfCharCount,score";
      }
      query += facetQuery;

      // Ajout de l'option size
      ctrlScope.helper.size.query = '&size=' + searchPage.resultsPerPage;
      query += "&size=" + searchPage.resultsPerPage;
      searchPage.currentPage = 1; // nouvelle recherche => retour page 1

      if (searchPage.sortBy) {
        ctrlScope.helper.sortBy.query = '&sortBy=' + searchPage.sortBy;
        query += '&sortBy=' + searchPage.sortBy;
      }

      // Ajout des options non modifiable dans le demonstrateur
      query += "&output=*&stats";

      ctrlScope.safeApply();

      softHyphen = "<wbr>";
      // Construction du contenu des tooltips (sur plusieurs lignes pour la lisibilité)
      var tooltipsContent = "<p class='h4'>" + config.apiUrl + "document/?" + softHyphen +
        "<mark class='bg-searchKeys'>" + (ctrlScope.helper.searchKeys.query || '') + "</mark>" + softHyphen +
        "<mark class='bg-corpus'>" + (ctrlScope.helper.corpus.query || '') + "</mark>" + softHyphen +
        "<mark class='bg-author'>" + (ctrlScope.helper.author.query || '') + "</mark>" + softHyphen +
        "<mark class='bg-title'>" + (ctrlScope.helper.title.query || '') + "</mark>" + softHyphen +
        "<mark class='bg-subject'>" + (ctrlScope.helper.subject.query || '') + "</mark>" + softHyphen +
        "<mark class='bg-copyrightDate'>" + (ctrlScope.helper.copyrightDate.query || '') + "</mark>" + softHyphen +
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
    }

    searchPageController.request = function(searchPage, url) {
      $("#searchButton").button('loading');
      $("#result").css("opacity", 0.4);
      $("#reqForApi").val(url);
      var timeStampLocal = (new Date()).getTime();
      timeStamp = timeStampLocal;
      var request = {
        url: url,
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
              results.displayResults(searchPage, data);
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
        timeout: 10000
      };

      localStorage && localStorage.refreshIfNeeded();

      setTimeout(function() {
        if (timeStamp === timeStampLocal) {
          if (localStorage && localStorage.getItem(url)) {
            results.displayResults(searchPage, JSON.parse(localStorage.getItem(url)));
          } else {
            $.ajax(request);
          }

          $("#result").removeClass('hide');
          $(document).trigger("resultsLoaded");
          $(".istex-pager").removeClass('hide');
          $(".pager").removeClass('hide');
        }
      }, 618);
    }

    searchPageController.checkSyntax = function(qParam, callback) {
      var syntaxOK = true;
      var q = qParam.trim();
      // teste que le nb de double-quotes est pair
      if (syntaxOK) syntaxOK = (q.match(/"/g) || []).length % 2 === 0;
      // teste que la requete ne finit pas par ':' ni '.'
      if (syntaxOK) syntaxOK = ":".indexOf(q[q.length - 1]) < 0;
      // teste qu'on a le même nb de '(' que de ')'
      if (syntaxOK) syntaxOK = (q.match(/\(/g) || []).length === (q.match(/\)/g) || []).length;
      // teste qu'on a le même nb de '(' que de ')'
      if (syntaxOK) syntaxOK = (q.match(/\[/g) || []).length === (q.match(/\]/g) || []).length;
      callback(syntaxOK);
    }

    return searchPageController;
  });