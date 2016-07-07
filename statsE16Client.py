#!/usr/bin/python3

from subprocess import call
import json
import http.client
import urllib.parse

from two1.commands.util import config
from two1.wallet import Wallet
from two1.bitrequests import BitTransferRequests
from two1.bitrequests import BitRequestsError
requests = BitTransferRequests(Wallet(), config.Config().username)


# read the list of IPs we want to try and buy the stats service from - one IP address per line
f = open('statServerIPs.txt', 'r')
for line in f:
    # Call the 21 buy for that IP and output to tmp_stats.json
    address = line.rstrip('\n')
    url = "http://" + address + ":7016"
    print("Calling 21 buy for: " + url)

    try:
        data = json.loads(requests.get(url, max_price=5).text)
        break
    except(OSError, BitRequestsError):
        data = {'isUp' : False}


    data['zeroTierIp'] = address
    conn = http.client.HTTPConnection("192.168.1.68:3000")
    headers = {"client" : "asdfasdf"}
    conn.request("POST", "/stat", json.dumps(data), headers)
    response = conn.getresponse()
    print(response.status, response.reason)
    retData = response.read()
    print(retData)
    call(["rm", "tmp_stats.json"])
