require(["js/models/searchPage", "js/controllers/searchPageController"], function (searchPage, searchPageController) {
    "use strict";


    $("#searchform").submit(function (event) {
        event.preventDefault();
        searchPage.advancedSearch = false;
        searchPage.currentPage = 1;
        searchPage.keywords = $("#searchfield").val();
        searchPage.editor = $("#editorForSimpleSearch").val();
        if (searchPage.keywords !== "") {
            searchPageController.search();
        }
    });

    $("#advancedSearchform").submit(function (event) {
        event.preventDefault();
        searchPage.advancedSearch = true;
        searchPage.currentPage = 1;
        searchPage.title = $("#titleField").val();
        searchPage.author = $("#authorField").val();
        searchPage.keywords = $("#themeField").val();
        searchPage.editor = $("#editorForAdvancedSearch").val();
        if (searchPage.title !== "" || searchPage.author !== "" || searchPage.keywords !== "") {
            searchPageController.search();
        }
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
