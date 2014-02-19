var url = "http://api.istex.fr/?";

require(["js/conf","js/vendor/mustache"], function(conf, mustache) {

    function displayResults(data) {
        var tableLine = "{{#hits}}<tr><td>{{title}}<td><td></td><td></td></tr>{{/hits}}"
        $("#tableResult").html(mustache.render(tableLine, data));
    }

    $("#searchform").submit(function (event) {
        event.preventDefault();

        var keywords = $("#searchfield").val();
        var query = "?q=" + keywords;
        var request = {
            url: conf.apiUrl + query,
            jsonp: true,
            crossDomain: true,
            success: displayResults
        };

        $.ajax(request);
    });
});
