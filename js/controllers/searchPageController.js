/*jslint jquery: true */
/*jslint node: true */

define(["../models/searchPage", "../conf", "../vendor/mustache"], function(searchPage, conf, mustache) {
    "use strict";
    var searchPageController = {};
    /*****************************************
     * Fonctions de recherche et d'affichage
     *****************************************/
    $.get(conf.apiUrl + "corpus", function(data) {
        var corpusTemplate = "{{#corpusList}}<option value={{term}}>{{term}}</option>{{/corpusList}}";
        var corpusList = {
            corpusList: data
        };
        $('#editorField').append(mustache.to_html(corpusTemplate, corpusList));
    });

    searchPageController.displayResults = function(data) {
        if (data.total > 0) {
            searchPage.numberOfResults = data.total;
            searchPage.numberOfPages = searchPage.numberOfResults === 0 ? 0 : Math.ceil(searchPage.numberOfResults / searchPage.resultsPerPage);
            searchPage.currentPage = searchPage.numberOfResults === 0 ? 0 : searchPage.currentPage;
            $("#currentPage").text(searchPage.currentPage === 0 ? "*" : searchPage.currentPage);
            $("#totalPages").text(searchPage.numberOfPages === 0 ? "*" : searchPage.numberOfPages);

            data["abstr"] = function() {
                return function(text, render) {
                    if (render(text) == "") return "Pas de résumé pour ce résultat.";
                    return render(text);
                }
            };

            data["linksIcon"] = function() {
                return function(text, render) {
                    var html = "";
                    var infos = render(text).split(" ");
                    var i = 0;
                    while ((i + 1) < infos.length) {
                        var typeFile;
                        switch (infos[i]) {
                            case 'application/zip':
                                typeFile = 'img/mimetypes/32px/zip.png'
                                break;
                            case 'application/pdf':
                                typeFile = 'img/mimetypes/32px/pdf.png'
                                break;
                            case 'image/tiff':
                                typeFile = 'img/mimetypes/32px/tiff.png'
                                break;
                            case 'application/xml':
                                typeFile = 'img/mimetypes/32px/xml.png'
                                break;
                            case 'application/mods+xml':
                                typeFile = 'img/mimetypes/32px/mods.png'
                                break;
                            default:
                                typeFile = 'img/mimetypes/32px/_blank.png'
                                break;
                        }
                        html += "<a href=\"" + infos[i + 1] + "\" target=\"_blank\"><img src=\"" + typeFile + "\" alt=\'" + infos[i].split("/")[1] + "\' title=\'" + infos[i].split("/")[1] + "\'></a>"
                        i = i + 2;
                    }
                    return html;
                }
            };

            data["titleClic"] = function() {
                return function(text, render) {
                    var res = render(text);
                    var infos = res.split(" ");
                    var index = infos.indexOf("application/pdf");
                    var title = res.slice(res.indexOf(" ", res.indexOf(" ") + 1), res.size);
                    if (index != -1) {
                        return "<a href=\"" + infos[index + 1] + "\" target=\"_blank\">" + title + "</a>"
                    } else {
                        return title
                    }
                }
            }

            var tableLine = "{{#hits}}<tr class='row'><td><h4 class='alert-success col-md-12'><b>{{#titleClic}}{{#fulltext}}{{{mimetype}}} {{{uri}}}{{/fulltext}} {{title}}{{/titleClic}}</b></h4><p class='col-md-12' style='font-size:X-small;'>{{#abstr}}{{abstract}}{{/abstr}}</p><div class='label label-default' style='text-align:left;'><b>{{corpusName}}</b></div><div class='col-md-10' style='text-align:center;'>{{#linksIcon}}{{#fulltext}}{{{mimetype}}} {{{uri}}} {{/fulltext}}{{/linksIcon}}{{#linksIcon}}{{#metadata}}{{{mimetype}}} {{{uri}}} {{/metadata}}{{/linksIcon}}</div></tr>{{/hits}}";

            $("#tableResult").html(mustache.to_html(tableLine, data));

            if (!searchPage.reaffine) {

                // Vidage des facets avant remplissage
                $('#facetCorpus').empty();
                $('#facetCopyrightDate').empty();
                $('#facetPubDate').empty();

                // CorpusFacet
                var corpusFacetTemplate = "{{#facets.corpusFacet.buckets}}<div class='col-xs-offset-1 col-xs-10'><div class='checkbox'><label><input value={{key}} type='checkbox'>{{key}}</label><span class='badge pull-right'>{{doc_count}}</span></div></div>{{/facets.corpusFacet.buckets}}";
                $('#nbCorpusFacet').text(data.facets.corpusFacet.buckets.length);
                $('#facetCorpus').append(mustache.to_html(corpusFacetTemplate, data));

                if (data.facets.corpusFacet.terms.length == 1) {
                    facetCorpus.getElementsByTagName('input').item(0).checked = true;
                    facetCorpus.getElementsByTagName('input').item(0).disabled = true;
                }

                // CopyrightDateFacet
                var minDate = data.facets.CopyrightDateFacet.buckets[0].from_as_string;
                var maxDate = data.facets.CopyrightDateFacet.buckets[0].to_as_string;
                var nbResults = data.facets.CopyrightDateFacet.buckets[0].doc_count;

                $("#slider-range-copyright").slider({
                    range: true,
                    min: minDate,
                    max: maxDate,
                    values: [minDate, maxDate]
                });
                $("#amountCopyrightDate").val("De " + $("#slider-range-copyright").slider("values", 0) +
                    " à " + $("#slider-range-copyright").slider("values", 1));
                $("#totalCopyrightDate").val(nbResults);

                // PubDateFacet
                minDate = data.facets.PubDateFacet.buckets[0].from_as_string;
                maxDate = data.facets.PubDateFacet.buckets[0].to_as_string;
                nbResults = data.facets.PubDateFacet.buckets[0].doc_count;

                $("#slider-range-pubdate").slider({
                    range: true,
                    min: minDate,
                    max: maxDate,
                    values: [minDate, maxDate]
                });
                $("#amountPubDate").val("De " + $("#slider-range-pubdate").slider("values", 0) +
                    " à " + $("#slider-range-pubdate").slider("values", 1));
                $("#totalPubDate").val(nbResults);
            }

        } else {

            $("#tableResult").html("<tr class='row'><td class='truncate col-md-8' colspan=\"3\" style='text-align:center'>Pas de résultat pour cette recherche.</td>");
            $('#nbCorpusFacet').text("");
            $('#facetCorpus').empty();
            $('#facetCopyrightDate').empty();
            $('#facetPubDate').empty();
            $("#currentPage").text("*");
            $("#totalPages").text("*");
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
        var query = "document/?q=";
        var fields = [];

        if (searchPage.searchField !== "" && searchPage.searchField !== undefined) {
            fields.push(searchPage.searchField);
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

        query += fields.join(" AND ");
        query += "&size=" + searchPage.resultsPerPage;
        query += "&from=" + searchPage.resultsPerPage * (searchPage.currentPage === 0 ? 1 : searchPage.currentPage - 1);
        $.each(searchPage.editor, function(index, editor) {
            if (editor !== "-1") {
                query += "&corpus=" + editor;
            }
        });

        // Facets (à compléter au fur et à mesure de l'ajout de fonctionnalités)
        query += "&facet=corpus";

        if ($(result).is(":visible")) {
            var minCopyright = $("#slider-range-copyright").slider("values", 0);
            var maxCopyright = $("#slider-range-copyright").slider("values", 1);
            var minPubdate = $("#slider-range-pubdate").slider("values", 0);
            var maxPubdate = $("#slider-range-pubdate").slider("values", 1);
            query += "&facet=copyrightdate[" + minCopyright + "," + maxCopyright + "]";
            query += "&facet=pubdate[" + minCopyright + "," + maxCopyright + "]";
        } else {
            query += "&facet=copyrightdate[min,max]";
            query += "&facet=pubdate[min,max]";
        }

        query += "&output=*";

        $("#searchButton").button('loading');
        $("#result").css("opacity", 0.4);

        var request = {
            url: conf.apiUrl + query,
            jsonp: true,
            crossDomain: true,
            success: searchPageController.displayResults,
            error: searchPageController.manageError
        };

        $.ajax(request);

        $("#result").removeClass('hide');
        $("#paginRow").removeClass('hide');
        $("#pageNumber").removeClass('hide');

    };
    return searchPageController;
});