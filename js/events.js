require(
  ["models/searchPage", "controllers/searchPageController"],
  function(searchPage, searchPageController) {

    searchEvents(searchPage, searchPageController); // Barre de recherche
    paginationEvents(searchPageController); // Pagination
    sortEvents(searchPage, searchPageController); // Tris

    // Facettes de type "liste de termes"
    onClickEvents($("#facetCorpus"), 'editor', 'corpusName', searchPageController);
    onClickEvents($("#facetArticleType"), 'genre', 'genre', searchPageController);
    onClickEvents($("#facetPDFVersion"), 'PDFVersion', 'qualityIndicators.pdfVersion', searchPageController);
    onClickEvents($("#facetRefBibsNative"), 'refBibsNative', 'qualityIndicators.refBibsNative', searchPageController);

    // Facettes autocomplétées
    autocompleteEvents($("#languages"), $("#resetLanguages"), 'language', 'language', searchPage, searchPageController);
    autocompleteEvents($("#wosCategories"), $("#resetWos"), 'WOS', 'categories.wos', searchPage, searchPageController);

    // Facettes de type "slider"
    sliderEvents($("#slider-range-copyright"), $("#amountCopyrightDate"), 'copyrightdate', 'copyrightDate', searchPage, searchPageController);
    sliderEvents($("#slider-range-pubdate"), $("#amountPubDate"), 'pubdate', 'publicationDate', searchPage, searchPageController);
    sliderEvents($("#slider-range-PDFWordCount"), $("#amountPDFWordCount"), 'PDFWordCount', 'qualityIndicators.pdfWordCount', searchPage, searchPageController);
    sliderEvents($("#slider-range-PDFCharCount"), $("#amountPDFCharCount"), 'PDFCharCount', 'qualityIndicators.pdfCharCount', searchPage, searchPageController);
    sliderEvents($("#slider-range-score"), $("#amountScore"), 'score', 'qualityIndicators.score', searchPage, searchPageController);

    $("#slider-range-score").slider({
      step: 0.3
    });

    $("#completeResponse").on('show.bs.modal', function(event) {
      $("#jsonFromApi").JSONView($("#jsonViewButton").data('whatever'), {
        collapsed: true
      });
    });

    $("button.js-resetFacet").on("click", function(event, ui) {
      $("#refineRoad").contents().slice(2).remove();
      var searchPageToInsert = searchPageHistory[0];
      searchPageHistory = [];
      searchPageController.search(searchPageToInsert, searchPageHistory);
    });
  }
);

function searchEvents(searchPage, searchPageController) {
  $("#searchform").submit(function(event) {
    event.preventDefault();
    search(searchPage, searchPageController);
  });
  $("#advancedSearchForm").submit(function(event) {
    event.preventDefault();
    $("#searchform").submit();
  });
  $("#advancedSearchForm").on("input", ":input", function(event) {
    $("#searchform").submit();
  });
}

function paginationEvents(searchPageController) {

  var searchPageToInsert;
  var $pager = $(".istex-pager");

  $pager.find(".prev").click(function(e) {
    e.preventDefault();
    searchPageToInsert = searchPageHistory[searchPageHistory.length - 1];
    searchPageToInsert.currentPage = searchPageToInsert.currentPage - 1;
    searchPageController.request(searchPageToInsert, $(".prev").attr("href"));
  });
  $pager.find(".first").click(function(e) {
    e.preventDefault();
    searchPageToInsert = searchPageHistory[searchPageHistory.length - 1];
    searchPageToInsert.currentPage = 1;
    searchPageController.request(searchPageToInsert, $(".first").attr("href"));
  });
  $pager.find(".next").click(function(e) {
    e.preventDefault();
    searchPageToInsert = searchPageHistory[searchPageHistory.length - 1];
    searchPageToInsert.currentPage = searchPageToInsert.currentPage + 1;
    searchPageController.request(searchPageToInsert, $(".next").attr("href"));
  });
  $pager.find(".last").click(function(e) {
    e.preventDefault();
    searchPageToInsert = searchPageHistory[searchPageHistory.length - 1];
    searchPageToInsert.currentPage = searchPageToInsert.numberOfPages;
    searchPageController.request(searchPageToInsert, $(".last").attr("href"));
  });
}

function sortEvents(searchPage, searchPageController) {

  var searchPageToInsert;
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
}

function refineRoadClick() {
  var index = $(this).index();
  var searchPage = searchPageHistory[index];
  $(this).nextAll().remove();
  searchPageHistory = searchPageHistory.slice(0, index);
  searchPageController.search(searchPage, searchPageHistory);
}

function onClickEvents(tag, field, name, searchPageController) {

  var searchPageToInsert;

  tag.on("click", "input", function() {

    searchPageToInsert = $.extend(true, {}, searchPageHistory[searchPageHistory.length - 1]);

    var value = (field === 'refBibsNative') ? (this.value === 'T') : this.value;

    if (this.checked) {
      if (field === 'editor' && searchPageToInsert[field][0] === "-1") searchPageToInsert[field] = [];
      searchPageToInsert[field].push(value);
    } else {
      var index = searchPageToInsert[field].indexOf(value);
      searchPageToInsert[field].splice(index, 1);
      if (field === 'editor' && searchPageToInsert[field].length === 0) searchPageToInsert[field].push("-1");
    }

    $("#refineRoad").append('<li><a href="#">' + name + ':"' + value + '"</a></li>');
    $("#refineRoad").children().last().click(refineRoadClick);
    searchPageController.search(searchPageToInsert, searchPageHistory);
  });
}

function sliderEvents(tag, tagAmount, field, name, searchPage, searchPageController) {

  var searchPageToInsert;

  tag.on("slide", function(event, ui) {
    tagAmount.val(ui.values[0] + " à " + ui.values[1]);
  });

  tag.on("slidestop", function(event, ui) {

    searchPageToInsert = $.extend(true, {}, searchPageHistory[searchPageHistory.length - 1]);

    searchPageToInsert[field] = [];
    var value = "[" + ui.values[0] + " TO " + ui.values[1] + "]";
    searchPageToInsert[field].push(value);

    $("#refineRoad").append('<li><a href="#">' + name + ':' + value + '</a></li>');
    $("#refineRoad").children().last().click(refineRoadClick);

    searchPageController.search(searchPageToInsert, searchPageHistory);
  });
}

function autocompleteEvents(tag, resetTag, field, name, searchPage, searchPageController) {

  var searchPageToInsert;

  tag.autocomplete({
    minLength: 0,
    focus: function(event, ui) {
      tag.val(ui.item.label)
    },
    select: function(event, ui) {
      tag.val(ui.item.label);
      searchPageToInsert = $.extend(true, {}, searchPageHistory[searchPageHistory.length - 1]);
      searchPageToInsert[field] = [];
      searchPageToInsert[field].push(ui.item.value);
      $("#refineRoad").append('<li><a href="#">' + name + ':"' + ui.item.value + '"</a></li>');
      $("#refineRoad").children().last().click(refineRoadClick);
      searchPageController.search(searchPageToInsert, searchPageHistory);
      return false;
    }
  });

  tag.on("click", function() {
    if (tag.val() === "") tag.autocomplete("search", "")
  });

  resetTag.on("click", function() {
    searchPage[field] = [];
    tag.val("");
    searchPageController.search(searchPage, searchPageHistory)
  });
}