/**
 * Polyfill Object.create pour <ie9
 */
if (typeof Object.create != 'function') {

  Object.create = (function () {

    function Temp () {
    }
    var hasOwn = Object.prototype.hasOwnProperty;

    return function (O) {

      if (typeof O != 'object') {
        throw TypeError('Object prototype may only be an Object or null');
      }
      Temp.prototype = O;
      var obj = new Temp();
      Temp.prototype = null;

      if (arguments.length > 1) {
        var Properties = Object(arguments[1]);
        for(var prop in Properties) {
          if (hasOwn.call(Properties, prop)) {
            obj[prop] = Properties[prop];
          }
        }
      }

      return obj;
    };
  })();
}

/**
 * String.rtrim
 * @param {String} char
 * @returns {String}
 */
if (!String.prototype.rtrim) {
  (function () {
    String.prototype.rtrim = function (char) {
      var trim = '[' + char + ']+$';
      return this.replace(new RegExp(trim, 'g'), '');
    };
  })();
}

/**
 * nettoie Storage si la donnée la plus ancienne à plus d'un jour.
 * @returns null
 */
Storage.prototype.refreshIfNeeded = function () {
  var
    DAY = 86400000,
    LAST_REFRESH = 'last-refresh',
    lastRefresh = this.getItem(LAST_REFRESH),
    refreshTime = DAY
    ;
    
  if (!lastRefresh || +lastRefresh + refreshTime < Date.now()) {
    this.clear();
    this.setItem(LAST_REFRESH, Date.now());
  }
};



var fill = function () {
  var i = 1;
  while (i < 7500) {
    try {
      localStorage.setItem(i, "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec mollis neque felis, in efficitur tortor vestibulum id. Sed vitae lectus volutpat, vehicula quam id, condimentum lorem. Maecenas nec mauris eu risus posuere ultricies. Integer in ultrices sem. In tincidunt bibendum maximus. Proin consectetur elit orci, maximus suscipit mi finibus eu. Morbi aliquet urna eu diam mollis elementum. Maecenas tempor ultricies elit ac lacinia. Suspendisse pharetra eros suscipit vehicula pretium. Ut id iaculis nisi. In cursus felis ac dui malesuada malesuada. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce interdum, ante sit amet rhoncus commodo, turpis felis elementum ante, et viverra erat augue at urna. Vestibulum in tincidunt erat, vitae porta odio. Mauris commodo id diam vel vehicula.");
    }
    catch(e) {
      throw e;
    }
    console.log(i);
    ++i;
  }
};
