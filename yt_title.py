import urllib.request, re
url = "https://www.youtube.com/watch?v=H41fuhz_gvw"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    m = re.search(r'<title>(.*?)</title>', html)
    if m: print(m.group(1))
except Exception as e:
    print(e)
