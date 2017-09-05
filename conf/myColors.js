/* global exports, module */

"use strict";

var colors = require("colors");

// Colors theme à la Bootstrap
colors.setTheme({
  danger: 'red',
  warning: 'yellow',
  info: 'cyan',
  primary: 'blue',
  success: 'green',
  muted: 'grey'
});

module.exports = colors;