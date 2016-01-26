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

// Contient l'historique de l'affinage
var searchPageHistory = [];

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

      var searchPageToInsert;

      $("#searchform").submit(function(event) {
        event.preventDefault();

        searchPageToInsert = $.extend(true, {}, searchPage);

        searchPageToInsert.currentPage = 1;
        searchPageToInsert.searchField = $("#searchField").val();
        searchPageToInsert.title = $("#titleField").val();
        searchPageToInsert.author = $("#authorField").val();
        searchPageToInsert.keywords = $("#themeField").val();
        searchPageToInsert.editor = [];
        searchPageToInsert.editor.push($("#editorField").val());
        searchPageToInsert.pubdate = undefined;
        searchPageToInsert.copyrightdate = undefined;
        searchPageToInsert.PDFWordCount = undefined;
        searchPageToInsert.PDFCharCount = undefined;
        searchPageToInsert.sortBy = undefined;
        searchPageToInsert.PDFVersion = [];
        searchPageToInsert.refBibsNative = [];
        searchPageToInsert.WOS = [];
        searchPageToInsert.language = [];

        searchPageController.search(searchPageToInsert, searchPageHistory);
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

      // Tris
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

      // Facettes

      var refineRoadClick = function() {
        var index = $(this).index();
        var searchPage = searchPageHistory[index];
        $(this).nextAll().remove();
        searchPageHistory = searchPageHistory.slice(0, index);
        searchPageController.search(searchPage, searchPageHistory);
      }

      $("#facetCorpus").on("click", "input", function() {

        searchPageToInsert = $.extend(true, {}, searchPageHistory[searchPageHistory.length - 1]);

        if (this.checked) {
          if (searchPageToInsert.editor[0] === '-1') searchPageToInsert.editor = [];
          searchPageToInsert.editor.push(this.value);
        } else {
          var index = searchPageToInsert.editor.indexOf(this.value);
          searchPageToInsert.editor.splice(index, 1);
          if (searchPageToInsert.editor.length === 0) searchPageToInsert.editor.push('-1');
        }

        $("#refineRoad").append('<li><a href="#">corpusName:"' + this.value + '"</a></li>');
        $("#refineRoad").children().last().click(refineRoadClick);

        searchPageController.search(searchPageToInsert, searchPageHistory);
      });

      $("#facetArticleType").on("click", "input", function() {

        searchPageToInsert = $.extend(true, {}, searchPageHistory[searchPageHistory.length - 1]);

        if (this.checked) {
          searchPageToInsert.genre.push(this.value);
        } else {
          var index = searchPageToInsert.genre.indexOf(this.value);
          searchPageToInsert.genre.splice(index, 1);
        }
        $("#refineRoad").append('<li><a href="#">genre:"' + this.value + '"</a></li>');
        $("#refineRoad").children().last().click(refineRoadClick);

        searchPageController.search(searchPageToInsert, searchPageHistory);
      });

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

      $("#languages").autocomplete({
        minLength: 0,
        focus: function(event, ui) {
          $('#languages').val(ui.item.label);
        },
        select: function(event, ui) {
          $('#languages').val(ui.item.label);

          searchPageToInsert = $.extend(true, {}, searchPageHistory[searchPageHistory.length - 1]);

          searchPageToInsert.language = [];
          searchPageToInsert.language.push(ui.item.value);
          $("#refineRoad").append('<li><a href="#">language:"' + ui.item.value + '"</a></li>');
          $("#refineRoad").children().last().click(refineRoadClick);

          searchPageController.search(searchPageToInsert, searchPageHistory);

          return false;
        }
      });

      $("#languages").on("click", function() {
        if ($('#languages').val() === "") $('#languages').autocomplete("search", "");
      });

      $("#wosCategories").autocomplete({
        minLength: 0,
        focus: function(event, ui) {
          $("#wosCategories").val(ui.item.label);
        },
        select: function(event, ui) {
          $("#wosCategories").val(ui.item.label);

          searchPageToInsert = $.extend(true, {}, searchPageHistory[searchPageHistory.length - 1]);

          searchPageToInsert.WOS = [];
          searchPageToInsert.WOS.push(ui.item.value);
          $("#refineRoad").append('<li><a href="#">categories.wos:"' + ui.item.value + '"</a></li>');
          $("#refineRoad").children().last().click(refineRoadClick);

          searchPageController.search(searchPageToInsert, searchPageHistory);

          return false;
        }
      });

      $("#wosCategories").on("click", function() {
        if ($('#wosCategories').val() === "") $('#wosCategories').autocomplete("search", "");
      });

      $("#resetLanguages").on("click", function() {
        searchPage.language = [];
        $('#languages').val("");
        searchPageController.search(searchPage, searchPageHistory);
      });

      $("#resetWos").on("click", function() {
        searchPage.WOS = [];
        $('#wosCategories').val("");
        searchPageController.search(searchPage, searchPageHistory);
      });

      $("button.js-resetFacet").on("click", function(event, ui) {
        $("#refineRoad").contents().slice(2).remove();
        var searchPage = searchPageHistory[0];
        searchPageHistory = [];
        searchPageController.search(searchPageHistory[0], searchPageHistory);
      });
    });

});