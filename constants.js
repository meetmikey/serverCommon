
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