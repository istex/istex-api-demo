/*global jquery: true, angular: true, $: true, define: true */
/*jslint node: true, browser: true, unparam: true */
/*jslint indent: 2 */
define(["../models/searchPage", "../conf", "../vendor/mustache", "../vendor/jsonview/jquery.jsonview.js"], function(searchPage, conf, mustache) {
  "use strict";
  var searchPageController = {};
  var timeStamp = null;

  (function() {
    var err = $.ajax({
      url: conf.apiUrl + "corpus",
      dataType: "jsonp",
      success: function(data, status, xhr) {
        var corpusTemplate = "{{#corpusList}}<option value={{key}}>{{key}}</option>{{/corpusList}}",
          corpusList = {
            corpusList: data
          };
        $('#editorField').append(mustache.to_html(corpusTemplate, corpusList));
      }
    });
    window.setTimeout(function() {
      console.log(err);
    }, 60000);
  }());

  searchPageController.displayRanges = function(data, field, slider, amount, nb, type) {

    var minDate, maxDate;
    if (type === 'integer') {
      minDate = parseInt(data.aggregations[field].buckets[0].fromAsString, 10);
      maxDate = parseInt(data.aggregations[field].buckets[0].toAsString, 10);
    } else if (type === 'float') {
      minDate = parseFloat(data.aggregations[field].buckets[0].fromAsString);
      maxDate = parseFloat(data.aggregations[field].buckets[0].toAsString);
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
  }

  searchPageController.displayResults = function(data) {
    $("#jsonFromApi").JSONView(data);

    if (data.total > 0) {

      $('#accordeon').show();

      $('#first').attr("href", data.firstPageURI);
      $('#js-firstPageURI').html(data.firstPageURI);
      $('#first').show();

      $('#last').attr("href", data.lastPageURI);
      $('#js-lastPageURI').html(data.lastPageURI);
      $('#last').show();

      // Selon les réponses, il peut ne pas y avoir de prevPageURI ou de nextPageURI
      $('#prev').attr("href", data.prevPageURI);
      $('#js-prevPageURI').html(data.prevPageURI);
      if (data.prevPageURI) {
        $('#prev').show();
      } else {
        $('#prev').hide(); // Assurance si une recherche a déjà été effectué en amont
      }

      $('#next').attr("href", data.nextPageURI);
      $('#js-nextPageURI').html(data.nextPageURI);
      if (data.nextPageURI) {
        $('#next').show();
      } else {
        $('#next').hide(); // Assurance si une recherche a déjà été effectué en amont
      }

      searchPage.numberOfResults = data.total;
      searchPage.numberOfPages = searchPage.numberOfResults === 0 ? 0 : Math.ceil(searchPage.numberOfResults / searchPage.resultsPerPage);
      searchPage.currentPage = searchPage.numberOfResults === 0 ? 0 : searchPage.currentPage;
      $("#currentPage").text(searchPage.currentPage === 0 ? "*" : searchPage.currentPage);
      $("#totalPages").text(searchPage.numberOfPages === 0 ? "*" : searchPage.numberOfPages);

      $("#totalResults").val(data.total);
      $("#totalms").val(data.stats.elasticsearch.took + data.stats['istex-api'].took);

      data.abstr = function() {
        return function(text, render) {
          if (render(text) === "") {
            return "Pas de résumé pour ce résultat.";
          }
          return render(text);
        };
      };

      data.linksIcon = function() {

        return function(text, render) {
          var infos = render(text).split(" "),
            html = (infos.length === 2) ? "" : "<table class='downloadFilesTable'><th>" + infos[0] + "</th><tr><td>",
            i = 1,
            typeFile;
          while ((i + 1) < infos.length) {
            /*jslint white: true */
            switch (infos[i]) {
              case 'application/zip':
                typeFile = 'img/mimetypes/32px/zip.png';
                break;
              case 'application/pdf':
                typeFile = 'img/mimetypes/32px/pdf.png';
                break;
              case 'image/tiff':
                typeFile = 'img/mimetypes/32px/tiff.png';
                break;
              case 'application/xml':
                typeFile = 'img/mimetypes/32px/xml.png';
                break;
              case 'application/mods+xml':
                typeFile = 'img/mimetypes/32px/mods.png';
                break;
              case 'application/tei+xml':
                typeFile = 'img/mimetypes/32px/tei.png';
                break;
              case 'text/plain':
                typeFile = 'img/mimetypes/32px/txt.png';
                break;
              case 'image/jpeg':
                typeFile = 'img/mimetypes/32px/jpg.png';
                break;
              case 'image/gif':
                typeFile = 'img/mimetypes/32px/gif.png';
                break;
              case 'application/vnd.ms-powerpoint':
                typeFile = 'img/mimetypes/32px/ppt.png';
                break;
              case 'application/msword':
                typeFile = 'img/mimetypes/32px/doc.png';
                break;
              case 'video/quicktime':
                typeFile = 'img/mimetypes/32px/qt.png';
                break;
              case 'application/rtf':
                typeFile = 'img/mimetypes/32px/rtf.png';
                break;
              case 'application/vnd.ms-excel':
                typeFile = 'img/mimetypes/32px/xls.png';
                break;
              default:
                typeFile = 'img/mimetypes/32px/_blank.png';
                break;
            }
            /*jslint white: false */
            html += "<a href=\"" + infos[i + 1] + "\" target=\"_blank\"><img src=\"" + typeFile + "\" alt=\'" + infos[i].split("/")[1] + "\' title=\'" + infos[i].split("/")[1] + "\'></a>";
            i = i + 2;
          }

          html += (infos.length === 2) ? "" : "</td></tr></table>";
          return html;
        };
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
          console.log(res);
          if (res === "true") {
            return "Présente(s)"
          } else {
            return "Absente(s)"
          };
        };
      };

      var tableLine = "{{#hits}}<tr class='row'><td class='col-xs-12'><h4 class='alert-success'><b>" +
        "{{#titleClic}}{{#fulltext}}{{{mimetype}}} {{{uri}}} {{/fulltext}} \"{{title}}\"{{/titleClic}}" +
        "</b></h4>" +
        "<div class='col-xs-10'><p class='small'>" +
        "{{#abstr}}{{abstract}}{{/abstr}}" +
        "</p><div class='row' style='text-align:center;'>" +
        "<div class='col-xs-4'>" +
        "{{#linksIcon}}Fulltext {{#fulltext}}{{{mimetype}}} {{{uri}}} {{/fulltext}}{{/linksIcon}} " +
        "</div><div class='col-xs-3'>" +
        "{{#linksIcon}}Metadata {{#metadata}}{{{mimetype}}} {{{uri}}} {{/metadata}}{{/linksIcon}} " +
        "</div><div class='col-xs-3'>" +
        "{{#linksIcon}}Annexes {{#annexes}}{{{mimetype}}} {{{uri}}} {{/annexes}}{{/linksIcon}} " +
        "</div><div class='col-xs-2'>" +
        "{{#linksIcon}}Covers {{#covers}}{{{mimetype}}} {{{uri}}} {{/covers}}{{/linksIcon}}" +
        "</div></div></div>" +
        "<div class='col-xs-2'><div class='text-right'>" +
        "<b class='label label-primary'>Corpus : {{corpusName}}</b>" +
        "</div>{{#quality}}Score : {{qualityIndicators.score}}{{/quality}}" +
        "</div>{{#quality}}Mots : {{qualityIndicators.pdfWordCount}}{{/quality}}" +
        "</div></td></tr>{{/hits}}",
        template;

      $("#tableResult").html(mustache.to_html(tableLine, data));

      if (!searchPage.reaffine) {

        // Vidage des facets avant remplissage
        $('#facetCorpus').empty();
        $('#facetPDFVersion').empty();

        // CorpusFacet
        template = "{{#aggregations.corpus.buckets}}<div class='col-xs-offset-1 col-xs-10'>" +
          "<div class='checkbox'><label><input value={{key}} type='checkbox'>{{key}}</label>" +
          "<span class='badge pull-right'>{{docCount}}</span></div></div>{{/aggregations.corpus.buckets}}";

        $('#nbCorpusFacet').text(data.aggregations.corpus.buckets.length);
        $('#facetCorpus').append(mustache.to_html(template, data));

        if (data.aggregations.corpus.buckets.length === 1) {
          $('#facetCorpus').get(0).getElementsByTagName('input').item(0).checked = true;
          $('#facetCorpus').get(0).getElementsByTagName('input').item(0).disabled = true;
        }

        // PDFVersionFacet
        template = "{{#aggregations.pdfVersion.buckets}}<div class='col-xs-offset-1 col-xs-10'>" +
          "<div class='checkbox'><label><input value={{key}} type='checkbox'>{{key}}</label>" +
          "<span class='badge pull-right'>{{docCount}}</span></div></div>{{/aggregations.pdfVersion.buckets}}";

        $('#facetPDFVersion').append(mustache.to_html(template, data));

        if (data.aggregations.pdfVersion.buckets.length === 1) {
          $('#facetPDFVersion').get(0).getElementsByTagName('input').item(0).checked = true;
          $('#facetPDFVersion').get(0).getElementsByTagName('input').item(0).disabled = true;
        }

        // RefBibsNativeFacet
        template = "{{#aggregations.refBibsNative.buckets}}<div class='col-xs-offset-1 col-xs-10'>" +
          "<div class='checkbox'><label><input value={{key}} type='checkbox'>{{#presence}}{{key}}{{/presence}}</label>" +
          "<span class='badge pull-right'>{{docCount}}</span></div></div>{{/aggregations.refBibsNative.buckets}}";

        $('#facetRefBibsNative').append(mustache.to_html(template, data));

        if (data.aggregations.refBibsNative.buckets.length === 1) {
          $('#facetRefBibsNative').get(0).getElementsByTagName('input').item(0).checked = true;
          $('#facetRefBibsNative').get(0).getElementsByTagName('input').item(0).disabled = true;
        }

        // ScoreFacet
        searchPageController.displayRanges(data, "score", "#slider-range-score", "#amountScore", '', 'float');

        // CopyrightDateFacet
        searchPageController.displayRanges(data, "copyrightdate", "#slider-range-copyright", "#amountCopyrightDate", '#nbCopyrightFacet', 'integer');
        // PubDateFacet
        searchPageController.displayRanges(data, "pubdate", "#slider-range-pubdate", "#amountPubDate", '#nbPublicationFacet', 'integer');
        // PdfWordCountFacet
        searchPageController.displayRanges(data, "pdfWordCount", "#slider-range-PDFWordCount", "#amountPDFWordCount", '', 'integer');
        // PdfCharCountFacet
        searchPageController.displayRanges(data, "pdfCharCount", "#slider-range-PDFCharCount", "#amountPDFCharCount", '', 'integer');
      }

    } else {

      $("#totalResults").val(0);
      $("#tableResult").html("<tr class='row'><td class='truncate col-xs-8' colspan=\"3\" style='text-align:center'>Pas de résultat pour cette recherche.</td>");
      $('#first').hide();
      $('#prev').hide();
      $('#next').hide();
      $('#last').hide();
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
      ctrlScope,
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

    // On récupére le scope du controleur Angular
    if (angular) {
      ctrlScope = angular.element('[ng-controller=istexAppCtrl]').scope();
    }

    if (searchPage.searchField !== "" && searchPage.searchField !== undefined) {
      ctrlScope.helper.searchKeys.query = "q=" + searchPage.searchField;
      fields.push(searchPage.searchField);
    } else {
      ctrlScope.helper.searchKeys.query = "q=*";
      fields.push('*');
    }

    if ($("#collapse").is(':visible')) {

      if (searchPage.author !== "" && searchPage.author !== undefined) {
        ctrlScope.helper.author.query = "AND author.name:" + searchPage.author;
        fields.push("author.name:" + searchPage.author);
      }
      if (searchPage.title !== "" && searchPage.title !== undefined) {
        ctrlScope.helper.title.query = "AND title:" + searchPage.title;
        fields.push("title:" + searchPage.title);
      }
      if (searchPage.keywords !== "" && searchPage.keywords !== undefined) {
        ctrlScope.helper.subject.query = "AND subject.value:" + searchPage.subject;
        fields.push("subject.value:" + searchPage.keywords);
      }
    }

    if (searchPage.copyrightdate) {
      ctrlScope.helper.copyrightDate.query = "AND copyrightdate:" + searchPage.copyrightdate;
      fields.push("copyrightdate:" + searchPage.copyrightdate);
    }
    if (searchPage.pubdate !== undefined) {
      ctrlScope.helper.pubDate.query = "AND pubdate:" + searchPage.pubdate;
      fields.push("pubdate:" + searchPage.pubdate);
    }

    if (searchPage.PDFWordCount !== undefined) {
      ctrlScope.helper.PDFWordCount.query = "AND qualityIndicators.pdfWordCount:" + searchPage.PDFWordCount;
      fields.push("qualityIndicators.pdfWordCount:" + searchPage.PDFWordCount);
    }

    if (searchPage.PDFCharCount !== undefined) {
      ctrlScope.helper.pubDate.query = "AND qualityIndicators.pdfCharCount:" + searchPage.PDFCharCount;
      fields.push("qualityIndicators.pdfCharCount:" + searchPage.PDFCharCount);
    }

    if (searchPage.score !== undefined) {
      ctrlScope.helper.score.query = "AND qualityIndicators.score:" + searchPage.score;
      fields.push("qualityIndicators.score:" + searchPage.score);
    }

    if (searchPage.PDFVersion) {
      var PDFVersionQuery = '';
      $.each(searchPage.PDFVersion, function(index, version) {
        if (version !== "-1") {
          PDFVersionQuery += version + ',';
        }
      });
      if (PDFVersionQuery !== '') {
        query += ctrlScope.helper.PDFVersion.query = "qualityIndicators.pdfVersion:" + PDFVersionQuery.slice(0, -1);
      } else {
        ctrlScope.helper.PDFVersion.query = null;
      }
    }

    if (searchPage.refBibsNative) {
      var refBibsNativeQuery = '';
      $.each(searchPage.refBibsNative, function(index, bool) {
        if (bool !== "-1") {
          refBibsNativeQuery += bool + ',';
        }
      });
      if (refBibsNativeQuery !== '') {
        query += ctrlScope.helper.refBibsNative.query = "qualityIndicators.refBibsNative:" + refBibsNativeQuery.slice(0, -1);
      } else {
        ctrlScope.helper.refBibsNative.query = null;
      }
    }

    query += fields.join(" AND ");
    query += "&size=" + searchPage.resultsPerPage;
    query += queryFrom = "&from=" + searchPage.resultsPerPage * (searchPage.currentPage === 0 ? 1 : searchPage.currentPage - 1);
    corpusQuery = '';
    $.each(searchPage.editor, function(index, editor) {
      if (editor !== "-1") {
        corpusQuery += editor + ',';
      }
    });

    if (corpusQuery !== '') {
      query += ctrlScope.helper.corpus.query = "&corpus=" + corpusQuery.slice(0, -1);
    } else {
      ctrlScope.helper.corpus.query = null;
    }

    ctrlScope.safeApply();

    // Facets (à compléter au fur et à mesure de l'ajout de fonctionnalités)
    facetQuery = "&facet=corpus,pdfVersion,refBibsNative";

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
      facetQuery += ",copyrightdate[" + minCopyright + "-" + maxCopyright + "]";
      facetQuery += ",pubdate[" + minPubdate + "-" + maxPubdate + "]";
      facetQuery += ",pdfWordCount[" + minWordCount + "-" + maxWordCount + "]";
      facetQuery += ",pdfCharCount[" + minCharCount + "-" + maxCharCount + "]";
      facetQuery += ",score[" + minScore + "-" + maxScore + "]";
    } else {
      facetQuery += ",copyrightdate,pubdate,pdfWordCount,pdfCharCount,score";
    }
    facetQuery += "&output=*&stats";
    query += facetQuery;
    softHyphen = "<wbr>";

    $("#request-tooltip-content")
      .html("<p class='h4'>https://api.istex.fr/document/?" + softHyphen + "<mark class='bg-searchKeys'>" + (ctrlScope.helper.searchKeys.query || '') + "</mark>" + softHyphen + "<mark class='bg-copyrightDate'>" + (ctrlScope.helper.copyrightDate.query || '') + "</mark>" + softHyphen + "<mark class='bg-pubDate'>" + (ctrlScope.helper.pubDate.query || '') + "</mark>" + softHyphen + "<mark class='bg-title'>" + (ctrlScope.helper.title.query || '') + "</mark>" + softHyphen + "<mark class='bg-author'>" + (ctrlScope.helper.author.query || '') + "</mark>" + softHyphen + "<mark class='bg-subject'>" + (ctrlScope.helper.subject.query || '') + "</mark>" + softHyphen + "&size=" + (searchPage.resultsPerPage || '') + softHyphen + (queryFrom || '') + softHyphen + "<mark class='bg-corpus'>" + (ctrlScope.helper.corpus.query || '') + "</mark>" + softHyphen + (facetQuery || '').replace(/,/g, ",<wbr>").replace('&stats', "<mark class='bg-stats'>&stats</mark>") + "</p>");

    searchPageController.request(conf.apiUrl + query);
  };

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
          searchPageController.displayResults(data);
        }
      },
      error: function(err) {
        //Vérification qu'il n'y a pas eu d'autres requêtes entretemps, sinon annulation
        if (timeStamp === timeStampLocal) {
          searchPageController.manageError(err);
        }
      },
      timeout: 10000,
      complete: function() {
        //Vérification qu'il n'y a pas eu d'autres requêtes entretemps, sinon annulation
        if (timeStamp === timeStampLocal) {
          $(document).trigger("resultsLoaded");
        }
      }
    };

    $.ajax(request);
    $("#result").removeClass('hide');
    $("#paginRow").removeClass('hide');
    $("#pageNumber").removeClass('hide');
  }

  return searchPageController;
});