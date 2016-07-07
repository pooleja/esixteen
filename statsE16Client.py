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

    # Get the address/url set up from the file
    address = line.rstrip('\n')
    url = "http://" + address + ":7016"
    print("Calling 21 buy for: " + url)

    try:
        # Call the 21 buy for that IP and grab the output as a dict
        data = json.loads(requests.get(url, max_price=5).text)
        data = {'isUp' : True}
        print('Buy call succeeded.')
    except(Exception):
        data = {'isUp' : False}
        print('Buy call failed')

    # The device has an internal zero tier IP that is used for buying APIs and an externally seen IP
    data['zeroTierIp'] = address
try:
    host = "esixteen.co:3000"
    print('Calling http client for: ' )
    conn = http.client.HTTPConnection(host)
    headers = {"client" : "asdfasdf", "Content-type": "application/json", "Accept": "text/plain"}
    conn.request("POST", "/stat", json.dumps(data), headers)
    response = conn.getresponse()
    print(response.status, response.reason)
    retData = response.read()
    print(retData)
except(Exception):
    print('Http call failed')
