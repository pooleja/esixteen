#!/usr/bin/python3

import logging
import yaml
from speedE16 import SpeedE16

from two1.commands.util import config
from two1.wallet import Wallet
from two1.bitrequests import BitTransferRequests
from two1.bitrequests import BitRequestsError
requests = BitTransferRequests(Wallet(), config.Config().username)

logger = logging.getLogger(__name__)


def verifySpeedE16Running(host):
    """ Verifies that the server is running the flask server on port 8016"""

    try:
        serverUrl = "http://" + host + ":8016"
        serverData = requests.get(serverUrl).text
        parsed = yaml.load(serverData)

        if parsed['info']['title'] == 'SpeedE16'
            return True

    except Exception as err:
        logger.warning("Unable to get manifest from {0} with error: {1}".format(host, err))

    return False

def uploadSpeedTest(website, client, server, speed):
    try:
        data = {
            'client' : client,
            'server' : server,
            'speedMbps' : speed
        }

        postHeaders = {"client" : "asdfasdf"}
        ret = requests.post(website + "/speed", json=data, headers=postHeaders)

        if ret.json()['success'] == True:
            logger.info("Successfully saved speed test")
        else
            logger.warn("Failed to upload speed test")

    except Exception as err:
        logger.warning("Unable to upload speed test results with error: {0}".format(err))


def runSpeedTest(website, client, server):

    try:

        # Figure out the base paths
        dataDir = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'client-data')
        clientBaseUrl = "http://" + client + ":8016"
        serverBaseUrl = "http://" + server + ":8016"

        # Create the speed testing client
        clientSpeed = SpeedE16(dataDir, clientBaseUrl)
        serverSpeed = SpeedE16(dataDir, serverBaseUrl)

        # Generate a 1 MB file with random data in it with a random name
        filename = ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(20))
        fullFilePath = os.path.join(dataDir, filename)
        with open(fullFilePath, 'wb') as fout:
            fout.write(os.urandom(1024 * 1024))

        logger.info("Created temp file: " + fullFilePath)

        uploadData = serverSpeed.upload(requests, fullFilePath)

        # Delete the file uploaded file since we don't need it anymore
        os.remove(fullFilePath)
        logger.info("Deleted the temp uploaded file: " + fullFilePath)

        # If the upload succeeded, now test download
        if uploadData['success'] == True:

            logger.info("Upload shows success")

            downloadData = clientSpeed.remote(requests, uploadData['upload_filename'], server)

            if downloadData['success'] == True:

                logger.info("Remote request shows success")

                # Compare the hashes to make sure no funny business happened
                if uploadData['digest'] != downloadData['digest']:
                    logger.error("Error: File digests to not match.")
                    logger.error("Uploaded File Digest: " + uploadData['digest'])
                    logger.error("Downloaded File Digest: " + downloadData['digest'])
                    return

                # Calculate Mbps - assume 1 MB file
                uploadMbps = 8 / uploadData['time']
                downloadMpbs = 8 / downloadData['time']

                logger.info('Upload Speed: ' + str(uploadMbps) + ' Mbps')
                logger.info('Download Speed: ' + str(downloadMpbs) + ' Mbps')

                uploadSpeedTest(website, client, server, downloadMpbs)
                uploadSpeedTest(website, server, client, uploadMbps)

            else:
                logger.error("Download Failed.")

        else:
            logger.error("Upload Failed.")

    except Exception as err:
        logger.error('Client test failed')
        logger.error("Failure: {0}".format(err))



def getSpeeds(website):

    ipData = requests.get(website + "/speed/ips").json()

    # Verify if we got a success response from the server
    if ipData['success'] == True :
        ips = ipData['result']

        # Iterate over the IPs
        for clientIp in ips:

            # Verify the client IP has SpeedE16 up and Running
            if verifySpeedE16Running(clientIp) == False:
                logger.warning("SpeedE16 could not be confirmed on server {0}.  Continuing to next IP.".format(clientIp))
                continue;

            # get a list of all speed tests performed by the IP we are looking at
            speedTests = requests.get(website + "/speed/tests?client=" + clientIp).json()

            if speedTests['success'] == True:

                # Perform a second pass over the IPs and see if there is already a speed test for each combo
                for serverIp in ips:

                    # Skip over the actual client IP we are looking at
                    if clientIp == serverIp:
                        continue

                    # Iterate over the speed tests and see if we find a match
                    foundMatch = False
                    for speedTest in speedTests['result']:
                        if speedTest['serverIp'] == serverIp:
                            foundMatch = True
                            break

                    # If we alread have a speed test for this combo then continue on
                    if foundMatch == True:
                        continue

                    # Verify if the serverIp is up and running SpeedE16
                    if verifySpeedE16Running(serverIp) == False:
                        logger.warning("SpeedE16 could not be confirmed on server {0}.  Continuing to next IP.".format(serverIp))
                        continue;

                    runSpeedTest(website, clientIp, serverIp)

            else
                logger.warning("Failed to get speed tests from server for IP: {}".format(clientIp))
                continue

    else
        logger.warning("Failed to get IPs from server: {}".format(err))


if __name__ == '__main__':
    import click

    @click.command()
    @click.option("-w", "--website", default="http://www.esixteen.co", help="Website to download IPs and upload results to.")
    @click.option("-l", "--log", default="INFO", help="Logging level to use (DEBUG, INFO, WARNING, ERROR, CRITICAL)")
    def run(website, log):

        # Set logging level
        numeric_level = getattr(logger, log.upper(), None)
        if not isinstance(numeric_level, int):
            raise ValueError('Invalid log level: %s' % loglevel)
        logger.basicConfig(level=numeric_level)

        # Run
        logger.info("Running speed test against site: {}".format(website))
        getSpeeds(website)

    run()
