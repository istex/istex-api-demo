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

      $("#jsonViewButton").attr('data-whatever', JSON.stringify(data));

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
        data = generateDataFunctions(data, config);

        // Changement de host.genre en hostGenre pour mustache
        data.aggregations.hostGenre = data.aggregations['host.genre'];

        var lang, wos, pubType, artType, obj;
        var pubTypeList = [];
        var languageList = [];
        var wosList = [];

        $("#tableResult").html(mustache.render(resultRowTemplate, data));

        // Vidage des facets avant remplissage
        $('#facetCorpus').empty();
        $('#facetPDFVersion').empty();
        $('#facetRefBibsNative').empty();

        $('#publicationTypes').val('');
        $('#nbPubTypeFacet').text('');
        $('#articleTypes').val('');
        $('#nbArtTypeFacet').text('');
        $('#languages').val('');
        $('#nbLangResults').text('');
        $('#wosCategories').val('');
        $('#nbWOSResults').text('');

        genresByPubTypes = {};
        $('#facetArticleType').addClass('hide');

        // Génération des facettes de type "terms"
        generateTermsFacet('corpusName', '{{key}}', $('#facetCorpus'), $('#nbCorpusFacet'), data, mustache);
        generateTermsFacet('pdfVersion', '{{key}}', $('#facetPDFVersion'), null, data, mustache);
        generateTermsFacet('refBibsNative', '{{#presence}}{{key}}{{/presence}}', $('#facetRefBibsNative'), null, data, mustache);

        // PubTypeFacet et ArtTypeFacet
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
        generateAutocompleteFacet($("#publicationTypes"), pubTypeList, $('#nbPubTypeFacet'), 'host.genre', data);

        // LanguageFacet
        for (lang of data.aggregations.language.buckets) {
          obj = {};
          obj.value = lang.key;
          obj.desc = lang.docCount + ' documents';
          obj.label = config.languageCorrespondance[lang.key];
          if (obj.label === undefined) obj.label = obj.value;
          languageList.push(obj);
        }
        generateAutocompleteFacet($("#languages"), languageList, $('#nbLangFacet'), 'language', data);

        // WosFacet
        for (wos of data.aggregations.wos.buckets) {
          obj = {};
          obj.value = wos.key.replace(/"/g, '%22').replace(/&/g, '%26').replace(/ /g, '%20');
          obj.desc = wos.docCount + ' documents';
          obj.label = wos.key;
          wosList.push(obj);
        }
        generateAutocompleteFacet($("#wosCategories"), wosList, $('#nbWOSFacet'), 'wos', data);

        // Appel des displayRanges
        this.displayRanges(data, "score", "#slider-range-score", "#amountScore", '', 'float');
        this.displayRanges(data, "publicationDate", "#slider-range-pubdate", "#amountPubDate", '#nbPublicationFacet', 'date');
        this.displayRanges(data, "pdfWordCount", "#slider-range-PDFWordCount", "#amountPDFWordCount", '', 'integer');
        this.displayRanges(data, "pdfCharCount", "#slider-range-PDFCharCount", "#amountPDFCharCount", '', 'integer');

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

function generateDataFunctions(data, config) {
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
  
  data.hasErratumOf = function() {
    return this.erratumOf && this.erratumOf.length;
  };
  
  data.errata = function() {
    let doiUrl = 'https://api.istex.fr/document/?q=';
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
      async: false}).responseText;
      
    return JSON.parse(jsonResponse).hits;
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
        return "Fournies par l'éditeur";
      } else {
        return "Recherchées via GROBID";
      };
    };
  };
  return data;
}

function generateTermsFacet(facetName, keys, tag, nbTag, data, mustache) {
  var template = "{{#aggregations." + facetName + ".buckets}}<div class='col-xs-offset-1'>" +
    "<div class='checkbox'><label><input value=\'{{key}}\' type='checkbox'>" + keys + "</label>" +
    "<span class='badge pull-right'>{{docCount}}</span></div></div>{{/aggregations." + facetName + ".buckets}}";

  if (nbTag) nbTag.text(data.aggregations[facetName].buckets.length);
  tag.append(mustache.render(template, data));
  if (data.aggregations[facetName].buckets.length === 1) {
    tag.get(0).getElementsByTagName('input').item(0).checked = true;
    tag.get(0).getElementsByTagName('input').item(0).disabled = true;
  }
}

function generateAutocompleteFacet(tag, list, nbTag, facetName, data) {
  tag.autocomplete("option", "source", list)
    .autocomplete('instance')._renderItem = function(ul, item) {
      return $('<li>')
        .append('<a>' + item.label + "<br><span style=\"font-size:10px;\">" + item.desc + '</span></a>')
        .appendTo(ul);
    };
  nbTag.text(data.aggregations[facetName].buckets.length);
}

function setTotalTime(elasticTime, apiTime) {
  var totalTime = elasticTime + apiTime;
  if (totalTime > 999) {
    $("#totalms").val(Math.round(totalTime / 10) / 100);
    $("#msOrS").text("s)")
  } else {
    $("#totalms").val(totalTime);
    $("#msOrS").text("ms)")
  }
};
