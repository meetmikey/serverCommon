curl -XPOST localhost:9200/mail/resource/_search?pretty -d '{
  "fields": ["file","title"],
  "query" : {
    bool : {
      must : [
        {
          "has_child" : {
            "type" : "resourceMeta",
            "query" : {
              "term" : {
                "userId" : "51105236d50c88ebe8ef30cc"
              }
            }
          }
        }
      ],
      should : [
        {
          queryString: {
            "fields": ["file", "title"],
            "query": "spreadsheet"
          }
        },  
        {
          queryString: {
            "fields": ["file", "title"],
            "query": "hello",
            "phrase_slop": 250,
            "auto_generate_phrase_queries": true,
            "boost": 2.0
          }
        },
        {
          queryString: {
            "fields": ["file", "title"],
            "query": "\"hello world\"",
            "phrase_slop": 150,
            "auto_generate_phrase_queries": false,
            "boost": 3.0
          }
        },
        {
          "top_children" : {
            "type": "resourceMeta",
            "query": {
              bool: {
                should: [
                  {
                    queryString: {
                      "query": "sagar mehta"
                    }
                  }
                ]
              }
            },
            "score" : "max",
            "factor" : 5,
            "incremental_factor" : 2
          }
        }
      ]
    }
  }
}'