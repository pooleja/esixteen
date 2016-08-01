#!/usr/bin/python3
import logging
import yaml
import json

from two1.commands.util import config
from two1.wallet import Wallet
from two1.bitrequests import BitTransferRequests
requests = BitTransferRequests(Wallet(), config.Config().username)

logger = logging.getLogger(__name__)


def runStats(host, port, website, secret):
    """
    Runs the stats check against the host and posts results up to the server.
    """
    # Get the address/url set up
    url = "http://" + host + ":" + port
    print("Calling 21 buy for: " + url)

    try:
        # Call the 21 buy for that IP and grab the output as a dict
        retVal = requests.get(url, max_price=5).text
        print('Buy call succeeded.')
        # print(retVal)
        data = json.loads(retVal)
        data['isUp'] = True
    except Exception as err:
        data = {'isUp': False}
        print('Buy call failed')
        print("Failure: {0}".format(err))

    # The device has an internal zero tier IP that is used for buying APIs and an externally seen IP
    data['zeroTierIp'] = host
    try:

        postUrl = website + "/stat"
        postHeaders = {"client": secret}

        print('Calling http client for: ' + postUrl)
        # print(data)
        r = requests.post(postUrl, json=data, headers=postHeaders)
        # print(r.headers)
        print('Status code: ' + str(r.status_code))
        print('Return data: ' + r.text)

    except Exception as err:
        print('Http call failed')
        print("Http Failure: {0}".format(err))


def verifyServiceRunning(host, port, serviceName):
    """
    Verifies that the server is running the service on the specified port by querying the manifest.
    """
    try:
        serverUrl = "http://" + host + ":" + port + "/manifest"
        serverData = requests.get(serverUrl).text
        parsed = yaml.load(serverData)

        if parsed['info']['title'] == serviceName:
            return True

    except Exception as err:
        logger.warning("Unable to get manifest from {0} with error: {1}".format(host, err))

    return False


def getStats(website, secret):
    """
    Main entry point for starting tests.
    """
    service = "StatsE16"
    port = "7016"
    ipData = requests.get(website + "/speed/ips").json()

    # Verify if we got a success response from the server
    if ipData['success'] is True:
        ips = ipData['result']

        logger.debug("Got IPS: {}".format(ips))

        # Iterate over the IPs
        for clientIp in ips:

            # Verify the client IP has SpeedE16 up and Running
            if verifyServiceRunning(clientIp, port, service) is False:
                logger.warning("{} could not be confirmed on server {}.".format(service, clientIp))

            # Get the stats
            runStats(clientIp, port, website, secret)

    else:
        logger.warning("Failed to get IPs from server: {}".format(ipData['message']))


if __name__ == '__main__':
    import click

    @click.command()
    @click.option("-w", "--website", default="http://www.esixteen.co", help="Website to download IPs and upload results to.")
    @click.option("-l", "--log", default="INFO", help="Logging level to use (DEBUG, INFO, WARNING, ERROR, CRITICAL)")
    @click.option("-s", "--secret", default="asdfasdf", help="Secret header to use when posting data.")
    def run(website, log, secret):
        """
        Run the app.
        """
        # Set logging level
        numeric_level = getattr(logging, log.upper(), None)
        if not isinstance(numeric_level, int):
            raise ValueError('Invalid log level: %s' % log)
        logging.basicConfig(level=numeric_level)

        # Run
        logger.info("Running speed test against site: {}".format(website))
        getStats(website, secret)

    run()
