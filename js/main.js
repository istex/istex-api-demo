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
    'qTip': ['./vendor/jquery.qtip-2.2.1.min.js']
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

var istexApp = angular.module("istexApp", []);

// Contient l'historique de l'affinage
var searchPageHistory = [];

var search = function(searchPage, searchPageController) {

  var searchPageToInsert = $.extend(true, {}, searchPage);

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

  searchPageHistory = [];
  $("#allResultsRefine").siblings().remove();
  searchPageController.search(searchPageToInsert, searchPageHistory);
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

require(["config", "events"], function(config, events) {
  $(document).ready(function() {

    $("#pager-prototype").contents().appendTo(".pager-placeholder");
    $("#topResultPager a").addClass('btn-sm');

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
});