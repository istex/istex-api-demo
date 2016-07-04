require(
  ["models/searchPage", "controllers/searchPageController"],
  function(searchPage, searchPageController) {

    globalSearchPage = searchPage;
    globalSearchPageController = searchPageController;

    searchEvents(searchPage, searchPageController); // Barre de recherche
    paginationEvents(searchPageController); // Pagination
    sortEvents(searchPage, searchPageController); // Tris

    // Facettes de type "liste de termes"
    onClickEvents($("#facetCorpus"), 'editor', 'corpusName', searchPageController);
    onClickEvents($("#facetPDFVersion"), 'PDFVersion', 'qualityIndicators.pdfVersion', searchPageController);
    onClickEvents($("#facetRefBibsNative"), 'refBibsNative', 'qualityIndicators.refBibsNative', searchPageController);

    // Facettes autocomplétées
    autocompleteEvents($("#languages"), $("#resetLanguages"), 'language', 'language', searchPage, searchPageController);
    autocompleteEvents($("#wosCategories"), $("#resetWos"), 'WOS', 'categories.wos', searchPage, searchPageController);

    // Facettes imbriquées
    imbricatedEvents(searchPageController);

    // Facettes de type "slider"
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

  $('#btn-reset').on('click', function() {
    $('#builder').queryBuilder('reset');
  });

  $('input:radio[name=scoreGroup]').on('click change', function() {
    //$('#builder').queryBuilder('reset');
    switch ($(this)[0].value) {
      case 'quality':
        searchPage.rankBy = 'qualityOverRelevance';
        break;
      case 'lucene':
        searchPage.rankBy = undefined;
        break;
    }
  });

  var advancedSearchFunction = function() {
    var result = $('#builder').queryBuilder('getRules');
    if (!$.isEmptyObject(result)) {
      $("#advancedSearch").modal('hide');
      searchPage.searchField = recursiveConstructor(result.condition, result.rules);
      searchPageController.search(searchPage, searchPageHistory);
    }
  }

  $('#advancedSearch').on('keydown', function(e) {
    if (e.which === 13) {
      $(document.activeElement).blur();
      advancedSearchFunction()
    }
  });
  $('#btn-get').on('click', advancedSearchFunction);
};

function recursiveConstructor(condition, rules) {

  var queryPart = '(';
  for (var i = 0; i < rules.length; i++) {
    var qp = rules[i];
    if (qp.condition) {
      queryPart += recursiveConstructor(qp.condition, qp.rules) + ' ' + condition + ' ';
    } else {
      var notPartBegin = (qp.operator.indexOf('not') !== -1) ? '(NOT ' : '';
      var notPartEnd = (qp.operator.indexOf('not') !== -1) ? ') ' : ' ';
      switch (qp.operator) {
        case 'equal':
        case 'not_equal':
          queryPart += notPartBegin + qp.id + ':' + qp.value + notPartEnd + condition + ' ';
          break;
        case 'contains':
        case 'not_contains':
          queryPart += notPartBegin + qp.id + ':*' + qp.value + '*' + notPartEnd + condition + ' ';
          break;
        case 'begins_with':
        case 'not_begins_with':
          queryPart += notPartBegin + qp.id + ':' + qp.value + '*' + notPartEnd + condition + ' ';
          break;
        case 'ends_with':
        case 'not_ends_with':
          queryPart += notPartBegin + qp.id + ':*' + qp.value + notPartEnd + condition + ' ';
          break;

        case 'greater':
          queryPart += qp.id + ':[' + qp.value + ' TO *] ' + condition + ' ';
          break;
        case 'less':
          queryPart += qp.id + ':[* TO ' + qp.value + '] ' + condition + ' ';
          break;
        case 'between':
        case 'not_between':
          queryPart += notPartBegin + qp.id + ':[' + qp.value[0] + ' TO ' + qp.value[1] + ']' + notPartEnd + condition + ' ';
          break;

        case 'is_empty':
          queryPart += '(NOT ' + qp.id + ':*) ' + condition + ' ';
          break;
        case 'is_not_empty':
          queryPart += qp.id + ':* ' + condition + ' ';
          break;
      }
    }
  };

  if (condition === 'AND') {
    return queryPart.slice(0, -5) + ')';
  } else {
    return queryPart.slice(0, -4) + ')';
  }
};

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
      case 'Aucun':
        searchPageToInsert.sortBy = undefined;
        break;
      case 'Publication (ancien-récent)':
        searchPageToInsert.sortBy = 'publicationDate[asc]';
        break;
      case 'Publication (récent-ancien)':
        searchPageToInsert.sortBy = 'publicationDate[desc]';
        break;
      case 'Titre (A-Z)':
        searchPageToInsert.sortBy = 'title.raw[asc]';
        break;
      case 'Titre (Z-A)':
        searchPageToInsert.sortBy = 'title.raw[desc]';
        break;
    }
    searchPageController.search(searchPageToInsert, searchPageHistory);
  });
}

function refineRoadClick(searchPageController) {
  return function() {
    var index = $(this).index();
    var searchPage = searchPageHistory[index];
    $(this).nextAll().remove();
    searchPageHistory = searchPageHistory.slice(0, index);
    searchPageController.search(searchPage, searchPageHistory);
  }
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

    $("#refineRoad").append('<li><a href="#">' + name + '.raw:"' + value + '"</a></li>');
    $("#refineRoad").children().last().click(refineRoadClick(searchPageController));
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
    $("#refineRoad").children().last().click(refineRoadClick(searchPageController));

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
      $("#refineRoad").append('<li><a href="#">' + name + '.raw:"' + ui.item.value + '"</a></li>');
      $("#refineRoad").children().last().click(refineRoadClick(searchPageController));
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

function imbricatedEvents(searchPageController) {

  // Facette type de publication 
  var searchPageToInsert,
    refineRoadHTML;

  $("#publicationTypes").autocomplete({
    minLength: 0,
    focus: function(event, ui) {
      $("#publicationTypes").val(ui.item.label)
    },
    select: function(event, ui) {

      $("#publicationTypes").val(ui.item.label);
      searchPageToInsert = $.extend(true, {}, searchPageHistory[searchPageHistory.length - 1]);
      searchPageToInsert.hostGenre = [];
      searchPageToInsert.hostGenre.push(ui.item.value);
      refineRoadHTML = '<li><a href="#">host.genre.raw:"' + ui.item.value + '"';

      // Facette type de contenu, mis à jour selon le type de publication
      $("#articleTypes").autocomplete({
        minLength: 0,
        focus: function(event, ui2) {
          $("#articleTypes").val(ui2.item.label)
        },
        select: function(event, ui2) {
          $("#articleTypes").val(ui2.item.label);
          searchPageToInsert.genre = [];
          searchPageToInsert.genre.push(ui2.item.value);
          $("#refineRoad").append(refineRoadHTML + ' AND genre.raw:"' + ui2.item.value + '"</a></li>');
          $("#refineRoad").children().last().click(refineRoadClick(searchPageController));
          searchPageController.search(searchPageToInsert, searchPageHistory);
          return false;
        }
      });

      $("#articleTypes").on("click", function() {
        if ($("#articleTypes").val() === "") $("#articleTypes").autocomplete("search", "")
      });

      // Mettre à jour la liste des possibilités de type de contenu
      $("#articleTypes").autocomplete("option", "source", genresByPubTypes[ui.item.label])
        .autocomplete('instance')._renderItem = function(ul, item) {
          return $('<li>')
            .append('<a>' + item.label + "<br><span style=\"font-size:10px;\">" + item.desc + '</span></a>')
            .appendTo(ul);
        };

      $("#facetArticleType").removeClass('hide');
    }
  });

  $("#publicationTypes").on("click", function() {
    if ($("#publicationTypes").val() === "") $("#publicationTypes").autocomplete("search", "")
  });

}