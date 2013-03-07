
function define(name, value) {
  Object.defineProperty(exports, name, {
    value : value,
    enumerable: true
  });
}

define('DEFAULT_RESPONSE_MESSAGE', 'internal error')
define('DEFAULT_RESPONSE_CODE', 500)

// in seconds
define('ACTIVE_CONNECTION_TTL', 60*5) // 5 minutes

define ('MAIL_READER_CHECK_INTERVAL', 1000*5);

define ('MAIL_READER_QUICK_CHECK_INTERVAL', 1000*5);

define ('MAIL_DOWNLOAD_CHECK_INTERVAL', 1000*5);

define ('MAIL_UPDATE_CHECK_INTERVAL', 1000*5);

define ('ACTIVE_CONNECTIONS_CHECK_INTERVAL', 1000*3);


define ('CLOUD_STORAGE_DEFAULT', 'azure')


define ('DOC_TYPE_MAPPING', {
  'pdf' : ['application/pdf'],
  'presentation' : ['ms-powerpoint', 'presentation', 'keynote'],
  'music' : ['audio/'],
  'image' : ['image/'],
  'video' : ['video/'],
  'archive' : ['zip',
      'x-compressed',
      'application/x-tar',
      'gzip',
      'compressed'],
  'spreadsheet' : ['spreadsheet', 'excel'],
  'document' : ['msword', 'ms-word', 'text/plain', 'text/richtext', 'opendocument.text'],
  'code' : ['html', 
      'python', 
      'java', 
      'fortran', 
      '/x-c', 
      'css', 
      'xml', 
      'json', 
      'mathematica', 
      'matlab',  
      '/x-src', 
      'x-latex']
})