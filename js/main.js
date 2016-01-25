/*global jquery: true, angular: true, $: true, require: true */
/*jslint node: true, browser: true, unparam: true */
/*jslint indent: 2 */
"use strict";
var globalSearchPage = {},
  globalSearchPageController = {},
  istexTemplate = {};
require.config({
  baseUrl: 'js/',
  paths: {
    'text': '../bower_components/requirejs-text/text',
    'qTip': ['//cdn.jsdelivr.net/qtip2/2.2.1/jquery.qtip']
  }
});

// Vérification que l'utilisateur n'utilise pas IE
$.reject({
  reject: {
    msie: true,
    trident: true
  },
  display: ['firefox', 'chrome'],
  imagePath: './img/browsers/',
  close: false,
  header: 'Le navigateur Internet Explorer n\'est pas supporté pour ce site',
  paragraph1: 'Nous vous invitons à installer et à utiliser un des navigateurs suivants :',
  paragraph2: ''
});

// Intégration des fichiers HTML avant d'utiliser Angular.js
$('#searchHeader').load('html/searchHeader.html');
$('#result').load('html/result.html', function() {
  $('#facets').load('html/facets.html');
});
$('#footer').load('html/footer.html');
$('#pager-prototype').load('html/pagerPrototype.html');

var istexApp = angular.module("istexApp", []);

var searchPageHistory = [];

var search = function(searchPage, searchPageController) {
  searchPage.currentPage = 1;
  searchPage.searchField = $("#searchField").val();
  searchPage.title = $("#titleField").val();
  searchPage.author = $("#authorField").val();
  searchPage.keywords = $("#themeField").val();
  searchPage.editor = [];
  searchPage.editor.push($("#editorField").val());
  searchPage.pubdate = undefined;
  searchPage.copyrightdate = undefined;
  searchPage.PDFWordCount = undefined;
  searchPage.PDFCharCount = undefined;
  searchPage.sortBy = undefined;
  searchPage.PDFVersion = [];
  searchPage.refBibsNative = [];
  searchPage.WOS = [];
  searchPage.language = [];
  searchPageController.search();
};

istexApp.controller("istexAppCtrl", function($scope, $sce) {

  $scope.helper = {
    request: {},
    corpus: {},
    copyrightDate: {},
    pubDate: {},
    searchKeys: {},
    title: {},
    subject: {},
    author: {},
    score: {},
    PDFWordCount: {},
    PDFCharCount: {},
    PDFVersion: {},
    refBibsNative: {},
    WOS: {},
    lang: {},
    quality: {},
    sortBy: {},
    size: {},
    articleType: {}
  };

  $scope.app = {
    apiUrl: ""
  };

  /**
   * Permet d'exécuter <b>de facon sûre</b> une expression dans Angular
   * depuis l'exterieur du Framework.
   * @param Function fn
   * @returns null
   */
  $scope.safeApply = function(fn) {
    var phase = this.$root.$$phase;
    if (phase === "$apply" || phase === "$digest") {
      if (fn && (typeof fn === "function")) {
        fn();
      }
    } else {
      this.$apply(fn);
    }
  };
  globalSearchPageController.a = 3;
  $scope.search = function() {
    search(globalSearchPage, globalSearchPageController);
  };
});

require(["config"], function(config) {
  $(document).ready(function() {

    $("#pager-prototype").contents().appendTo(".pager-placeholder");

    /**
     * Istex tooltip
     * Pour déclencher le tooltip: data-toggle='istex-tooltip'
     * Par défaut le tooltip doit étre le premier element frère  'div.istex-tooltip'
     * sauf si l'attribut 'data-content-text' est précisé avec un selecteur.
     */
    $("[data-toggle='istex-tooltip']").each(function() {
      var $this = $(this),
        dataTooltipTarget = $this.data("tooltip-target"),
        $targetElement = dataTooltipTarget ? $this.find(dataTooltipTarget) : $this,
        dataContentText = $this.data("content-text"),
        $qtipContent = dataContentText ? $this.children(dataContentText) : $this.next("div.istex-tooltip"),
        position = {
          my: $qtipContent.data("my-position") || "left top",
          at: $qtipContent.data("at-position") || "right top"
        };

      $targetElement.qtip({
        content: {
          text: $qtipContent
        },
        show: {
          solo: true,
          delay: 382
        },
        hide: {
          //        event: false,
          fixed: true,
          delay: 146
        },
        position: {
          my: position.my,
          at: position.at
        },
        style: {
          def: false
        }
      });
    });

    $(document).on("resultsLoaded", function(e) {

      // Tooltip pour les icons des fichiers
      $(".download-links").find('a').each(function() {
        var $this = $(this),
          $thisImg = $this.children("img"),
          mimetype = $thisImg.attr("title");

        $thisImg
          .removeAttr("title")
          .qtip({
            content: {
              text: $("<h5><span class='label label-primary'>" + mimetype + " <span class='glyphicon glyphicon-file'></span></span></h5>" + "<p><b>" + $this.attr("href") + "</b></p>")
            },
            show: {
              solo: true,
              delay: 382
            },
            hide: {
              //            event: false,
              fixed: true,
              delay: 146
            },
            position: {
              my: "top left",
              at: "bottom center"
            },
            style: {
              def: false
            }
          });
      });

      /**
       * ellipse sur les abstracts et titles
       */
      var $tableResult = $("#tableResult"),
        dotdotdotConfig = {
          ellipsis: '…',
          watch: "window"
        };
      $tableResult.find("h4").dotdotdot(dotdotdotConfig);

      $tableResult
        .find(".abstract")
        .addClass("ellipsed")
        .dotdotdot(
          dotdotdotConfig
        )
        .click(function() {
          var $this = $(this);
          var content = $this.triggerHandler("originalContent");
          $this
            .toggleClass("ellipsed")
            .append(content)
            .trigger("update.dot");
        });

      // Retour au top
      if (!!$(document).scrollTop()) {
        $("html, body").animate({
          scrollTop: 0
        }, 600);
      }
    });
  });

  require(
    ["models/searchPage", "controllers/searchPageController"],
    function(searchPage, searchPageController) {

      globalSearchPage = searchPage;
      globalSearchPageController = searchPageController;

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

      // Pagination
      var $pager = $(".istex-pager");
      $pager.find(".prev").click(function(e) {
        e.preventDefault();
        searchPage.currentPage = searchPage.currentPage - 1;
        searchPageController.request($(".prev").attr("href"));
      });

      $pager.find(".first").click(function(e) {
        e.preventDefault();
        searchPage.currentPage = 1;
        searchPageController.request($(".first").attr("href"));
      });

      $pager.find(".next").click(function(e) {
        e.preventDefault();
        searchPage.currentPage = searchPage.currentPage + 1;
        searchPageController.request($(".next").attr("href"));
      });

      $pager.find(".last").click(function(e) {
        e.preventDefault();
        searchPage.currentPage = searchPage.numberOfPages;
        searchPageController.request($(".last").attr("href"));
      });

      // Tris
      $("#sortMenuChosen li a").click(function() {
        $("#sortMenu:first-child").html('Tri par : ' + $(this).text() + ' <span class="caret"></span>');
        switch ($(this).text()) {
          case 'Qualité':
            searchPage.sortBy = undefined;
            break;
          case 'Date de publication (ancien-récent)':
            searchPage.sortBy = 'publicationDate[asc]';
            break;
          case 'Date de publication (récent-ancien)':
            searchPage.sortBy = 'publicationDate[desc]';
            break;
          case 'Titre (A-Z)':
            searchPage.sortBy = 'title[asc]';
            break;
          case 'Titre (Z-A)':
            searchPage.sortBy = 'title[desc]';
            break;
        }
        searchPageController.search();
      });

      // Facettes

      $("#facetCorpus").on("click", "input", function() {
        if (this.checked) {
          if (searchPage.editor[0] === '-1') searchPage.editor = [];
          searchPage.editor.push(this.value);
        } else {
          var index = searchPage.editor.indexOf(this.value);
          searchPage.editor.splice(index, 1);
          if (searchPage.editor.length === 0) searchPage.editor.push('-1');
        }

        $("#refineRoad").append('<li><a href="#">corpusName:"' + this.value + '"</a></li>');

        var childrenRefineRoad = $("#refineRoad").children();

        childrenRefineRoad.last().attr('value', childrenRefineRoad.length);
        childrenRefineRoad.last().click(function() {
          //searchPage = $(this).attr('value');
          console.log(searchPage);
          $(this).nextAll().remove();
          searchPageController.search();
        });

        searchPageController.search();
      });

      $("#facetArticleType").on("click", "input", function() {
        if (this.checked) {
          searchPage.genre.push(this.value);
        } else {
          var index = searchPage.genre.indexOf(this.value);
          searchPage.genre.splice(index, 1);
        }
        $("#refineRoad").append('<li><a href="#">genre:"' + this.value + '"</a></li>');
        searchPageController.search();
      });

      $("#slider-range-copyright").on("slide", function(event, ui) {
        $("#amountCopyrightDate").val(ui.values[0] + " à " + ui.values[1]);
      });

      $("#slider-range-copyright").on("slidestop", function(event, ui) {
        searchPage.copyrightdate = [];
        var value = "[" + ui.values[0] + " TO " + ui.values[1] + "]";
        searchPage.copyrightdate.push(value);
        $("#refineRoad").append('<li><a href="#">copyrightDate:"' + value + '"</a></li>');
        searchPageController.search();
      });

      $("#slider-range-pubdate").on("slide", function(event, ui) {
        $("#amountPubDate").val(ui.values[0] + " à " + ui.values[1]);
      });

      $("#slider-range-pubdate").on("slidestop", function(event, ui) {
        searchPage.pubdate = [];
        var value = "[" + ui.values[0] + " TO " + ui.values[1] + "]";
        searchPage.pubdate.push(value);
        $("#refineRoad").append('<li><a href="#">publicationDate:"' + value + '"</a></li>');
        searchPageController.search();
      });

      $("#slider-range-PDFWordCount").on("slide", function(event, ui) {
        $("#amountPDFWordCount").val(ui.values[0] + " à " + ui.values[1]);
      });

      $("#slider-range-PDFWordCount").on("slidestop", function(event, ui) {
        searchPage.PDFWordCount = [];
        var value = "[" + ui.values[0] + " TO " + ui.values[1] + "]";
        searchPage.PDFWordCount.push(value);
        $("#refineRoad").append('<li><a href="#">qualityIndicators.pdfWordCount:"' + value + '"</a></li>');
        searchPageController.search();
      });

      $("#slider-range-PDFCharCount").on("slide", function(event, ui) {
        $("#amountPDFCharCount").val(ui.values[0] + " à " + ui.values[1]);
      });

      $("#slider-range-PDFCharCount").on("slidestop", function(event, ui) {
        searchPage.PDFCharCount = [];
        var value = "[" + ui.values[0] + " TO " + ui.values[1] + "]";
        searchPage.PDFCharCount.push(value);
        $("#refineRoad").append('<li><a href="#">qualityIndicators.pdfCharCount:"' + value + '"</a></li>');
        searchPageController.search();
      });

      $("#slider-range-score").slider({
        step: 0.3
      });

      $("#slider-range-score").on("slide", function(event, ui) {
        $("#amountScore").val(ui.values[0] + " à " + ui.values[1]);
      });

      $("#slider-range-score").on("slidestop", function(event, ui) {
        searchPage.score = [];
        var value = "[" + ui.values[0] + " TO " + ui.values[1] + "]";
        searchPage.score.push(value);
        $("#refineRoad").append('<li><a href="#">qualityIndicators.score:"' + value + '"</a></li>');
        searchPageController.search();
      });

      $("#facetPDFVersion").on("click", "input", function() {
        if (this.checked) {
          searchPage.PDFVersion.push(this.value);
        } else {
          var index = searchPage.PDFVersion.indexOf(this.value);
          searchPage.PDFVersion.splice(index, 1);
        }
        $("#refineRoad").append('<li><a href="#">qualityIndicators.pdfVersion:"' + this.value + '"</a></li>');
        searchPageController.search();
      });

      $("#facetRefBibsNative").on("click", "input", function() {
        var bool = (this.value === 'T');
        if (this.checked) {
          searchPage.refBibsNative.push(bool);
        } else {
          var index = searchPage.refBibsNative.indexOf(bool);
          searchPage.refBibsNative.splice(index, 1);
        }
        $("#refineRoad").append('<li><a href="#">qualityIndicators.refBibsNative:"' + this.value + '"</a></li>');
        searchPageController.search();
      });

      $("#languages").on("click", function() {
        if ($('#languages').val() === "") $('#languages').autocomplete("search", "");
      });

      $("#wosCategories").on("click", function() {
        if ($('#wosCategories').val() === "") $('#wosCategories').autocomplete("search", "");
      });

      $("#resetLanguages").on("click", function() {
        searchPage.language = [];
        $('#languages').val("");
        searchPageController.search();
      });

      $("#resetWos").on("click", function() {
        searchPage.WOS = [];
        $('#wosCategories').val("");
        searchPageController.search();
      });

      $("button.js-resetFacet").on("click", function(event, ui) {
        $("#refineRoad").contents().slice(2).remove();
        search(searchPageHistory[0], searchPageController);
      });
    });

});