curl -XPOST 'http://localhost:9200/_aliases' -d '
{
    "actions" : [
        { "add" : { "index" : "mail_v1", "alias" : "mail" } }
    ]
}'