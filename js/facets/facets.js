define(["../vendor/handlebars", "text!./views/inputTemplate.html"],
  function(handlebars, inputTemplate) {

    return {

      generate: function() {

        var inputCompile = handlebars.compile(inputTemplate);

        $("#catIniBody").html(inputCompile({
          idDiv: 'facetInist',
          textInput: 'Entrez la catégorie Inist désirée :',
          exempleInput: '(ex : sciences appliquees, technologies et medecines...)',
          idInput: 'inistCategories'
        }));

        $("#catSciBody").html(inputCompile({
          idDiv: 'facetSciMetrix',
          textInput: 'Entrez la catégorie Science-Metrix désirée :',
          exempleInput: '(ex : economic & social sciences...)',
          idInput: 'sciMetrixCategories'
        }));

        $("#catWosBody").html(inputCompile({
          idDiv: 'facetWos',
          textInput: 'Entrez la catégorie WOS désirée :',
          exempleInput: '(ex : medecine, general & internal...)',
          idInput: 'wosCategories'
        }));

        $("#langBody").html(inputCompile({
          idDiv: 'facetLang',
          textInput: 'Entrez la langue désirée :',
          exempleInput: '(ex : anglais, français...)',
          idInput: 'languages'
        }));

      }

    };

  }
);