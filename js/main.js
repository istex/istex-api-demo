/*jslint jquery: true */
/*jslint node: true */
var globalSearchPage = {};
var globalSearchPageController = {};
var phonecatApp = angular.module('istexApp', [])
    .controller('istexAppCtrl', function($scope) {
        $scope.search = function() {
            search(globalSearchPage, globalSearchPageController);
        }
    });


var search = function(searchPage, searchPageController) {
    searchPage.reaffine = false;
    searchPage.currentPage = 1;
    searchPage.searchField = $("#searchField").val();
    searchPage.title = $("#titleField").val();
    searchPage.author = $("#authorField").val();
    searchPage.keywords = $("#themeField").val();
    searchPage.editor = [];
    searchPage.editor.push($("#editorField").val());
    searchPage.pubdate = undefined;
    searchPage.copyrightdate = undefined;
    searchPageController.search();
};

require(["js/models/searchPage", "js/controllers/searchPageController"], function(searchPage, searchPageController) {
    "use strict";
    globalSearchPage = searchPage;
    globalSearchPageController = searchPageController;
    $("#searchform").submit(function(event) {
        event.preventDefault();
        search(searchPage, searchPageController);
    });

    $("#advancedSearchForm input").keypress(function(e) {
        if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
            $('#searchButton').click();
            return false;
        } else {
            return true;
        }
    });

    $("#prev").click(function() {
        if (searchPage.currentPage <= 1) {
            return;
        }
        searchPage.currentPage--;
        searchPageController.search();
    });

    $("#first").click(function() {
        if (searchPage.currentPage <= 1) {
            return;
        }
        searchPage.currentPage = 1;
        searchPageController.search();
    });

    $("#next").click(function() {
        if (searchPage.currentPage >= searchPage.numberOfPages) {
            return;
        }
        searchPage.currentPage++;
        searchPageController.search();
    });

    $("#last").click(function() {
        if (searchPage.currentPage - 1 >= searchPage.numberOfPages) {
            return;
        }
        searchPage.currentPage = searchPage.numberOfPages;
        searchPageController.search();
    });

    $("#facetCorpus").on("click", "input", function() {
        searchPage.reaffine = true;
        if (this.checked) {
            searchPage.editor.push(this.value);
        } else {
            var index = searchPage.editor.indexOf(this.value);
            searchPage.editor.splice(index, 1);
        }
        searchPageController.search();
    });

    $("#slider-range-copyright").on("slide", function(event, ui) {
        $("#amountCopyrightDate").val(ui.values[0] + " à " + ui.values[1]);
    });

    $("#slider-range-copyright").on("slidestop", function(event, ui) {
        searchPage.reaffine = true;
        searchPage.copyrightdate = [];
        searchPage.copyrightdate.push("[" + ui.values[0] + " TO " + ui.values[1] + "]");
        searchPageController.search();
    });

    $("#slider-range-pubdate").on("slide", function(event, ui) {
        $("#amountPubDate").val(ui.values[0] + " à " + ui.values[1]);
    });

    $("#slider-range-pubdate").on("slidestop", function(event, ui) {
        searchPage.reaffine = true;
        searchPage.pubdate = [];
        searchPage.pubdate.push("[" + ui.values[0] + " TO " + ui.values[1] + "]");
        searchPageController.search();
    });

    $("#razFacet").on("click", function(event, ui) {
        search(searchPage, searchPageController);
    });

});