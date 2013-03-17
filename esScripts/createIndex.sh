curl -XPUT 'http://localhost:9200/mail_v1/' -d '
{
    "number_of_shards": 10,
    "number_of_replicas": 1,
    "analysis": {
      "analyzer" : {
        "email" : {
          "type": "pattern",
          "pattern":"[\\.@]",
          "stopwords" : ["com", "hotmail", "gmail", "outlook", "net", "org", "edu", "msn", "yahoo", "gov", "aol", "comcast", "spcglobal"]
        },
        "url" : {
          "type": "pattern",
          "pattern":"[\\./\\-_?&\\=\\s+]",
          "stopwords" : ["com", "org", "edu", "gov", "net", "http", "https", "http:", "https:", "www", "www.", "uk", "ca", "de"]
        },
        "default_analyzer" : {
          "type" : "snowball", 
          "language" : "English"
        },
        "html_analyzer" : {
          "type" : "custom",                
          "tokenizer" : "standard",
          "filter" : ["standard"],
          "char_filter": "html_strip"
        }
      }
    }
  }
}'
