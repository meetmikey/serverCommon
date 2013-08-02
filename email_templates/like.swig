
<h1>
{{senderName}} liked the {{type}}
  {% if isLink %}
    <a href="{{ url }}"> {{title}} </a> </h1>
  {% else %}
    {{ filename}}
  {% endif %}
</h1>


{% if isLink %}
{{ summary }}
{% else %}

{% endif %}