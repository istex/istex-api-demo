require(["js/models/searchPage", "js/controllers/searchPageController"], function ( searchPage, searchPageController) {
    "use strict";


    $("#searchform").submit(function (event) {
        event.preventDefault();
        searchPage.currentPage = 1;
        searchPage.keywords = $("#searchfield").val();
        searchPage.editor = $("#editorForSimpleSearch").val();
        searchPageController.search();
    });

    $("#advancedSearchform").submit(function (event) {
        event.preventDefault();
        searchPage.currentPage = 1;
        searchPage.title = $("#titleField").val();
        searchPage.author = $("authorField").val();
        searchPage.editor = $("#editorForSimpleSearch").val();
        searchPageController.advancedSearch();
    });

    $("#prev").click(function () {
        if (searchPage.currentPage <= 1) {
            return;
        }
        searchPage.currentPage--;
        searchPageController.search();
    });

    $("#first").click(function () {
        if (searchPage.currentPage <= 1) {
            return;
        }
        searchPage.currentPage = 1;
        searchPageController.search();
    });

    $("#next").click(function () {
        if (searchPage.currentPage >= searchPage.numberOfPages) {
            return;
        }
        searchPage.currentPage++;
        searchPageController.search();
    });

    $("#last").click(function () {
        if (searchPage.currentPage - 1 >= searchPage.numberOfPages) {
            return;
        }
        searchPage.currentPage = searchPage.numberOfPages;
        searchPageController.search();
    });
});
