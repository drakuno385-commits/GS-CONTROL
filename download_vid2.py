import urllib.request
url = 'https://videos.pexels.com/video-files/3129957/3129957-uhd_2560_1440_30fps.mp4'
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response, open('public/bg-left.mp4', 'wb') as out_file:
        data = response.read()
        out_file.write(data)
    print("Download success")
except Exception as e:
    print(e)
