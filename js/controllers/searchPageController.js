define(["../models/searchPage", "../conf", "../vendor/mustache"], function (searchPage, conf, mustache) {
    "use strict";
    var searchPageController = {};
    /*****************************************
     * Fonctions de recherche et d'affichage
     *****************************************/

    searchPageController.displayResults = function (data) {
        searchPage.numberOfResults = data.total;
        searchPage.numberOfPages = searchPage.numberOfResults === 0 ? 0 : Math.ceil(searchPage.numberOfResults / searchPage.resultsPerPage);
        searchPage.currentPage = searchPage.numberOfResults === 0 ? 0 : searchPage.currentPage;
        $("#currentPage").text(searchPage.currentPage === 0 ? "*" : searchPage.currentPage);
        $("#totalPages").text(searchPage.numberOfPages === 0 ? "*" : searchPage.numberOfPages);

        var linksTemplates = {
            fulltext: "<a href=\"" + conf.apiUrl + "/{{id}}/fulltext/original\" target=\"_blank\"><span class=\"glyphicon glyphicon-file\"></span></a>",
            metadata: "<a href=\"" + conf.apiUrl + "/{{id}}/metadata/original\" target=\"_blank\"><span class=\"glyphicon glyphicon-align-center\"></span></a>"};

        var tableLine = "{{#hits}}<tr class='row'><td class='truncate col-md-8'>{{title}}</td><td class='col-md-2' style='text-align: center;'>{{> fulltext}}</td><td class='col-md-2' style='text-align: center;'>{{> metadata}}</td></tr>{{/hits}}";

        $("#tableResult").html(mustache.to_html(tableLine, data, linksTemplates));
        $("button").button('reset');
    };

    searchPageController.manageError = function (err) {
        $("button").button('reset');
        alert("Houston ... Problem!");
    };

    searchPageController.search = function () {
        var query = "?q=" + searchPage.keywords;
        query += "&size=" + searchPage.resultsPerPage;
        query += "&from=" + searchPage.resultsPerPage * (searchPage.currentPage === 0 ? 1 : searchPage.currentPage - 1);
        $("#searchButton").button('loading');
        var request = {
            url: conf.apiUrl + query,
            jsonp: true,
            crossDomain: true,
            success: searchPageController.displayResults,
            error: searchPageController.manageError
        };

        $.ajax(request);
    };

    searchPageController.advancedSearch = function () {
        var query = "?q=title:" + searchPage.title;
        $("#advancedSearchButton").button('loading');
        var request = {
            url: conf.apiUrl + query,
            jsonp: true,
            crossDomain: true,
            success: searchPageController.displayResults,
            error: searchPageController.manageError
        };

        $.ajax(request);

    };
    return searchPageController;
});