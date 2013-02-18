curl -XPOST localhost:9200/mail/resource/_search?pretty -d '{
  "fields": ["file"],
  "query": {
    "top_children" : {
      "type": "email",
        "query": {
          bool: {
            must: [
              {
                queryString: {
                "query": "good luck"
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
}'
