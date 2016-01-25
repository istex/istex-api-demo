/*global jquery: true, angular: true, $: true, define: true, e: true, DOMException: true, istexMustacheTemplate: true */
/*jslint node: true, browser: true, unparam: true */
/*jslint indent: 2 */

define(
  [
    "models/searchPage",
    "config",
    "vendor/mustache",
    "text!views/resultRow.html",
    "vendor/jsonview/jquery.jsonview",
    "polyfill"
  ],
  function(searchPage, config, mustache, resultRowTemplate) {
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

    searchPageController.displayRanges = function(data, field, slider, amount, nb, type) {

      var minDate, maxDate;
      if (type === 'integer') {
        minDate = parseInt(data.aggregations[field].buckets[0].from, 10);
        maxDate = parseInt(data.aggregations[field].buckets[0].to, 10);
      } else if (type === 'float') {
        minDate = parseFloat(data.aggregations[field].buckets[0].from);
        maxDate = parseFloat(data.aggregations[field].buckets[0].to);
      } else if (type === 'date') {
        minDate = parseInt(data.aggregations[field].buckets[0].fromAsString, 10);
        maxDate = parseInt(data.aggregations[field].buckets[0].toAsString, 10);
      }

      if (nb !== '') $(nb).text(data.aggregations[field].buckets[0].docCount);
      $(slider).slider({
        range: true,
        min: minDate,
        max: maxDate,
        values: [minDate, maxDate]
      });
      $(amount).val($(slider).slider("values", 0) +
        " à " + $(slider).slider("values", 1));
    };
    searchPageController.displayResults = function(data) {
      $("#jsonFromApi").JSONView(data);

      if (data.total > 0) {
        $("#accordeon").show();
        $(".istex-pager")
          .show()
          .find(".first")
          .attr("href", data.firstPageURI)
          .end()
          .find(".last")
          .attr("href", data.lastPageURI)
          .end();

        $(".js-firstPageURI").html(data.firstPageURI);
        $(".js-lastPageURI").html(data.lastPageURI);

        // Selon les réponses, il peut ne pas y avoir de prevPageURI ou de nextPageURI
        $(".prev").attr("href", data.prevPageURI);
        $(".js-prevPageURI").html(data.prevPageURI);
        if (data.prevPageURI) {
          $(".prev").show();
        } else {
          $(".prev").hide(); // Assurance si une recherche a déjà été effectué en amont
        }

        $(".next").attr("href", data.nextPageURI);
        $(".js-nextPageURI").html(data.nextPageURI);
        if (data.nextPageURI) {
          $(".next").show();
        } else {
          $(".next").hide(); // Assurance si une recherche a déjà été effectué en amont
        }

        searchPage.numberOfResults = data.total;
        searchPage.numberOfPages = searchPage.numberOfResults === 0 ? 0 : Math.ceil(searchPage.numberOfResults / searchPage.resultsPerPage);
        searchPage.currentPage = searchPage.numberOfResults === 0 ? 0 : searchPage.currentPage;
        $(".page").find(".current").text(searchPage.currentPage === 0 ? "*" : searchPage.currentPage);
        $(".page").find(".total").text(searchPage.numberOfPages === 0 ? "*" : searchPage.numberOfPages);

        $("#totalResults").val(data.total);
        $("#totalms").val(data.stats.elasticsearch.took + data.stats['istex-api'].took);

        // On wrap l'objet data avant de lui donner de nouvelles méthodes.
        data = Object.create(data);
        data.abstr = function() {
          return function(text, render) {
            if (render(text) === "") {
              return "Pas de résumé pour ce résultat.";
            }
            return render(text);
          };
        };

        data.mimetypeIconName = (function(config) {
          return function() {
            return config.mimetypeIconNames[this.mimetype] || config.mimetypeIconNames["unknown"];
          };
        }(config));

        data.spaceless = function() {
          return function(text, render) {
            return render(text).replace(/(?:>)\s*(?=<)/g, ">");
          };
        };

        data.hasFulltext = function() {
          return this.fulltext && this.fulltext.length;
        };

        data.hasMetadata = function() {
          return this.metadata && this.metadata.length;
        };

        data.hasCovers = function() {
          return this.covers && this.covers.length;
        };

        data.hasAnnexes = function() {
          return this.annexes && this.annexes.length;
        };

        data.hasEnrichments = function() {
          return this.enrichments && this.enrichments.length;
        };

        data.consolidateEnrichmentsUri = function() {
          if (!this.enrichments) {
            return;
          }

          var path = [];
          this.enrichments.forEach(function(enrichment) {
            path.push(enrichment.type);
          });
          return 'https://api.istex.fr/document/' + this.id + '/enrichments/' + path.join(',') + '?consolidate';
        };

        data.titleClic = function() {
          return function(text, render) {
            var res = render(text),
              infos = res.split(" "),
              index = infos.indexOf("application/pdf"),
              title = res.slice(res.indexOf("\"") + 1, res.length - 1);

            if (index !== -1) {
              return "<a href=\"" + infos[index + 1] + "\" target=\"_blank\">" + title + "</a>";
            }

            return title;
          };
        };

        data.quality = function() {
          return function(text, render) {
            if (render(text).split(':')[1] === " ") {
              return "";
            }
            return "<div class='text-right'><b class='label label-info'>" + render(text) + "</b>";
          };
        };

        data.presence = function() {
          return function(text, render) {
            var res = render(text);
            if (res === 'T') {
              return "Présente(s)";
            } else {
              return "Absente(s)";
            };
          };
        };

        var template, lang, wos, obj;
        var languageList = [];
        var wosList = [];

        $("#tableResult").html(mustache.render(resultRowTemplate, data));

        // Vidage des facets avant remplissage
        $('#facetCorpus').empty();
        $('#facetArticleType').empty();
        $('#facetPDFVersion').empty();
        $('#facetRefBibsNative').empty();
        $('#languages').val('');
        $('#nbLangResults').text('');
        $('#wosCategories').val('');
        $('#nbWOSResults').text('');
        $('#sortMenu:first-child').html('Tri par : Qualité <span class="caret"></span>');

        // CorpusFacet
        template = "{{#aggregations.corpusName.buckets}}<div class='col-xs-offset-1'>" +
          "<div class='checkbox'><label><input value={{key}} type='checkbox'>{{key}}</label>" +
          "<span class='badge pull-right'>{{docCount}}</span></div></div>{{/aggregations.corpusName.buckets}}";
        $('#nbCorpusFacet').text(data.aggregations.corpusName.buckets.length);
        $('#facetCorpus').append(mustache.render(template, data));
        if (data.aggregations.corpusName.buckets.length === 1) {
          $('#facetCorpus').get(0).getElementsByTagName('input').item(0).checked = true;
          $('#facetCorpus').get(0).getElementsByTagName('input').item(0).disabled = true;
        }

        // ArticleTypeFacet
        template = "{{#aggregations.genre.buckets}}<div class='col-xs-offset-1'>" +
          "<div class='checkbox'><label><input value={{key}} type='checkbox'>{{key}}</label>" +
          "<span class='badge pull-right'>{{docCount}}</span></div></div>{{/aggregations.genre.buckets}}";
        $('#nbArticleTypeFacet').text(data.aggregations.genre.buckets.length);
        $('#facetArticleType').append(mustache.render(template, data));
        if (data.aggregations.genre.buckets.length === 1) {
          $('#facetArticleType').get(0).getElementsByTagName('input').item(0).checked = true;
          $('#facetArticleType').get(0).getElementsByTagName('input').item(0).disabled = true;
        }

        // PDFVersionFacet
        template = "{{#aggregations.pdfVersion.buckets}}<div class='col-xs-offset-1 col-xs-10'>" +
          "<div class='checkbox'><label><input value={{key}} type='checkbox'>{{key}}</label>" +
          "<span class='badge pull-right'>{{docCount}}</span></div></div>{{/aggregations.pdfVersion.buckets}}";
        $('#facetPDFVersion').append(mustache.render(template, data));
        if (data.aggregations.pdfVersion.buckets.length === 1) {
          $('#facetPDFVersion').get(0).getElementsByTagName('input').item(0).checked = true;
          $('#facetPDFVersion').get(0).getElementsByTagName('input').item(0).disabled = true;
        }

        // RefBibsNativeFacet
        template = "{{#aggregations.refBibsNative.buckets}}<div class='col-xs-offset-1'>" +
          "<div class='checkbox'><label><input value={{key}} type='checkbox'>{{#presence}}{{key}}{{/presence}}</label>" +
          "<span class='badge pull-right'>{{docCount}}</span></div></div>{{/aggregations.refBibsNative.buckets}}";
        $('#facetRefBibsNative').append(mustache.render(template, data));
        if (data.aggregations.refBibsNative.buckets.length === 1) {
          $('#facetRefBibsNative').get(0).getElementsByTagName('input').item(0).checked = true;
          $('#facetRefBibsNative').get(0).getElementsByTagName('input').item(0).disabled = true;
        }

        // LanguageFacet
        for (lang of data.aggregations.language.buckets) {
          obj = {};
          obj.value = lang.key;
          obj.desc = lang.docCount + ' documents'
          obj.label = config.languageCorrespondance[lang.key];
          if (obj.label === undefined) obj.label = obj.value;
          languageList.push(obj);
        }

        $("#languages").autocomplete({
            minLength: 0,
            source: languageList,
            focus: function(event, ui) {
              $('#languages').val(ui.item.label);
            },
            select: function(event, ui) {
              $('#languages').val(ui.item.label);

              searchPage.language = [];
              searchPage.language.push(ui.item.value);
              $("#refineRoad").append('<li><a href="#">language:"' + ui.item.value + '"</a></li>');
              searchPageController.search();

              return false;
            }
          })
          .autocomplete('instance')._renderItem = function(ul, item) {
            return $('<li>')
              .append('<a>' + item.label + "<br><span style=\"font-size:10px;\">" + item.desc + '</span></a>')
              .appendTo(ul);
          };
        $('#nbLangFacet').text(data.aggregations.language.buckets.length);

        // WosFacet
        for (wos of data.aggregations.wos.buckets) {
          obj = {};
          obj.value = wos.key.replace(/"/g, '%22').replace(/&/g, '%26').replace(/ /g, '%20');
          obj.desc = wos.docCount + ' documents'
          obj.label = wos.key;
          wosList.push(obj);
        }

        $("#wosCategories").autocomplete({
            minLength: 0,
            source: wosList,
            focus: function(event, ui) {
              $("#wosCategories").val(ui.item.label);
            },
            select: function(event, ui) {
              $("#wosCategories").val(ui.item.label);

              searchPage.WOS = [];
              searchPage.WOS.push(ui.item.value);
              $("#refineRoad").append('<li><a href="#">categories.wos:"' + ui.item.value + '"</a></li>');
              searchPageController.search();

              return false;
            }
          })
          .autocomplete("instance")._renderItem = function(ul, item) {
            return $("<li>")
              .append("<a>" + item.label + "<br><span style=\"font-size:10px;\">" + item.desc + "</span></a>")
              .appendTo(ul);
          };
        $('#nbWOSFacet').text(data.aggregations.wos.buckets.length);

        // ScoreFacet
        searchPageController.displayRanges(data, "score", "#slider-range-score", "#amountScore", '', 'float');
        // CopyrightDateFacet
        searchPageController.displayRanges(data, "copyrightDate", "#slider-range-copyright", "#amountCopyrightDate", '#nbCopyrightFacet', 'date');
        // PubDateFacet
        searchPageController.displayRanges(data, "publicationDate", "#slider-range-pubdate", "#amountPubDate", '#nbPublicationFacet', 'date');
        // PdfWordCountFacet
        searchPageController.displayRanges(data, "pdfWordCount", "#slider-range-PDFWordCount", "#amountPDFWordCount", '', 'integer');
        // PdfCharCountFacet
        searchPageController.displayRanges(data, "pdfCharCount", "#slider-range-PDFCharCount", "#amountPDFCharCount", '', 'integer');

      } else {

        $("#totalResults").val(0);
        $("#tableResult").html("<tr class='row'><td class='truncate col-xs-8' colspan=\"3\" style='text-align:center'>Pas de résultat pour cette recherche.</td>");
        $(".istex-pager").hide();

        $("#currentPage").text("*");
        $("#totalPages").text("*");

        if (!searchPage.reaffine) {
          $('#accordeon').hide();
        }
      }

      $("button").button('reset');
      $("#result").css("opacity", 1);
    };
    searchPageController.manageError = function(err) {
      $("button").button('reset');
      $(".alert span").html("Houston ... Problem!" + err.responseText);
      $(".alert").alert();
    };
    searchPageController.search = function() {
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

      searchPageController.checkSyntax(qParameter, function(syntaxOK) {
        if (syntaxOK) {
          searchPageController.request(config.apiUrl + query);
          $("#search-warning").fadeOut();
        } else {
          $("#search-warning").fadeIn();
          console.log("syntaxe de la requête incorrecte.");
        }
      });
    }

    searchPageController.request = function(url) {
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
              searchPageController.displayResults(data);
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
            searchPageController.displayResults(JSON.parse(localStorage.getItem(url)));
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