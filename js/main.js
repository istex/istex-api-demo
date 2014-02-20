require(["js/conf", "js/vendor/mustache"], function (conf, mustache) {
    "use strict";

    var resultsPerPage = 10;
    var currentPage = 0;
    var keywords = "";
    var title = "";
    var numberOfPages = 0;
    var numberOfResults = 0;


    /******************************************
     * Gestion des évènements
     * ******************************************/

    $("#searchform").submit(function (event) {
        event.preventDefault();
        currentPage = 1;
        keywords = $("#searchfield").val();
        search();
    });

    $("#advancedSearchform").submit(function (event) {
        event.preventDefault();
        currentPage = 1;
        title = $("#titleField").val();
        advancedSearch();
    });

    $("#prev").click(function () {
        if (currentPage <= 1) {
            return;
        }
        currentPage--;
        search();
    });

    $("#first").click(function () {
        if (currentPage <= 1) {
            return;
        }
        currentPage = 1;
        search();
    });

    $("#next").click(function () {
        if (currentPage >= numberOfPages) {
            return;
        }
        currentPage++;
        search();
    });

    $("#last").click(function () {
        if (currentPage - 1 >= numberOfPages) {
            return;
        }
        currentPage = numberOfPages;
        search();
    });

    /*****************************************
     * Fonctions de recherche et d'affichage
     *****************************************/

    function displayResults(data) {
        numberOfResults = data.total;
        numberOfPages = numberOfResults === 0 ? 0 : Math.ceil(numberOfResults / resultsPerPage);
        currentPage = numberOfResults === 0 ? 0 : currentPage;
        $("#currentPage").text(currentPage === 0 ? "*" : currentPage);
        $("#totalPages").text(numberOfPages === 0 ? "*" : numberOfPages);

        var linksTemplates = {
            fulltext: "<a href=\"" + conf.apiUrl + "/{{id}}/fulltext/original\" target=\"_blank\"><span class=\"glyphicon glyphicon-file\"></span></a>",
            metadata: "<a href=\"" + conf.apiUrl + "/{{id}}/metadata/original\" target=\"_blank\"><span class=\"glyphicon glyphicon-align-center\"></span></a>"};

        var tableLine = "{{#hits}}<tr><td>{{title}}</td><td style='text-align: center;'>{{> fulltext}}</td><td style='text-align: center;'>{{> metadata}}</td></tr>{{/hits}}";

        $("#tableResult").html(mustache.to_html(tableLine, data, linksTemplates));
        $("button").button('reset');
    }

    function manageError(err){
        $("button").button('reset');
        alert("Houston ... Problem!");
    }

    function search() {
        var query = "?q=" + keywords;
        query += "&size=" + resultsPerPage;
        query += "&from=" + resultsPerPage * (currentPage === 0 ? 1 : currentPage - 1);
        $("#searchButton").button('loading');
        var request = {
            url: conf.apiUrl + query,
            jsonp: true,
            crossDomain: true,
            success: displayResults,
            error : manageError
        };

        $.ajax(request);
    }

    function advancedSearch() {
        var query = "?q=title:" + title;
        $("#advancedSearchButton").button('loading');
        var request = {
            url: conf.apiUrl + query,
            jsonp: true,
            crossDomain: true,
            success: displayResults,
            error : manageError
        };

        $.ajax(request);

    }

});
