#!/usr/bin/python3

from subprocess import call
import json
import http.client
import urllib.parse
import time
from random import randint

from two1.commands.util import config
from two1.wallet import Wallet
from two1.bitrequests import BitTransferRequests
from two1.bitrequests import BitRequestsError
requests = BitTransferRequests(Wallet(), config.Config().username)

# Run forever
while True:
    # read the list of IPs we want to try and buy the stats service from - one IP address per line
    f = open('statServerIPs.txt', 'r')
    for line in f:

        # Get the address/url set up from the file
        address = line.rstrip('\n')
        url = "http://" + address + ":7016"
        print("Calling 21 buy for: " + url)

        try:
            # Call the 21 buy for that IP and grab the output as a dict
            retVal = requests.get(url, max_price=5).text
            print('Buy call succeeded.')
            #print(retVal)
            data = json.loads(retVal)
            data['isUp'] = True
        except Exception as err:
            data = {'isUp' : False}
            print('Buy call failed')
            print("Failure: {0}".format(err))

        # The device has an internal zero tier IP that is used for buying APIs and an externally seen IP
        data['zeroTierIp'] = address
        try:

            postUrl = "http://192.168.1.68:3000/stat"
            postHeaders = {"client" : "asdfasdf"}

            print('Calling http client for: ' + postUrl)
            #print(data)
            r = requests.post(postUrl, json=data, headers=postHeaders)
            #print(r.headers)
            print('Status code: ' + str(r.status_code))
            print('Return data: ' + r.text)

        except Exception as err:
            print('Http call failed')
            print("Http Failure: {0}".format(err))

    # Sleep between 1 hour and 24 hours
    seconds = randint(60 * 60, 60 * 60 * 24)
    print("Sleeping for this many hours: " + str(seconds / 60 / 60))
    time.sleep(seconds)
