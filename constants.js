
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