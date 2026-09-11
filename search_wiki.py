import urllib.request, json
url = "https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=globe%20animation%20filetype:webm&utf8=&format=json"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    data = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    for item in data['query']['search'][:5]:
        print(item['title'])
except Exception as e:
    print(e)
