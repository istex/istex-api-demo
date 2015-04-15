var _paq = _paq || [];
_paq.push([function() {
  var self = this;

  function getOriginalVisitorCookieTimeout() {
    var now = new Date(),
      nowTs = Math.round(now.getTime() / 1000),
      visitorInfo = self.getVisitorInfo();
    var createTs = parseInt(visitorInfo[2]);
    var cookieTimeout = 33696000;
    var originalTimeout = createTs + cookieTimeout - nowTs;
    return originalTimeout;
  }
  getOriginalVisitorCookieTimeout();
  this.setVisitorCookieTimeout(getOriginalVisitorCookieTimeout());
}]);
_paq.push(['trackPageView']);
_paq.push(['enableLinkTracking']);
(function() {
  var u = (("https:" == document.location.protocol) ? "https" : "http") + "://piwik.inist.fr//";
  _paq.push(['setTrackerUrl', u + 'piwik.php']);
  _paq.push(['setSiteId', 118]);
  var d = document,
    g = d.createElement('script'),
    s = d.getElementsByTagName('script')[0];
  g.type = 'text/javascript';
  g.defer = true;
  g.async = false;
  g.src = u + 'piwik.js';
  s.parentNode.insertBefore(g, s);
  require(['piwik']);
})();