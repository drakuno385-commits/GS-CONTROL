import urllib.request, re
url = "https://www.youtube.com/results?search_query=tech+globe+loop+background"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    ids = re.findall(r'"videoId":"([^"]{11})"', html)
    print("Found IDs:", list(set(ids))[:5])
except Exception as e:
    print(e)
