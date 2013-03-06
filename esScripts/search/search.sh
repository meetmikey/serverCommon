curl -XPOST localhost:9200/mail/resource/_search?pretty -d '{
  "fields": ["file","title", "content-type"],
  "query" : {
    bool : {
      must : [
      ],
      should : [
        {
          queryString: {
            "fields": ["file", "title"],
            "query": "sagar mehta"
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
