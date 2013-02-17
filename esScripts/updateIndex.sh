curl -XPUT 'http://localhost:9200/mail/_settings' -d '
{
    "number_of_replicas": 1,
    "analysis": {
      "analyzer" : {

        "email" : {
          "type": "pattern",
          "pattern":"[\\.@]"
        },
        "url" : {
          "type": "pattern",
          "pattern":"[\\./\\-_?&\\=\\s+]"
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
