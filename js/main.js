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
    'text': '../node_modules/requirejs-text/text',
    'json': '../node_modules/requirejs-json/json',
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
var corpusList = ['*'];
var genresByPubTypes = {};

var search = function(searchPage, searchPageController) {

  var searchPageToInsert = $.extend(true, {}, searchPage);

  searchPageToInsert.currentPage = 1;
  searchPageToInsert.searchField = $("#searchField").val();
  searchPageToInsert.editor = [];
  searchPageToInsert.pubdate = undefined;
  searchPageToInsert.PDFWordCount = undefined;
  searchPageToInsert.PDFCharCount = undefined;
  searchPageToInsert.sortBy = undefined;
  searchPageToInsert.PDFVersion = [];
  searchPageToInsert.refBibsNative = [];
  searchPageToInsert.WOS = [];
  searchPageToInsert.scopus = [];
  searchPageToInsert.sciMetrix = [];
  searchPageToInsert.inist = [];
  searchPageToInsert.language = [];

  searchPageHistory = [];
  $("#allResultsRefine").siblings().remove();
  searchPageController.search(searchPageToInsert, searchPageHistory);
};

istexApp.controller("istexAppCtrl", function($scope, $sce) {

  $scope.helper = {
    request: {},
    corpus: {},
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
    scopus: {},
    sciMetrix: {},
    inist: {},
    lang: {},
    quality: {},
    sortBy: {},
    rankBy: {},
    size: {},
    enrichType: {},
    publicationType: {},
    articleType: {},
    sort: {}
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

require(["config", "events", "vendor/queryBuilder/query-builder.standalone-2.3.1.min", 'json!mapping.json'], function(config, events, queryBuilder, mapping) {

  (function() {
    var err = $.ajax({
      url: config.apiUrl + "corpus?sid=istex-api-demo",
      dataType: "jsonp",
      success: function(data, status, xhr) {

        for (var i in data) {
          corpusList.push(data[i].key);
        }

        var jsonQueryBuilder = {
          plugins: ['bt-tooltip-errors'],
          filters: [],
          lang_code: 'fr'
        };
        var keys = Object.keys(mapping);
        for (i = 0; i < keys.length; i++) {

          var filter = {
            id: keys[i],
            type: mapping[keys[i]],
            input: 'text',
            operators: ['equal', 'not_equal', 'is_empty', 'is_not_empty'],
            default_value: '*'
          };

          switch (mapping[keys[i]]) {

            case 'string':
              filter.operators.push('contains', 'not_contains', 'begins_with', 'not_begins_with', 'ends_with', 'not_ends_with');
              break;

            case 'integer':
            case 'double':
            case 'date':
              filter.operators.push('greater', 'less', 'between', 'not_between');
              if (mapping[keys[i]] === 'date') {
                filter.type = 'string';
                filter.validation = {};
                filter.validation.format = /^.{4}$/;
                filter.placeholder = '____ (YYYY)';
                filter.default_value = '';
              };
              break;

            case 'boolean':
              filter.input = 'radio';
              filter.values = ['true', 'false'];
              filter.default_value = 'true';
              break;

            case 'select':
              filter.input = 'select';
              filter.type = 'string';
              if (keys[i] === 'corpusName') {
                filter.values = corpusList;
                filter.default_value = '*';
              }
              break;
          }
          jsonQueryBuilder.filters.push(filter);
        }

        $('#builder').queryBuilder(jsonQueryBuilder);
      }
    });

    var cacheClear = $.ajax({
      url: config.apiUrl + 'properties?sid=istex-api-demo',
      success: function(data, status, xhr) {
        if (data.corpus.lastUpdate > localStorage['last-refresh']) {
          console.log('Le cache a été nettoyé...');
          localStorage.clear();
        }
      }
    });
  }());

  $(document).ready(function() {

    // Load the ISTEX web header

    //if($ && $.browser && !$.browser.firefox){
      var script    = document.createElement('script');
      script.src    = '//web-header.delivery.istex.fr/bundle.js';
      script.id = 'iwh_script';
      script.type = 'text/javascript';

      document.head.appendChild(script);
    //}
    if (!localStorage['skipDemo']) {
      $("#welcomeModal").modal('show');
    }

    $("#pager-prototype").contents().appendTo(".pager-placeholder");
    $("#topResultPager a").addClass('btn-sm');

    $("#versionDemo").append(config.version);

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

      // Tooltip sur les résultats
      $.get('html/tooltips/objDoc.html', function(objDocHtml) {
        $("table").find('tr').each(function() {
          $(this).qtip({
            content: {
              text: $(objDocHtml.replace(/{{apiUrl}}\//g, config.apiUrl))
            },
            show: {
              solo: true,
              delay: 382
            },
            hide: {
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
      }, 'html');

      // Tooltip pour les icons des fichiers
      $.get('html/tooltips/downloadLinks.html', function(dlLinksHtml) {
        $(".download-links").find('a').each(function() {
          var $this = $(this),
            $thisImg = $this.children("img"),
            mimetype = $thisImg.attr("title");

          $thisImg
            .removeAttr("title")
            .qtip({
              content: {
                text: $(dlLinksHtml.replace(/{{apiUrl}}\//g, config.apiUrl).replace('$MIMETYPE', mimetype).replace('$HREF', $this.attr("href")))
              },
              show: {
                solo: true,
                delay: 382
              },
              hide: {
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
      }, 'html');

      /**
       * ellipse sur les abstracts
       */
      var $tableResult = $("#tableResult"),
        dotdotdotConfig = {
          ellipsis: '…',
          watch: "window"
        };

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

      // Démonstration
      if (!($('#facetMenu').attr('alreadyopen'))) {
        $('#facetMenu').popover({
          html: true,
          title: 'Astuce <a class="close" href="#");">&times;</a>',
          content: "Vous pouvez sélectionner une facette en cliquant sur Corpus ci-dessous.",
          placement: 'top'
        });

        $('#facetMenu').popover('show');

        $('#facetMenu').on('click', function() {
          $(this).popover('destroy');
        });

        $(document).on('click', '.popover', function() {
          $(this).popover('destroy');
        });

        $('#facetMenu').attr('alreadyopen', 'true');
      }
    });
  });
});
