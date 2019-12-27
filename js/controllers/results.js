define(["config", "vendor/handlebars", "text!views/resultRow.html"], function(config, handlebars, resultRowTemplate) {
  return {
    displayRanges: function(data, field, slider, amount, type) {

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

      $(slider).slider({
        range: true,
        min: minDate,
        max: maxDate,
        values: [minDate, maxDate]
      });
      $(amount).val($(slider).slider("values", 0) +
        " à " + $(slider).slider("values", 1));
    },
    displayResults: function(searchPage, data, url) {

      // Mise à jour du "Réponse brute complète"
      $("#jsonViewButton").off('click');
      $("#jsonViewButton").on('click', function(event) {
        var win = window.open(url + '&sid=istex-api-demo', '_blank');
        if (win) {
          win.focus();
        } else {
          alert('La fenêtre pour afficher la réponse complète a été bloquée par votre navigateur. Merci d\'autoriser les popups pour ce site.');
        }
      });

      if (data.total > 0) {
        $("#accordeon").show();

        // Pager
        generatePageURI(data);

        searchPage.numberOfResults = data.total;
        searchPage.numberOfPages = searchPage.numberOfResults === 0 ? 0 : Math.ceil(searchPage.numberOfResults / searchPage.resultsPerPage);
        searchPage.currentPage = searchPage.numberOfResults === 0 ? 0 : searchPage.currentPage;
        $(".page").find(".current").text(searchPage.currentPage === 0 ? "*" : searchPage.currentPage);
        $(".page").find(".total").text(searchPage.numberOfPages === 0 ? "*" : searchPage.numberOfPages);

        $("#totalResults").val(data.total);
        setTotalTime(data.stats.elasticsearch.took, data.stats["istex-api"].took);

        // Ajoute les fonctions nécessaires à data
        addHandlebarsFunctions(handlebars, config);

        var lang, wos, scopus, sciMetrix, pubType, artType, obj;
        var pubTypeList = [];
        var languageList = [];
        var wosList = [];
        var sciMetrixList = [];
        var scopusList = [];
        var inistList = [];

        var template = handlebars.compile(resultRowTemplate);
        $("#tableResult").html(template(data));

        $('#nbResFacet').text('');

        switch (searchPage.facet) {
          case ('host.genre[*]>genre[*]'):
            $('#publicationTypes').val('');
            $('#articleTypes').val('');
            genresByPubTypes = {};
            $('#facetArticleType').addClass('hide');
            for (pubType of data.aggregations['host.genre'].buckets) {
              obj = {};
              obj.value = pubType.key;
              obj.desc = pubType.docCount + ' documents';
              obj.label = pubType.key;
              pubTypeList.push(obj);

              genresByPubTypes[pubType.key] = [];
              if (pubType.genre) {
                for (artType of pubType['genre'].buckets) {
                  obj = {};
                  obj.value = artType.key;
                  obj.desc = artType.docCount + ' documents';
                  obj.label = artType.key;
                  genresByPubTypes[pubType.key].push(obj);
                }
              }
            }
            generateAutocompleteFacet($("#publicationTypes"), pubTypeList, 'host.genre', data);
            break;
          case ('publicationDate'):
            this.displayRanges(data, "publicationDate", "#slider-range-pubdate", "#amountPubDate", 'date');
            break;
          case ('enrichments.type[*]'):
            $('#typeEnrichBody').empty();
            data.aggregations.enrichType = data.aggregations['enrichments.type']; // Pour handlebars
            generateTermsFacet('enrichType', '{{key}}', $('#typeEnrichBody'), $('#nbResFacet'), data, handlebars);
            break;
          case ('language[*]'):
            $('#languages').val('');
            for (lang of data.aggregations.language.buckets) {
              obj = {};
              obj.value = lang.key;
              obj.desc = lang.docCount + ' documents';
              obj.label = config.languageCorrespondance[lang.key];
              if (obj.label === undefined) obj.label = obj.value;
              languageList.push(obj);
            }
            generateAutocompleteFacet($("#languages"), languageList, 'language', data);
            break;
          case ('categories.wos[*]'):
            $('#wosCategories').val('');
            for (wos of data.aggregations['categories.wos'].buckets) {
              obj = {};
              obj.desc = wos.docCount + ' documents';
              obj.label = wos.key;
              wosList.push(obj);
            }
            generateAutocompleteFacet($("#wosCategories"), wosList, 'categories.wos', data);
            break;
            case ('categories.scienceMetrix[*]'):
              $('#sciMetrixCategories').val('');
              for (sciMetrix of data.aggregations['categories.scienceMetrix'].buckets) {
                obj = {};
                obj.desc = sciMetrix.docCount + ' documents';
                obj.label = sciMetrix.key;
                sciMetrixList.push(obj);
              }
              generateAutocompleteFacet($("#sciMetrixCategories"), sciMetrixList, 'categories.scienceMetrix', data);
              break;
            case ('categories.scopus[*]'):
              $('#scopusCategories').val('');
              for (scopus of data.aggregations['categories.scopus'].buckets) {
                obj = {};
                obj.desc = scopus.docCount + ' documents';
                obj.label = scopus.key;
                scopusList.push(obj);
              }
              generateAutocompleteFacet($("#scopusCategories"), scopusList, 'categories.scopus', data);
              break;
            case ('categories.inist[*]'):
            $('#inistCategories').val('');
            for (inist of data.aggregations['categories.inist'].buckets) {
              obj = {};
              obj.desc = inist.docCount + ' documents';
              obj.label = inist.key;
              inistList.push(obj);
            }
            generateAutocompleteFacet($("#inistCategories"), inistList, 'categories.inist', data);
            break;
          case ('qualityIndicators.pdfWordCount,qualityIndicators.pdfCharCount,qualityIndicators.score,qualityIndicators.pdfVersion[*],qualityIndicators.refBibsNative'):
            $('#facetPDFVersion').empty();
            $('#facetRefBibsNative').empty();
            data.aggregations.pdfVersion = data.aggregations['qualityIndicators.pdfVersion']; // Pour handlebars
            data.aggregations.pdfWordCount = data.aggregations['qualityIndicators.pdfWordCount']; // Pour handlebars
            data.aggregations.pdfCharCount = data.aggregations['qualityIndicators.pdfCharCount']; // Pour handlebars
            data.aggregations.score = data.aggregations['qualityIndicators.score']; // Pour handlebars
            data.aggregations.refBibsNative = data.aggregations['qualityIndicators.refBibsNative']; // Pour handlebars

            generateTermsFacet('pdfVersion', '{{key}}', $('#facetPDFVersion'), null, data, handlebars);
            generateTermsFacet('refBibsNative', '{{presence key}}', $('#facetRefBibsNative'), null, data, handlebars);
            this.displayRanges(data, "score", "#slider-range-score", "#amountScore", 'float');
            this.displayRanges(data, "pdfWordCount", "#slider-range-PDFWordCount", "#amountPDFWordCount", 'integer');
            this.displayRanges(data, "pdfCharCount", "#slider-range-PDFCharCount", "#amountPDFCharCount", 'integer');
            break;
          case ('corpusName[*]'):
          default:
            $('#corpusBody').empty();
            generateTermsFacet('corpusName', '{{key}}', $('#corpusBody'), $('#nbResFacet'), data, handlebars);
            break;
        }

      } else {

        $("#totalResults").val(0);
        setTotalTime(data.stats.elasticsearch.took, data.stats["istex-api"].took);
        $("#tableResult").html("<tr class='row'><td class='truncate col-xs-8' colspan=\"3\" style='text-align:center'>Pas de résultat pour cette recherche.</td>");
        $(".istex-pager").hide();

        $("#currentPage").text("*");
        $("#totalPages").text("*");

        if (!searchPage.reaffine) $('#accordeon').hide();
      }

      $("button").button('reset');
      $("#result").css("opacity", 1);
    }
  };
});

function generatePageURI(data) {
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
  prevNextPageURI($(".prev"), data.prevPageURI, $(".js-prevPageURI"));
  prevNextPageURI($(".next"), data.nextPageURI, $(".js-nextPageURI"));
}

function prevNextPageURI(tag, dataURI, jsTag) {
  tag.attr("href", dataURI);
  jsTag.html(dataURI);
  if (dataURI) {
    tag.show();
  } else {
    tag.hide(); // Assurance si une recherche a déjà été effectué en amont
  }
}

function addHandlebarsFunctions(handlebars, config) {

  handlebars.registerHelper('notEmpty', function(toVerify, options) {
    if (toVerify && Object.keys(toVerify).length !== 0) {
      return options.fn(this);
    }
  });

  handlebars.registerHelper('abstr', function(abstract) {
    if (!abstract) {
      return "Pas de résumé pour ce résultat.";
    }
    return abstract;
  });

  handlebars.registerHelper('mimetypeIconName', function(mimetype) {
    return config.mimetypeIconNames[mimetype] || config.mimetypeIconNames["unknown"];
  });

  handlebars.registerHelper('enrichmentsList', function(enrichments) {

    var template = "<a class=\"inline-push-down-1 inline-push-right-1 inline-block enrichment\" href='{{uri}}' target='_blank'>" +
      "<i class=\"enrichment-type\">{{this}}</i>" +
      "<img src='img/mimetypes/tei.png' title=\"application/tei+xml\">" +
      "</a>";
    var finalTemplate = "";
    var types = Object.keys(enrichments);
    for (let type of types) {
      if (enrichments[type].length > 0) {
        finalTemplate += template;
        finalTemplate = finalTemplate.replace('{{this}}', type).replace('{{uri}}', enrichments[type][0].uri + '?sid=istex-api-demo');
      }
    }
    return new handlebars.SafeString(finalTemplate);
  });

  handlebars.registerHelper('errata', function(options) {
    let doiUrl = config.apiUrl + 'document/?q=';
    let first = true;
    for (let erratumDoi of this.erratumOf) {
      if (first)
        first = false;
      else
        doiUrl += ' OR ';
      doiUrl += 'doi:"' + erratumDoi + '"';
    }

    var jsonResponse = $.ajax({
      url: doiUrl + "&output=*",
      crossDomain: true,
      async: false
    }).responseText;

    var res;
    try {
      res = JSON.parse(jsonResponse).hits;
      for (hit of res) {
        hit.apiUrl = config.apiUrl;
      }
    } catch (err) {
      res = undefined;
    }
    return options.fn(res[0]);
  });

  handlebars.registerHelper('consolidateEnrichmentsUri', function() {
    var path = [];
    Object.keys(this.enrichments).forEach(function(type) {
      path.push(type);
    });
    return config.apiUrl + 'document/' + this.id + '/enrichments/' + path.join(',') + '?consolidate&sid=istex-api-demo';
  });

  handlebars.registerHelper('flags', function(language) {
    var flags = '';
    for (lang of language) {
      if (config.flags.indexOf(lang) !== -1) flags += '<img class="flag" src=\'img/flags/' + lang + '.png\' title="' + lang + '">';
    }
    return new handlebars.SafeString(flags);
  });

  handlebars.registerHelper('titleClic', function(fulltext, title) {
    for (let ft of fulltext) {
      if (ft.mimetype == "application/pdf") {
        return new handlebars.SafeString("<a href=\"" + ft.uri + "?sid=istex-api-demo\" target=\"_blank\">" + title + "</a>");
      }
    }
    return title;
  });
  handlebars.registerHelper('fixQuality', function(rate) {
    return rate.toFixed(2);
  })

  handlebars.registerHelper('quality', function(text, qi) {
    return (qi === " ") ? "" : new handlebars.SafeString("<div class='text-right'><b class='label label-info'>" + text + qi + "</b>");
  });

  handlebars.registerHelper('arkLink', function(ark) {
    return (ark === " ") ? "" : new handlebars.SafeString("<a style='color:white;' href='" + config.apiUrl + ark + "'>" + ark + "</a>");
  });

  handlebars.registerHelper('presence', function(refbib) {
    if (refbib === 1) {
      return "Fournies par l'éditeur";
    } else {
      return "Recherchées via GROBID";
    }
  });
}

function generateTermsFacet(facetName, keys, tag, nbTag, data, handlebars) {

  var template = handlebars.compile("{{#aggregations." + facetName + ".buckets}}<div class='col-xs-offset-1'>" +
    "<div class='checkbox'><label><input value=\'{{key}}\' type='checkbox'>" + keys + "</label>" +
    "<span class='badge pull-right'>{{docCount}}</span></div></div>{{/aggregations." + facetName + ".buckets}}");

  if (nbTag) nbTag.text(data.aggregations[facetName].buckets.length);
  tag.append(template(data));
  if (data.aggregations[facetName].buckets.length === 1) {
    tag.get(0).getElementsByTagName('input').item(0).checked = true;
    tag.get(0).getElementsByTagName('input').item(0).disabled = true;
  }
}

function generateAutocompleteFacet(tag, list, facetName, data) {
  tag.autocomplete("option", "source", list)
    .autocomplete('instance')._renderItem = function(ul, item) {
      return $('<li>')
        .append('<a>' + item.label + "<br><span style=\"font-size:10px;\">" + item.desc + '</span></a>')
        .appendTo(ul);
    };
  $("#nbResFacet").text(data.aggregations[facetName].buckets.length);
}

function setTotalTime(elasticTime, apiTime) {
  var totalTime = elasticTime + apiTime;
  if (totalTime > 999) {
    $("#totalms").val(Math.round(totalTime / 10) / 100);
    $("#msOrS").text("s)");
  } else {
    $("#totalms").val(totalTime);
    $("#msOrS").text("ms)");
  }
}
