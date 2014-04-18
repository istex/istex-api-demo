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

            var linksTemplates = {
                fulltext: "<a href=\"" + conf.apiUrl + "/document/{{id}}/fulltext/original\" target=\"_blank\"><span class=\"glyphicon glyphicon-file\"></span></a>",
                metadata: "<a href=\"" + conf.apiUrl + "/document/{{id}}/metadata/original\" target=\"_blank\"><span class=\"glyphicon glyphicon-align-center\"></span></a>"
            };

            var tableLine = "{{#hits}}<tr class='row'><td class='col-md-8'>{{title}}</td><td class='col-md-2' style='text-align: center;'>{{> fulltext}}</td><td class='col-md-2' style='text-align: center;'>{{> metadata}}</td></tr>{{/hits}}";

            $("#tableResult").html(mustache.to_html(tableLine, data, linksTemplates));

            var corpusFacetTemplate = "{{#facets.corpusFacet.terms}}<div class='col-sm-offset-2 col-sm-10'><div class='checkbox'><label><input value={{term}} type='checkbox'>{{term}}</label><span class='badge pull-right'>{{count}}</span></div></div>{{/facets.corpusFacet.terms}}";
            $('#nbCorpusFacet').text(data.facets.corpusFacet.terms.length);
            $('#facetCorpus').empty();
            $('#facetCorpus').append(mustache.to_html(corpusFacetTemplate, data));


        } else {

            $("#tableResult").html("<tr class='row'><td class='truncate col-md-8' colspan=\"3\" style='text-align:center'>Pas de résultat pour cette recherche.</td>");
        }
        $("button").button('reset');
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
        query += "&facet=corpus"

        $("#searchButton").button('loading');

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