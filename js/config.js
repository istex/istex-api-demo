define(["js/parameters.js"], function (parameters) {
  return {
    apiUrl: parameters[parameters.default_api_url],
    mimetypeIconNames: {
      "application/zip": "zip",
      "application/pdf": "pdf",
      "image/tiff": "tiff",
      "application/xml": "xml",
      "application/mods+xml": "mods",
      "application/tei+xml": "tei",
      "text/plain": "txt",
      "image/jpeg": "jpg",
      "image/gif": "gif",
      "application/vnd.ms-powerpoint": "ppt",
      "application/msword": "doc",
      "video/quicktime": "qt",
      "application/rtf": "rtf",
      "application/vnd.ms-excel": "xls",
      "unknown": "_blank"
    }
  };
});
