import urllib.request, re
for vid in ['DPglZz8ZqZo', 'ZLs8eL3qjwo', 'l_PDi_tocto', 'JBpGAtriyfs']:
    url = f"https://www.youtube.com/watch?v={vid}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
        m = re.search(r'<title>(.*?)</title>', html)
        if m: print(vid, m.group(1))
    except Exception as e:
        print(vid, e)
