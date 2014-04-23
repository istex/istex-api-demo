/*jslint jquery: true */
/*jslint node: true */
require(["js/models/searchPage", "js/controllers/searchPageController"], function(searchPage, searchPageController) {
    "use strict";

    $("#searchform").submit(function(event) {
        event.preventDefault();
        searchPage.reaffine = false;
        searchPage.currentPage = 1;
        searchPage.searchField = $("#searchField").val();
        searchPage.title = $("#titleField").val();
        searchPage.author = $("#authorField").val();
        searchPage.keywords = $("#themeField").val();
        searchPage.editor = [];
        searchPage.editor.push($("#editorField").val());
        searchPageController.search();
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
});