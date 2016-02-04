require(
  ["models/searchPage", "controllers/searchPageController"],
  function(searchPage, searchPageController) {

    var searchPageToInsert;

    searchEvents(searchPage, searchPageController); // Barre de recherche
    paginationEvents(searchPageController); // Pagination    
    sortEvents(searchPage, searchPageController); // Tris

    // Facettes
    onClickFacetEvents(searchPageController); // Facettes de type "liste de termes"
    autocompleteFacetEvents(searchPage, searchPageController); // Facettes autocomplétées
    slideFacetEvents(searchPage, searchPageController); // Facettes de type "slider"

    $("button.js-resetFacet").on("click", function(event, ui) {
      $("#refineRoad").contents().slice(2).remove();
      searchPageToInsert = searchPageHistory[0];
      searchPageHistory = [];
      searchPageController.search(searchPageToInsert, searchPageHistory);
    });
  }
);

function searchEvents(searchPage, searchPageController) {
  $("#searchform").submit(function(event) {
    event.preventDefault();
    search(searchPage, searchPageController)
  });
  $("#advancedSearchForm").submit(function(event) {
    event.preventDefault();
    $("#searchform").submit()
  });
  $("#advancedSearchForm").on("input", ":input", function(event) {
    $("#searchform").submit()
  });
};

function paginationEvents(searchPageController) {

  var $pager = $(".istex-pager");
  $pager.find(".prev").click(function(e) {
    e.preventDefault();
    searchPageToInsert = searchPageHistory[searchPageHistory.length - 1];
    searchPageToInsert.currentPage = searchPageToInsert.currentPage - 1;
    searchPageController.request(searchPageToInsert, $(".prev").attr("href"))
  });
  $pager.find(".first").click(function(e) {
    e.preventDefault();
    searchPageToInsert = searchPageHistory[searchPageHistory.length - 1];
    searchPageToInsert.currentPage = 1;
    searchPageController.request(searchPageToInsert, $(".first").attr("href"))
  });
  $pager.find(".next").click(function(e) {
    e.preventDefault();
    searchPageToInsert = searchPageHistory[searchPageHistory.length - 1];
    searchPageToInsert.currentPage = searchPageToInsert.currentPage + 1;
    searchPageController.request(searchPageToInsert, $(".next").attr("href"))
  });
  $pager.find(".last").click(function(e) {
    e.preventDefault();
    searchPageToInsert = searchPageHistory[searchPageHistory.length - 1];
    searchPageToInsert.currentPage = searchPageToInsert.numberOfPages;
    searchPageController.request(searchPageToInsert, $(".last").attr("href"))
  });
};

function sortEvents(searchPage, searchPageController) {
  $("#sortMenuChosen li a").click(function() {
    $("#sortMenu:first-child").html('Tri par : ' + $(this).text() + ' <span class="caret"></span>');
    searchPageToInsert = searchPageHistory[searchPageHistory.length - 1];
    searchPageHistory.pop();
    switch ($(this).text()) {
      case 'Qualité':
        searchPageToInsert.sortBy = undefined;
        break;
      case 'Date de publication (ancien-récent)':
        searchPageToInsert.sortBy = 'publicationDate[asc]';
        break;
      case 'Date de publication (récent-ancien)':
        searchPageToInsert.sortBy = 'publicationDate[desc]';
        break;
      case 'Titre (A-Z)':
        searchPageToInsert.sortBy = 'title[asc]';
        break;
      case 'Titre (Z-A)':
        searchPageToInsert.sortBy = 'title[desc]';
        break;
    }
    searchPageController.search(searchPageToInsert, searchPageHistory);
  });
};

function refineRoadClick() {
  var index = $(this).index();
  var searchPage = searchPageHistory[index];
  $(this).nextAll().remove();
  searchPageHistory = searchPageHistory.slice(0, index);
  searchPageController.search(searchPage, searchPageHistory);
};

function onClickFacetEvents(searchPageController) {
  $("#facetCorpus").on("click", "input", function() {
    searchPageToInsert = $.extend(true, {}, searchPageHistory[searchPageHistory.length - 1]);
    if (this.checked) {
      if (searchPageToInsert.editor[0] === "-1") searchPageToInsert.editor = [];
      searchPageToInsert.editor.push(this.value)
    } else {
      var index = searchPageToInsert.editor.indexOf(this.value);
      searchPageToInsert.editor.splice(index, 1);
      if (searchPageToInsert.editor.length === 0) searchPageToInsert.editor.push("-1")
    }
    $("#refineRoad").append('<li><a href="#">corpusName:"' + this.value + '"</a></li>');
    $("#refineRoad").children().last().click(refineRoadClick);
    searchPageController.search(searchPageToInsert, searchPageHistory)
  });

  $("#facetArticleType").on("click", "input", function() {
    searchPageToInsert = $.extend(true, {}, searchPageHistory[searchPageHistory.length - 1]);
    if (this.checked) {
      searchPageToInsert.genre.push(this.value)
    } else {
      var index = searchPageToInsert.genre.indexOf(this.value);
      searchPageToInsert.genre.splice(index, 1)
    }
    $("#refineRoad").append('<li><a href="#">genre:"' + this.value + '"</a></li>');
    $("#refineRoad").children().last().click(refineRoadClick);
    searchPageController.search(searchPageToInsert, searchPageHistory)
  });

  $("#facetPDFVersion").on("click", "input", function() {

    searchPageToInsert = $.extend(true, {}, searchPageHistory[searchPageHistory.length - 1]);

    if (this.checked) {
      searchPageToInsert.PDFVersion.push(this.value);
    } else {
      var index = searchPageToInsert.PDFVersion.indexOf(this.value);
      searchPageToInsert.PDFVersion.splice(index, 1);
    }

    $("#refineRoad").append('<li><a href="#">qualityIndicators.pdfVersion:"' + this.value + '"</a></li>');
    $("#refineRoad").children().last().click(refineRoadClick);

    searchPageController.search(searchPageToInsert, searchPageHistory);
  });

  $("#facetRefBibsNative").on("click", "input", function() {

    searchPageToInsert = $.extend(true, {}, searchPageHistory[searchPageHistory.length - 1]);

    var bool = (this.value === 'T');
    if (this.checked) {
      searchPageToInsert.refBibsNative.push(bool);
    } else {
      var index = searchPageToInsert.refBibsNative.indexOf(bool);
      searchPageToInsert.refBibsNative.splice(index, 1);
    }

    $("#refineRoad").append('<li><a href="#">qualityIndicators.refBibsNative:"' + this.value + '"</a></li>');
    $("#refineRoad").children().last().click(refineRoadClick);

    searchPageController.search(searchPageToInsert, searchPageHistory);
  });
};

function slideFacetEvents(searchPage, searchPageController) {
  $("#slider-range-copyright").on("slide", function(event, ui) {
    $("#amountCopyrightDate").val(ui.values[0] + " à " + ui.values[1]);
  });

  $("#slider-range-copyright").on("slidestop", function(event, ui) {

    searchPageToInsert = $.extend(true, {}, searchPageHistory[searchPageHistory.length - 1]);

    searchPageToInsert.copyrightdate = [];
    var value = "[" + ui.values[0] + " TO " + ui.values[1] + "]";
    searchPageToInsert.copyrightdate.push(value);

    $("#refineRoad").append('<li><a href="#">copyrightDate:"' + value + '"</a></li>');
    $("#refineRoad").children().last().click(refineRoadClick);

    searchPageController.search(searchPageToInsert, searchPageHistory);
  });

  $("#slider-range-pubdate").on("slide", function(event, ui) {
    $("#amountPubDate").val(ui.values[0] + " à " + ui.values[1]);
  });

  $("#slider-range-pubdate").on("slidestop", function(event, ui) {

    searchPageToInsert = $.extend(true, {}, searchPageHistory[searchPageHistory.length - 1]);

    searchPageToInsert.pubdate = [];
    var value = "[" + ui.values[0] + " TO " + ui.values[1] + "]";
    searchPageToInsert.pubdate.push(value);

    $("#refineRoad").append('<li><a href="#">publicationDate:"' + value + '"</a></li>');
    $("#refineRoad").children().last().click(refineRoadClick);

    searchPageController.search(searchPageToInsert, searchPageHistory);
  });

  $("#slider-range-PDFWordCount").on("slide", function(event, ui) {
    $("#amountPDFWordCount").val(ui.values[0] + " à " + ui.values[1]);
  });

  $("#slider-range-PDFWordCount").on("slidestop", function(event, ui) {

    searchPageToInsert = $.extend(true, {}, searchPageHistory[searchPageHistory.length - 1]);

    searchPageToInsert.PDFWordCount = [];
    var value = "[" + ui.values[0] + " TO " + ui.values[1] + "]";
    searchPageToInsert.PDFWordCount.push(value);

    $("#refineRoad").append('<li><a href="#">qualityIndicators.pdfWordCount:"' + value + '"</a></li>');
    $("#refineRoad").children().last().click(refineRoadClick);

    searchPageController.search(searchPageToInsert, searchPageHistory);
  });

  $("#slider-range-PDFCharCount").on("slide", function(event, ui) {
    $("#amountPDFCharCount").val(ui.values[0] + " à " + ui.values[1]);
  });

  $("#slider-range-PDFCharCount").on("slidestop", function(event, ui) {

    searchPageToInsert = $.extend(true, {}, searchPageHistory[searchPageHistory.length - 1]);

    searchPageToInsert.PDFCharCount = [];
    var value = "[" + ui.values[0] + " TO " + ui.values[1] + "]";
    searchPageToInsert.PDFCharCount.push(value);

    $("#refineRoad").append('<li><a href="#">qualityIndicators.pdfCharCount:"' + value + '"</a></li>');
    $("#refineRoad").children().last().click(refineRoadClick);

    searchPageController.search(searchPageToInsert, searchPageHistory);
  });

  $("#slider-range-score").slider({
    step: 0.3
  });

  $("#slider-range-score").on("slide", function(event, ui) {
    $("#amountScore").val(ui.values[0] + " à " + ui.values[1]);
  });

  $("#slider-range-score").on("slidestop", function(event, ui) {

    searchPageToInsert = $.extend(true, {}, searchPageHistory[searchPageHistory.length - 1]);

    searchPageToInsert.score = [];
    var value = "[" + ui.values[0] + " TO " + ui.values[1] + "]";
    searchPageToInsert.score.push(value);

    $("#refineRoad").append('<li><a href="#">qualityIndicators.score:"' + value + '"</a></li>');
    $("#refineRoad").children().last().click(refineRoadClick);

    searchPageController.search(searchPageToInsert, searchPageHistory);
  });
};

function autocompleteFacetEvents(searchPage, searchPageController) {
  $("#languages").autocomplete({
    minLength: 0,
    focus: function(event, ui) {
      $("#languages").val(ui.item.label)
    },
    select: function(event, ui) {
      $("#languages").val(ui.item.label);
      searchPageToInsert = $.extend(true, {}, searchPageHistory[searchPageHistory.length - 1]);
      searchPageToInsert.language = [];
      searchPageToInsert.language.push(ui.item.value);
      $("#refineRoad").append('<li><a href="#">language:"' + ui.item.value + '"</a></li>');
      $("#refineRoad").children().last().click(refineRoadClick);
      searchPageController.search(searchPageToInsert, searchPageHistory);
      return false
    }
  });
  $("#languages").on("click", function() {
    if ($("#languages").val() === "") $("#languages").autocomplete("search", "")
  });

  $("#wosCategories").autocomplete({
    minLength: 0,
    focus: function(event, ui) {
      $("#wosCategories").val(ui.item.label)
    },
    select: function(event, ui) {
      $("#wosCategories").val(ui.item.label);
      searchPageToInsert = $.extend(true, {}, searchPageHistory[searchPageHistory.length - 1]);
      searchPageToInsert.WOS = [];
      searchPageToInsert.WOS.push(ui.item.value);
      $("#refineRoad").append('<li><a href="#">categories.wos:"' + ui.item.value + '"</a></li>');
      $("#refineRoad").children().last().click(refineRoadClick);
      searchPageController.search(searchPageToInsert, searchPageHistory);
      return false
    }
  });
  $("#wosCategories").on("click", function() {
    if ($("#wosCategories").val() === "") $("#wosCategories").autocomplete("search", "")
  });
  
  $("#resetLanguages").on("click", function() {
    searchPage.language = [];
    $("#languages").val("");
    searchPageController.search(searchPage, searchPageHistory)
  });
  $("#resetWos").on("click", function() {
    searchPage.WOS = [];
    $("#wosCategories").val("");
    searchPageController.search(searchPage, searchPageHistory)
  });
};