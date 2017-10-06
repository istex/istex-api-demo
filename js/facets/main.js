define(["./facets", "./tooltips"],
  function(facets, tooltips) {
    return {
      initialize: function() {
        facets.generate();
        tooltips.generate();
      }
    };
  }
);