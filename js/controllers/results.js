define(["config", "vendor/mustache", "text!views/resultRow.html"], function(config, mustache, resultRowTemplate) {
  return {
    displayRanges: function(data, field, slider, amount, nb, type) {

      var minDate, maxDate;
      if (type === 'integer') {
        minDate = parseInt(data.aggregations[field].buckets[0].from, 10);
        maxDate = parseInt(data.aggregations[field].buckets[0].to, 10);
      } else if (type === 'float') {
        minDate = parseFloat(data.aggregations[field].buckets[0].from);
        maxDate = parseFloat(data.aggregations[field].buckets[0].to);
      } else if (type === 'date') {
        minDate = parseInt(data.aggregations[field].buckets[0].fromAsString, 10);
        maxDate = parseInt(data.aggregations[field].buckets[0].toAsString, 10);
      }

      if (nb !== '') $(nb).text(data.aggregations[field].buckets[0].docCount);
      $(slider).slider({
        range: true,
        min: minDate,
        max: maxDate,
        values: [minDate, maxDate]
      });
      $(amount).val($(slider).slider("values", 0) +
        " à " + $(slider).slider("values", 1));
    },
    displayResults: function(searchPage, data) {
      $("#jsonFromApi").JSONView(data);

      if (data.total > 0) {
        $("#accordeon").show();
        $(".istex-pager")
          .show()
          .find(".first")
          .attr("href", data.firstPageURI)
          .end()
          .find(".last")
          .attr("href", data.lastPageURI)
          .end();

        $(".js-firstPageURI").html(data.firstPageURI);
        $(".js-lastPageURI").html(data.lastPageURI);

        // Selon les réponses, il peut ne pas y avoir de prevPageURI ou de nextPageURI
        $(".prev").attr("href", data.prevPageURI);
        $(".js-prevPageURI").html(data.prevPageURI);
        if (data.prevPageURI) {
          $(".prev").show();
        } else {
          $(".prev").hide(); // Assurance si une recherche a déjà été effectué en amont
        }

        $(".next").attr("href", data.nextPageURI);
        $(".js-nextPageURI").html(data.nextPageURI);
        if (data.nextPageURI) {
          $(".next").show();
        } else {
          $(".next").hide(); // Assurance si une recherche a déjà été effectué en amont
        }

        searchPage.numberOfResults = data.total;
        searchPage.numberOfPages = searchPage.numberOfResults === 0 ? 0 : Math.ceil(searchPage.numberOfResults / searchPage.resultsPerPage);
        searchPage.currentPage = searchPage.numberOfResults === 0 ? 0 : searchPage.currentPage;
        $(".page").find(".current").text(searchPage.currentPage === 0 ? "*" : searchPage.currentPage);
        $(".page").find(".total").text(searchPage.numberOfPages === 0 ? "*" : searchPage.numberOfPages);

        $("#totalResults").val(data.total);
        $("#totalms").val(data.stats.elasticsearch.took + data.stats['istex-api'].took);

        // On wrap l'objet data avant de lui donner de nouvelles méthodes.
        data = Object.create(data);
        data.abstr = function() {
          return function(text, render) {
            if (render(text) === "") {
              return "Pas de résumé pour ce résultat.";
            }
            return render(text);
          };
        };

        data.mimetypeIconName = (function(config) {
          return function() {
            return config.mimetypeIconNames[this.mimetype] || config.mimetypeIconNames["unknown"];
          };
        }(config));

        data.spaceless = function() {
          return function(text, render) {
            return render(text).replace(/(?:>)\s*(?=<)/g, ">");
          };
        };

        data.hasFulltext = function() {
          return this.fulltext && this.fulltext.length;
        };

        data.hasMetadata = function() {
          return this.metadata && this.metadata.length;
        };

        data.hasCovers = function() {
          return this.covers && this.covers.length;
        };

        data.hasAnnexes = function() {
          return this.annexes && this.annexes.length;
        };

        data.hasEnrichments = function() {
          return this.enrichments && this.enrichments.length;
        };

        data.consolidateEnrichmentsUri = function() {
          if (!this.enrichments) {
            return;
          }

          var path = [];
          this.enrichments.forEach(function(enrichment) {
            path.push(enrichment.type);
          });
          return 'https://api.istex.fr/document/' + this.id + '/enrichments/' + path.join(',') + '?consolidate';
        };

        data.titleClic = function() {
          return function(text, render) {
            var res = render(text),
              infos = res.split(" "),
              index = infos.indexOf("application/pdf"),
              title = res.slice(res.indexOf("\"") + 1, res.length - 1);

            if (index !== -1) {
              return "<a href=\"" + infos[index + 1] + "\" target=\"_blank\">" + title + "</a>";
            }

            return title;
          };
        };

        data.quality = function() {
          return function(text, render) {
            if (render(text).split(':')[1] === " ") {
              return "";
            }
            return "<div class='text-right'><b class='label label-info'>" + render(text) + "</b>";
          };
        };

        data.presence = function() {
          return function(text, render) {
            var res = render(text);
            if (res === 'T') {
              return "Présente(s)";
            } else {
              return "Absente(s)";
            };
          };
        };

        var template, lang, wos, obj;
        var languageList = [];
        var wosList = [];

        $("#tableResult").html(mustache.render(resultRowTemplate, data));

        // Vidage des facets avant remplissage
        $('#facetCorpus').empty();
        $('#facetArticleType').empty();
        $('#facetPDFVersion').empty();
        $('#facetRefBibsNative').empty();
        $('#languages').val('');
        $('#nbLangResults').text('');
        $('#wosCategories').val('');
        $('#nbWOSResults').text('');
        $('#sortMenu:first-child').html('Tri par : Qualité <span class="caret"></span>');

        // CorpusFacet
        template = "{{#aggregations.corpusName.buckets}}<div class='col-xs-offset-1'>" +
          "<div class='checkbox'><label><input value={{key}} type='checkbox'>{{key}}</label>" +
          "<span class='badge pull-right'>{{docCount}}</span></div></div>{{/aggregations.corpusName.buckets}}";
        $('#nbCorpusFacet').text(data.aggregations.corpusName.buckets.length);
        $('#facetCorpus').append(mustache.render(template, data));
        if (data.aggregations.corpusName.buckets.length === 1) {
          $('#facetCorpus').get(0).getElementsByTagName('input').item(0).checked = true;
          $('#facetCorpus').get(0).getElementsByTagName('input').item(0).disabled = true;
        }

        // ArticleTypeFacet
        template = "{{#aggregations.genre.buckets}}<div class='col-xs-offset-1'>" +
          "<div class='checkbox'><label><input value={{key}} type='checkbox'>{{key}}</label>" +
          "<span class='badge pull-right'>{{docCount}}</span></div></div>{{/aggregations.genre.buckets}}";
        $('#nbArticleTypeFacet').text(data.aggregations.genre.buckets.length);
        $('#facetArticleType').append(mustache.render(template, data));
        if (data.aggregations.genre.buckets.length === 1) {
          $('#facetArticleType').get(0).getElementsByTagName('input').item(0).checked = true;
          $('#facetArticleType').get(0).getElementsByTagName('input').item(0).disabled = true;
        }

        // PDFVersionFacet
        template = "{{#aggregations.pdfVersion.buckets}}<div class='col-xs-offset-1 col-xs-10'>" +
          "<div class='checkbox'><label><input value={{key}} type='checkbox'>{{key}}</label>" +
          "<span class='badge pull-right'>{{docCount}}</span></div></div>{{/aggregations.pdfVersion.buckets}}";
        $('#facetPDFVersion').append(mustache.render(template, data));
        if (data.aggregations.pdfVersion.buckets.length === 1) {
          $('#facetPDFVersion').get(0).getElementsByTagName('input').item(0).checked = true;
          $('#facetPDFVersion').get(0).getElementsByTagName('input').item(0).disabled = true;
        }

        // RefBibsNativeFacet
        template = "{{#aggregations.refBibsNative.buckets}}<div class='col-xs-offset-1'>" +
          "<div class='checkbox'><label><input value={{key}} type='checkbox'>{{#presence}}{{key}}{{/presence}}</label>" +
          "<span class='badge pull-right'>{{docCount}}</span></div></div>{{/aggregations.refBibsNative.buckets}}";
        $('#facetRefBibsNative').append(mustache.render(template, data));
        if (data.aggregations.refBibsNative.buckets.length === 1) {
          $('#facetRefBibsNative').get(0).getElementsByTagName('input').item(0).checked = true;
          $('#facetRefBibsNative').get(0).getElementsByTagName('input').item(0).disabled = true;
        }

        // LanguageFacet
        for (lang of data.aggregations.language.buckets) {
          obj = {};
          obj.value = lang.key;
          obj.desc = lang.docCount + ' documents'
          obj.label = config.languageCorrespondance[lang.key];
          if (obj.label === undefined) obj.label = obj.value;
          languageList.push(obj);
        }

        $("#languages").autocomplete({
            minLength: 0,
            source: languageList,
            focus: function(event, ui) {
              $('#languages').val(ui.item.label);
            },
            select: function(event, ui) {
              $('#languages').val(ui.item.label);

              searchPage.language = [];
              searchPage.language.push(ui.item.value);
              $("#refineRoad").append('<li><a href="#">language:"' + ui.item.value + '"</a></li>');
              searchPageController.search();

              return false;
            }
          })
          .autocomplete('instance')._renderItem = function(ul, item) {
            return $('<li>')
              .append('<a>' + item.label + "<br><span style=\"font-size:10px;\">" + item.desc + '</span></a>')
              .appendTo(ul);
          };
        $('#nbLangFacet').text(data.aggregations.language.buckets.length);

        // WosFacet
        for (wos of data.aggregations.wos.buckets) {
          obj = {};
          obj.value = wos.key.replace(/"/g, '%22').replace(/&/g, '%26').replace(/ /g, '%20');
          obj.desc = wos.docCount + ' documents'
          obj.label = wos.key;
          wosList.push(obj);
        }

        $("#wosCategories").autocomplete({
            minLength: 0,
            source: wosList,
            focus: function(event, ui) {
              $("#wosCategories").val(ui.item.label);
            },
            select: function(event, ui) {
              $("#wosCategories").val(ui.item.label);

              searchPage.WOS = [];
              searchPage.WOS.push(ui.item.value);
              $("#refineRoad").append('<li><a href="#">categories.wos:"' + ui.item.value + '"</a></li>');
              searchPageController.search();

              return false;
            }
          })
          .autocomplete("instance")._renderItem = function(ul, item) {
            return $("<li>")
              .append("<a>" + item.label + "<br><span style=\"font-size:10px;\">" + item.desc + "</span></a>")
              .appendTo(ul);
          };
        $('#nbWOSFacet').text(data.aggregations.wos.buckets.length);

        // ScoreFacet
        this.displayRanges(data, "score", "#slider-range-score", "#amountScore", '', 'float');
        // CopyrightDateFacet
        this.displayRanges(data, "copyrightDate", "#slider-range-copyright", "#amountCopyrightDate", '#nbCopyrightFacet', 'date');
        // PubDateFacet
        this.displayRanges(data, "publicationDate", "#slider-range-pubdate", "#amountPubDate", '#nbPublicationFacet', 'date');
        // PdfWordCountFacet
        this.displayRanges(data, "pdfWordCount", "#slider-range-PDFWordCount", "#amountPDFWordCount", '', 'integer');
        // PdfCharCountFacet
        this.displayRanges(data, "pdfCharCount", "#slider-range-PDFCharCount", "#amountPDFCharCount", '', 'integer');

      } else {

        $("#totalResults").val(0);
        $("#tableResult").html("<tr class='row'><td class='truncate col-xs-8' colspan=\"3\" style='text-align:center'>Pas de résultat pour cette recherche.</td>");
        $(".istex-pager").hide();

        $("#currentPage").text("*");
        $("#totalPages").text("*");

        if (!searchPage.reaffine) {
          $('#accordeon').hide();
        }
      }

      $("button").button('reset');
      $("#result").css("opacity", 1);
    }
  }
});