import urllib.request
url = 'https://raw.githubusercontent.com/mdn/learning-area/master/html/multimedia-and-embedding/video-and-audio-content/rabbit320.mp4'
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response, open('public/bg-left.mp4', 'wb') as out_file:
        out_file.write(response.read())
    print("Download success")
except Exception as e:
    print(e)
