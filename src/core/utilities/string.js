function formatString(template, args) {
  var i = 0, ii;
  args = Array.prototype.slice.call(arguments, 1);
  ii = args.length;
  return template.replace(/\%\@/g, function() {
    if (i < ii) {
      return '' + args[i++];
    }
    return '';
  });
}

function endsWith(str, search) {
  if (typeof str === 'undefined') str = '';
  str = '' + str;
  var position = str.length;
  position -= search.length;
  var lastIndex = str.indexOf(search, position);
  return lastIndex !== -1 && lastIndex === position;
}

var CAPITALIZE_STRING_REGEXP = /(^.)|(\s.)/g;
function capitalizeStringReplacer(c) {
  return c.toUpperCase();
}

function capitalizeString(str) {
  // Based on NSString#capitalizeString()
  return ('' + str).replace(CAPITALIZE_STRING_REGEXP, capitalizeStringReplacer);
}
