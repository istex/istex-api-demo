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


var istexApp = angular.module("istexApp", []);

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
  searchPage.PDFWordCount = undefined;
  searchPage.PDFCharCount = undefined;
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
    quality: {}
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

      // Toolip pour les icons des fichiers
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

      $("#slider-range-PDFWordCount").on("slide", function(event, ui) {
        $("#amountPDFWordCount").val(ui.values[0] + " à " + ui.values[1]);
      });

      $("#slider-range-PDFWordCount").on("slidestop", function(event, ui) {
        searchPage.reaffine = true;
        searchPage.PDFWordCount = [];
        searchPage.PDFWordCount.push("[" + ui.values[0] + " TO " + ui.values[1] + "]");
        searchPageController.search();
      });

      $("#slider-range-PDFCharCount").on("slide", function(event, ui) {
        $("#amountPDFCharCount").val(ui.values[0] + " à " + ui.values[1]);
      });

      $("#slider-range-PDFCharCount").on("slidestop", function(event, ui) {
        searchPage.reaffine = true;
        searchPage.PDFCharCount = [];
        searchPage.PDFCharCount.push("[" + ui.values[0] + " TO " + ui.values[1] + "]");
        searchPageController.search();
      });

      $("#slider-range-score").slider({
        step: 0.3
      });

      $("#slider-range-score").on("slide", function(event, ui) {
        $("#amountScore").val(ui.values[0] + " à " + ui.values[1]);
      });

      $("#slider-range-score").on("slidestop", function(event, ui) {
        searchPage.reaffine = true;
        searchPage.score = [];
        searchPage.score.push("[" + ui.values[0] + " TO " + ui.values[1] + "]");
        searchPageController.search();
      });

      $("#facetPDFVersion").on("click", "input", function() {
        searchPage.reaffine = true;
        if (this.checked) {
          searchPage.PDFVersion.push(this.value);
        } else {
          var index = searchPage.PDFVersion.indexOf(this.value);
          searchPage.PDFVersion.splice(index, 1);
        }
        searchPageController.search();
      });

      $("#facetRefBibsNative").on("click", "input", function() {
        searchPage.reaffine = true;
        var bool = (this.value === 'T');
        if (this.checked) {
          searchPage.refBibsNative.push(bool);
        } else {
          var index = searchPage.refBibsNative.indexOf(bool);
          searchPage.refBibsNative.splice(index, 1);
        }
        searchPageController.search();
      });

      $("#languages").on("click", function() {
        if ($('#languages').val() === "") $('#languages').autocomplete("search", "");
      });

      $("#wosCategories").on("click", function() {
        if ($('#wosCategories').val() === "") $('#wosCategories').autocomplete("search", "");
      });

      $("button.js-resetFacet").on("click", function(event, ui) {
        search(searchPage, searchPageController);
      });
    });

});