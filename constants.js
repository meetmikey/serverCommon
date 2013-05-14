function define(name, value) {
  Object.defineProperty(exports, name, {
    value : value,
    enumerable: true
  });
}

define('DEFAULT_QUICK_UNIQUE_ID_LENGTH', 8);

define('DEFAULT_RESPONSE_MESSAGE', 'internal error');
define('DEFAULT_RESPONSE_CODE', 500);

define('LOG_BREAK', '\n\n\n\n\n\n\n\n');

define('ACTIVE_CONNECTION_TTL', 60*2);

//Milliseconds to wait with one miss.  Will do exponential back-off if many misses.
//A 'miss' is either an error or 'no message'
define('QUEUE_WAIT_TIME_BASE', 10);

//Never wait more than 20 seconds
define('QUEUE_MAX_WAIT_TIME', 20*1000);

define('CHECK_WORKERS_INTERVAL', 20*1000);

define('DEFAULT_WORKER_TIMEOUT', 20*60*1000);

define ('CLOUD_STORAGE_DEFAULT', 'aws');

define('DEFAULT_NUM_REDIRECTS_TO_FOLLOW', 4);

define('DEFAULT_WEB_GET_TIMEOUT', 30000);

define ('QUEUE_MAX_MESSAGE_RECEIVE_COUNT', 25);

define ('SHARD_KEY_LENGTH', 5);

define ('S3_RETRIES', 3);

define ('MAX_INDEXING_ATTEMPTS', 4);

define ('ERROR_UPLOADS_DIR', '/tmp/upload_errors/');

define ('DOC_TYPE_MAPPING', {
  'pdf' : ['application/pdf'],
  'presentation' : ['ms-powerpoint', 'presentation', 'keynote'],
  'music' : ['audio/'],
  'photoshop' : ['image/photoshop', 
    'image/x-photoshop', 
    'image/psd', 
    'image/x-psd', 
    'application/photoshop', 
    'application/psd', 
    'zz-application/zz-winassoc-psd', 
    'image/vnd.adobe.photoshop'],
  'image' : ['image/'],
  'video' : ['video/'],
  'archive' : ['zip',
      'x-compressed',
      'application/x-tar',
      'gzip',
      'compressed'],
  'spreadsheet' : ['spreadsheet', 'excel'],
  'document' : ['msword', 
    'wordprocessingml', 
    'ms-word', 
    'text/richtext', 
    'opendocument.text'
  ],
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

define ('EXCLUDE_FROM_IMAGES', [
  'image/vnd.djvu',
  'image/x-emf',
  'image/x-xfig',
  'image/vnd.dwg',
  'image/x-macpict',
  'image/vnd.rn-realpix',
  'image/vnd.ms-modi',
  'image/psd',
  'image/x-icon',
  'image/ico',
  'image/vnd.dxf',
  'image/x-3ds',
  'image/x-targa',
  'image/x-dwg',
  'image/x-photoshop',
  'image/doc',
  'image/pict',
  'image/eps',
  'image/pdf',
  'image/x-xcf',
  'image/unknown',
  'image/x-pict'
]);

define ('ACCESS_TOKEN_UPDATE_TIME_BUFFER', 3*1000*60); // 3 mins

define('LINK_SUMMARY_CUTOFF', 300);

define ('ROLLOVER_THUMBNAIL_SIZE', 152);

define ('IMAGE_TAB_FIXED_WIDTH', 250);
define ('IMAGE_TAB_MAX_HEIGHT', 750);
define ('IMAGE_TAB_MIN_HEIGHT', 100);

var urlFilterText = [
    'track'
  , 'unsub'
  , 'activate'
  , 'sendgrid.me'
  , 'api.mixpanel.com'
  , 'eventbrite.com'
  , 'evite.com'
  , 'jobvite.com'
  , 'w3.org'
  , 'lieferheld.de'
  , 'doubleclick.net'
  , 'itunes.apple.com'
  , 'api_key='
  , 'plus.google.com'
  , 'tickets.'
  , 'ticketmaster'
  , 'mailchimp.com'
  , 'marketing.typesafe.com'
  , 'google.com/calendar/'
  , 'schema.org'
  , 'passport.com'
  , 'schemas.microsoft.com'
  , 'microsoft.com/sharepoint'
  , 'microsoft.com/officenet'
  , 'magicnotebook.com'
  , 'meetmikey.com'
  , 'email.launchrock.com'
  , 'trypico.com'
  , 'emailmarketing'
  , 'app.yesware.com' // tracking
  , 'paypal.com'
  , 'dmanalytics' // tracking
  , 'facebook.com' // usually requires log in so most
  , 'app.asana.com' // requires login
  , 'googleusercontent.com' // fonts
  , 'www.amazon.com'
  , 'google.ca'
  , 'groups.google.com'
  , 's3.amazonaws.com/magicnotebook'
  , 'send.angel.co'
  , 'twitter.com'
  , 'zendesk.com'
  , 'mail.'
  , 'match.com'
  , 'salesforce.com'
  , 'okcupid.com'
  , 'newrelic.com'
  , 'feedburner.com'
  , 'joingrouper.com'
  , 'toutapp.com'
  , 'alerts?'
  , 'linkedin.com'
  , 'expedia.com'
  , 'godaddy.com'
  , 'turbotax.com'
  , 'hrblock.com'
  , 'www.aa.com'
  , 'www.jetblue.com'
  , 'jobvertise.com'
  , 'delete'
  , 'delta.com'
  , 'tracking'
  , 'americanexpress.com'
  , 'chase.com'
  , 'bankofamerica.com'
  , 'wellsfargo.com'
  , 'citibank.com'
  , 'etrade.com'
  , 'tdameritrade.com'
  , 'southwest.com'
  , 'virgin.com'
  , 'schemas.openxmlformats.org'
  , 'schemas.xmlsoap.org'
  , 'myspace.com'
  , 'yousend.it'
  , 'fbstatic'
  , 'cgi-bin'
  , 'cart.rackspace.com'
  , 'tinder.com'
  , 'atlassian.net'
  , 'click'
  , '.py'
  , 'hertz.com'
  , 'esurance.com'
  , 'avis.com'
  , 'aavacations.com'
  , 'office.trapeze.com'
  , 'spiritairlines.com'
  , 'email.geico.com'
  , 'sites.google.com'
  , 'hotmail.com'
  , 'dealersocket.com'
  , 'airbnb.com'
  , 'united.com'
  , 'mailman.'
  , 'invite'
  , 'mailjet.com'
  , 'www.continental.com'
  , 'zerply.com'
  , 'mail.'
  , 'contactually.com'
  , 'app.asana.com'
  , 'sendgrid'
  , 'abuse'
  , 'thepiratebay'
  , 'links.mkt2713.com'
  , 'herokuapp.com'
  , 'supershuttle.com'
  , 'mailgun.org'
  , '.jpg'
  , '.gif'
  , '.png'
  , '.jpeg'
  , '.wmv'
  , 'indinero.com'
  , 'ideo.com'
  , 'opentable.com'
  , 'local.vipecloud.com'
  , 'craigslist.org/mf'
];

define ('ES_HARD_FAILS', [
  'image/gif parse error',
  'ZipException',
  'CryptographyException',
  'TikaException',
  'EncryptedDocumentException'
]);

define('URL_FILTER_TEXT', urlFilterText);

define('MIN_SENT_AND_CORECEIVE', 2);

define('MAX_DUPLICATE_LINKS_FOR_USER', 4);

define('BAD_SENDER_MINIMUM_RECEIEVED', 200);

define('CONTACT_RATIO_LINK_PROMOTION_THRESHOLD', 1/100);

define('MIN_DOMAIN_FAILS', 500);

define('MIN_DOMAIN_SUCCESS_RATIO', 1/20);

var linkDomainWhitelist = [
  'docs.google.com'
];

define('LINK_DOMAIN_WHITELIST', linkDomainWhitelist);
