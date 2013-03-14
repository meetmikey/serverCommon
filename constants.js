
function define(name, value) {
  Object.defineProperty(exports, name, {
    value : value,
    enumerable: true
  });
}

define('DEFAULT_RESPONSE_MESSAGE', 'internal error')
define('DEFAULT_RESPONSE_CODE', 500)

define('LOG_BREAK', '\n\n\n\n\n\n\n\n');

define('ACTIVE_CONNECTION_TTL', 60*2)

define ('MAIL_READER_CHECK_INTERVAL', 1000*3);

define ('MAIL_READER_QUICK_CHECK_INTERVAL', 1000*3);

define ('MAIL_DOWNLOAD_CHECK_INTERVAL', 1000*5);

define ('MAIL_UPDATE_CHECK_INTERVAL', 1000*5);

define ('ACTIVE_CONNECTIONS_CHECK_INTERVAL', 1000*1); // the interval at which we re-check < threshold if mikeymail mode=listen is saturated

define ('CLOUD_STORAGE_DEFAULT', 'aws');

define ('SHARD_KEY_LENGTH', 5);

define ('S3_RETRIES', 3);

define ('ERROR_UPLOADS_DIR', '/tmp/upload_errors/');

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
});

define ('ACCESS_TOKEN_UPDATE_TIME_BUFFER', 3*1000*60); // 3 mins