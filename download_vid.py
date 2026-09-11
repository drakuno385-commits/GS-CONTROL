import urllib.request
url = 'https://assets.mixkit.co/videos/preview/mixkit-global-network-connection-animation-31802-large.mp4'
try:
    urllib.request.urlretrieve(url, 'public/bg-left.mp4')
    print("Download success")
except Exception as e:
    print(e)
