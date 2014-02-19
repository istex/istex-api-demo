require(["js/conf","js/vendor/mustache"], function(conf, mustache) {
    "use strict";

    var resultsPerPage = 10;
    var currentPage = 1;
    var keywords = "";
    var numberOfPages=0;
    var numberOfResults=0;



    /******************************************
     * Gestion des évènements
     * ******************************************/

    $("#searchform").submit(function (event) {
        event.preventDefault();
        keywords = $("#searchfield").val();
        search();
    });

    $("#prev").click(function(){
        if (currentPage <= 1){
           return;
        }
        currentPage--;
        search();
    });

    $("#first").click(function(){
        if (currentPage <= 1){
            return;
        }
        currentPage = 1;
        search();
    });

    $("#next").click(function(){
        if (currentPage >= numberOfPages){
            return;
        }
        currentPage++;
        search();
    });

    $("#last").click(function(){
        if (currentPage-1 >= numberOfPages){
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
        numberOfPages = Math.ceil(numberOfResults/resultsPerPage);

        var tableLine = "{{#hits}}<tr><td>{{title}}<td><td></td><td></td></tr>{{/hits}}";
        $("#tableResult").html(mustache.render(tableLine, data));
    }

    function search() {
        var query = "?q=" + keywords;
        query += "&size=" + resultsPerPage;
        query += "&from=" + resultsPerPage * (currentPage - 1);
        var request = {
            url: conf.apiUrl + query,
            jsonp: true,
            crossDomain: true,
            success: displayResults
        };

        $.ajax(request);
    }
});
