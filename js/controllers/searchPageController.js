/*global jquery: true, angular: true, $: true, define: true */
/*jslint node: true, browser: true, unparam: true */
/*jslint indent: 2 */
define(["../models/searchPage", "../conf", "../vendor/mustache", "../vendor/jsonview/jquery.jsonview.js"], function (searchPage, conf, mustache) {
  "use strict";
  var searchPageController = {},
    ajaxInWork;

  (function () {
    var err = $.ajax({
      url: conf.apiUrl + "corpus",
      dataType: "jsonp",
      success: function (data, status, xhr) {
        var corpusTemplate = "{{#corpusList}}<option value={{key}}>{{key}}</option>{{/corpusList}}",
          corpusList = {
            corpusList: data
          };
        $('#editorField').append(mustache.to_html(corpusTemplate, corpusList));
      }
    });
    window.setTimeout(function () {
      console.log(err);
    }, 60000);
  }());

  searchPageController.displayResults = function (data) {
    $("#jsonFromApi").JSONView(data);

    if (data.total > 0) {

      $('#accordeon').show();
      $('#first').show();
      $('#prev').show();
      $('#next').show();
      $('#last').show();

      searchPage.numberOfResults = data.total;
      searchPage.numberOfPages = searchPage.numberOfResults === 0 ? 0 : Math.ceil(searchPage.numberOfResults / searchPage.resultsPerPage);
      searchPage.currentPage = searchPage.numberOfResults === 0 ? 0 : searchPage.currentPage;
      $("#currentPage").text(searchPage.currentPage === 0 ? "*" : searchPage.currentPage);
      $("#totalPages").text(searchPage.numberOfPages === 0 ? "*" : searchPage.numberOfPages);

      $("#totalResults").val(data.total);

      data.abstr = function () {
        return function (text, render) {
          if (render(text) === "") {
            return "Pas de résumé pour ce résultat.";
          }

          return render(text);
        };
      };

      data.linksIcon = function () {

        return function (text, render) {
          var infos = render(text).split(" "),
            html = (infos.length === 2) ? "" : "<table><th>" + infos[0] + "</th><tr><td>",
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

      data.titleClic = function () {
        return function (text, render) {
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

      var tableLine = "{{#hits}}<tr class='row'><td><h4 class='alert-success col-md-12'><b>" +
        "{{#titleClic}}{{#fulltext}}{{{mimetype}}} {{{uri}}} {{/fulltext}} \"{{title}}\"{{/titleClic}}" +
        "</b></h4><p class='col-md-12' style='font-size:X-small;'>" +
        "{{#abstr}}{{abstract}}{{/abstr}}" +
        "</p><div class='label label-default' style='text-align:left;'><b>" +
        "{{corpusName}}</b></div><div class='col-md-10' style='text-align:center;'>" +
        "<div class='col-md-12'>" +
        "<div class='col-md-4'>" +
        "{{#linksIcon}}Fulltext {{#fulltext}}{{{mimetype}}} {{{uri}}} {{/fulltext}}{{/linksIcon}} " +
        "</div><div class='col-md-3'>" +
        "{{#linksIcon}}Metadata {{#metadata}}{{{mimetype}}} {{{uri}}} {{/metadata}}{{/linksIcon}} " +
        "</div><div class='col-md-3'>" +
        "{{#linksIcon}}Annexes {{#annexes}}{{{mimetype}}} {{{uri}}} {{/annexes}}{{/linksIcon}} " +
        "</div><div class='col-md-2'>" +
        "{{#linksIcon}}Covers {{#covers}}{{{mimetype}}} {{{uri}}} {{/covers}}{{/linksIcon}}" +
        "</div></div></tr>{{/hits}}",
        corpusFacetTemplate,
        $facetCorpus,
        minDate,
        maxDate;

      $("#tableResult").html(mustache.to_html(tableLine, data));

      if (!searchPage.reaffine) {

        // Vidage des facets avant remplissage
        $('#facetCorpus').empty();
        $('#facetCopyrightDate').empty();
        $('#facetPubDate').empty();

        // CorpusFacet
        corpusFacetTemplate = "{{#aggregations.corpus.buckets}}<div class='col-xs-offset-1 col-xs-10'>" +
          "<div class='checkbox'><label><input value={{key}} type='checkbox'>{{key}}</label>" +
          "<span class='badge pull-right'>{{doc_count}}</span></div></div>{{/aggregations.corpus.buckets}}";
        $facetCorpus = $('#facetCorpus');


        $('#nbCorpusFacet').text(data.aggregations.corpus.buckets.length);
        $facetCorpus.append(mustache.to_html(corpusFacetTemplate, data));

        if (data.aggregations.corpus.buckets.length === 1) {
          $facetCorpus.get(0).getElementsByTagName('input').item(0).checked = true;
          $facetCorpus.get(0).getElementsByTagName('input').item(0).disabled = true;
        }

        // CopyrightDateFacet
        minDate = parseInt(data.aggregations.copyrightdate.buckets[0].from_as_string, 10);
        maxDate = parseInt(data.aggregations.copyrightdate.buckets[0].to_as_string, 10);
        $('#nbCopyrightFacet').text(data.aggregations.copyrightdate.buckets[0].doc_count);

        $("#slider-range-copyright").slider({
          range: true,
          min: minDate,
          max: maxDate,
          values: [minDate, maxDate]
        });

        $("#amountCopyrightDate").val($("#slider-range-copyright").slider("values", 0) +
          " à " + $("#slider-range-copyright").slider("values", 1));


        // PubDateFacet
        minDate = parseInt(data.aggregations.pubdate.buckets[0].from_as_string, 10);
        maxDate = parseInt(data.aggregations.pubdate.buckets[0].to_as_string, 10);
        $('#nbPublicationFacet').text(data.aggregations.pubdate.buckets[0].doc_count);

        $("#slider-range-pubdate").slider({
          range: true,
          min: minDate,
          max: maxDate,
          values: [minDate, maxDate]
        });

        $("#amountPubDate").val($("#slider-range-pubdate").slider("values", 0) +
          " à " + $("#slider-range-pubdate").slider("values", 1));
      }

    } else {

      $("#totalResults").val(0);
      $("#tableResult").html("<tr class='row'><td class='truncate col-md-8' colspan=\"3\" style='text-align:center'>Pas de résultat pour cette recherche.</td>");
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

  searchPageController.manageError = function (err) {
    $("button").button('reset');
    $(".alert span").html("Houston ... Problem!" + err.responseText);
    $(".alert").alert();
  };

  ajaxInWork = null;

  searchPageController.search = function () {
    var
      query = "document/?q=",
      fields = [],
      ctrlScope,
      minCopyright,
      maxCopyright,
      minPubdate,
      maxPubdate,
      corpusQuery,
      request;

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
        fields.push("author.personal:" + searchPage.author);
      }
      if (searchPage.title !== "" && searchPage.title !== undefined) {
        fields.push("title:" + searchPage.title);
      }
      if (searchPage.keywords !== "" && searchPage.keywords !== undefined) {
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

    query += fields.join(" AND ");
    query += "&size=" + searchPage.resultsPerPage;
    query += "&from=" + searchPage.resultsPerPage * (searchPage.currentPage === 0 ? 1 : searchPage.currentPage - 1);
    corpusQuery = '';
    $.each(searchPage.editor, function (index, editor) {
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
    query += "&facet=corpus";


    if (searchPage.reaffine && ($("#slider-range-copyright").slider("instance") !== undefined)) {
      minCopyright = $("#slider-range-copyright").slider("values", 0);
      maxCopyright = $("#slider-range-copyright").slider("values", 1);
      minPubdate = $("#slider-range-pubdate").slider("values", 0);
      maxPubdate = $("#slider-range-pubdate").slider("values", 1);
      query += ",copyrightdate[" + minCopyright + "-" + maxCopyright + "]";
      query += ",pubdate[" + minPubdate + "-" + maxPubdate + "]";
    } else {
      query += ",copyrightdate,pubdate";
    }

    query += "&output=*";

    $("#searchButton").button('loading');
    $("#result").css("opacity", 0.4);
    $("#reqForApi").val(conf.apiUrl + query);

    request = {
      url: conf.apiUrl + query,
      dataType: "jsonp",
      crossDomain: true,
      success: searchPageController.displayResults,
      error: searchPageController.manageError
    };

    if (ajaxInWork) {
      ajaxInWork.abort();
    }
    ajaxInWork = $.ajax(request);

    $("#result").removeClass('hide');
    $("#paginRow").removeClass('hide');
    $("#pageNumber").removeClass('hide');

  };

  return searchPageController;
});