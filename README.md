
# signalk-raspberry-pi-rockblock9603

This plugin is desigmed to send data from the SignalK server via Iridium SBD (Short Burst Data).

The plugin has been developped for RockBlock Iridium 9603 modem but also works with RockBlock Iridium 9602.

This plugin can be downloaded via the SignalK application.

Some examples of possible uses are found below:
* Send your position,
* Send critical alarms,
* or send any field values of your choice such as speed over ground, course over ground, heading magnetic, water temperature, wind speed, etc.

## Getting Started
You will need a raspberry pi with SignalK installed along with a rockblock iridium 9603 to used it.

### The Rockblock Iridium modem
Personally I am using the iridium modem found at the following [link](https://www.sparkfun.com/products/14498) on Sparkfun. However there are other distributors to pick from. 

![rockblock9603](../main/Pictures/rockblock9603.png)

The datasheet and valuable information are available here: https://docs.rockblock.rock7.com/docs/

We also strongly recomand to have a look on the Adafruit RockBLOCK Iridium Modem page [here](https://learn.adafruit.com/using-the-rockblock-iridium-modem?view=all).

### Connecting the Rockblock Iridium modem
The GPIO pinout of the raspberry Pi is detailed [here](https://docs.microsoft.com/pt-br/windows/iot-core/learn-about-hardware/pinmappings/pinmappingsrpi). The GPIO pinout of the RockBLOCK 9603 and 9602 are presented [here](https://docs.rockblock.rock7.com/docs/connectors).

All you need is connecting 4 pins. Hower, **WARNING**, the label of the pinout of the iridium modem ARE NOT usual (see bold below). You need to make sure Raspberry Pi is turned off while doing this!

![rockblock9603pinout](../main/Pictures/rockblock9603pinout.png)

1. RXD Serial output from RockBLOCK, **so it's really TX** -- *To be connected to pin 10 (UART RX) of your raspberry pi*
2. CTS Clear to Send (output from RockBLOCK)
3. RTS Ready To Send (input to RockBLOCK)
4. NET Network Available
5. RI Ring Indicator (active low)
6. TXD Serial input to RockBLOCK, **so it's really RX** -- *To be connected to pin 8 (UART TX) of your raspberry pi*
7. SLP Sleep control (pull to ground to switch off)
8. 5V 5V in power supply (450mA limit) -- *To be connected to one of the 5V power pin of your raspberry pi, e.g. pin 2*
9. BAT 3.7V power supply (450mA limit)
10. GND Ground -- *To be connected to a ground pin of your raspberry pi, e.g. pin 39*

An alternative is to buy the USB cable for the device and directly connect it to your Raspberry Pi.

Once turned on, there are two small LED indicators on the side with the big capacitors:
* Red = DC power present.
* Green = Capacitors are charged. This is needed for satellite communication.

### Switching RockBLOCK 9603 antenna mode
The rockblock 9603 has an internal antena integrated, however, you may want to adquire an external antena to obtain a clear view of the sky without exposing your hardware outside. In this case you will need to make a change in the hardware configuration. The details are explained [here](https://docs.rockblock.rock7.com/docs/switching-rockblock-9603-antenna-mode#replace-the-9603-module).

### Serial port configuration on Rasberry Pi
This step is easy but it is important check it before to start.

Open a shell console on your Raspberry pi and run the code: `sudo raspi-config`. Here below the steps for RPi4 (it can change depending of your model):
1. Go down to **Interface options**.
2. Hit enter and then go down to **Serial port**.
3. Hit enter and check the following is verified:
    * The serial login shell is **disabled** -- *If enable the shell will send commands that will interfer with the modem. I personnaly spent hours to discover that it was an issue*.
    * The serial interface is **enabled**.
4. Reboot your raspberry pi.

### Configuring your account in Rockblock
Rock Seven provides a web based interface for managing your account which you can access at http://www.rock7.com/register. General information about using this system is [here](https://docs.rockblock.rock7.com/docs/rockblock-management-system).

Once you've created an account and logged in, you can register your specific Rock BLOCK 9603 modem with the number present on the sticker than is on the modem. You also need to have your service enabled by purchasing line rental and credits. The Iridium contract costs is available [here](https://docs.rockblock.rock7.com/docs/iridium-contract-costs#is-a-better-price-available-for-large-volumes-of-datarockblocks).

### Testing the hardware outside the SignalK server (optional)
We strongly suggest to test the hardware outside signalk server. We recomand to use the **minicom** software to do it.

#### Installing minicom
You can install **minicom** on your raspberry pi by executing `sudo apt-get install minicom`. Here the steps to configure it to communicate with the iridium modem:

1. Execute `sudo minicom -s`.
2. Go down to "serial port setup".
    * Press A and configure "Serial Device" to:
        * `/dev/ttyS0` if you use serial or `/dev/ttyUSB0` if you use USB
    * Press B and configure "Lockfile location" to `/var/lock`.
    * Press E and configure the "Bps/Par/Bits" (baudrate) with the following (see documentation [here](https://docs.rockblock.rock7.com/docs/serial-interface#baud-rate)):
        * Baud Rate = 19200
        * Data Bits = 8
        * Parity = N
        * Stop Bits = 1
    * Press F and turn the Hardware flow control to `No`.
    * Press G and turn the SOftware flow control to `No`.
3. Press Enter
4. Go down to save setup as dfl, press enter.
5. Go down to exit from minicom.

Continue checking that the port is available for testing typing the following in the console: `ls -l /dev/ttyS0` for serial or `ls -l /dev/ttyUSB0` for USB.
You should see something like:
`crw-rw---- 1 root dialout 4, 64 Jun 13 16:49 /dev/ttyS0`

To start **minicom** type `minicom` in the shell console.

#### Testing the Iridium modem
We are going now to test the modem interacting directly with the ISU AT Command Reference (Iridium proprietary). The full specification can be downloaded [here](https://cdn.sparkfun.com/datasheets/Wireless/General/IRDM_ISU_ATCommandReferenceMAN0009_Rev2.0_ATCOMM_Oct2012.pdf).

However, we will only present here some basic functions to check the health of the hardware. All commands should be followed by typing Enter (the \r). Note that all commands start with `AT+`.

You can start by:
* Typing `AT` and the modem will answer `OK`. If not check the connection, the port configuration as well as the baudrate.
* The try `AT+CGMI` that should retrun `Iridium`.
* And `AT+CGMM` that should give the modem model `IRIDIUM 9600 Family SBD Transceiver`.
* For full specs run `AT+CGMR`.

OK, fun part time! Let's try and send a message. If you aren't already connected to the RockBLOCK, see the previous section. You also need to have your service enabled by purchasing line rental and credits.

For this initial test we'll use text. Later we'll use binary data, which is generally the way all the communication should be done. Text is just a convenience feature.

Let start:
* Once you are connected, type `AT+SBDSX` an you will get something such `+SBDSX: 0, 0, 0, -1, 0, 0`. The first number denote how many messages are waiting for delivery in the local memory of the modem.
* You can now write `AT+SBDWT=Hello World!` and then press Enter. The system return `OK`.
* Once again type `AT+SBDSX` an you will get something such `+SBDSX: 1, 0, 0, -1, 0, 0`. It denotes that one message is ready to be send.
* Then type `AT+SBDIX` and press Enter. It will attempt to talk to the satellites and after a period of time return a status as `+SBDIX: 32, 8, 2, 0, 0, 0.` If the first number is not 0, then the message did NOT transmit and you'll need to try again. Keep entering the `AT+SBDIX` command until the first number in the status return is 0. You may have to try this several times depending on how good your view of the sky is, where the satellites are, etc. Wait 10s of seconds between each try to let the super capacitor the time to recharge. Once you receive a feedback with the first number equal to zero, you can log into your RockBlock account and got to Messages, you should see the arrived message with "Hello World!" in the payload.

What is the meaning of the returned 6 values:
* **MO status** = status of outgoing transmission.
    * [0-4] = Transmit successful.
    * [32] = No network service.
* **MOMSN** = Mobile Originated Message Sequence Number.
* **MT status** = status of inbound transmission.
    * 0: No SBD message to receive from the satelite.
    * 1: SBD message successfully received from the satelite.
    * 2: An error occurred while attempting to perform a mailbox check or receive a message from the satelite.
* **MTMSN** = Mobile Terminated Message Sequence Number.
* **MT length** = bytes received.
    * The MT length is the length in bytes of the mobile terminated SBD message received from the satelite. If no message was received, this field will be zero.
* **MT queued** = messages waiting to be delivered.
    * MT queued is a count of mobile terminated SBD messages waiting at the satelite to be transferred to the rocklock.

Time now to pass to the Signalk server.

#### Testing the Iridium signal strength
The command: `AT+CSQ` list the supported signal strength indications. The response is in the form: `+CSQ:number`. Each number represents about 2 dB improvement in link margin over the previous value.
* A reading of 0 is at or below the minimum receiver sensitivity level.
* A reading of 1 indicates about 2 db of link margin.
* A reading of 5 indicates 10 dB or more link margin.

These are not calibrated output and provides relative information about the units receive signal, and not an absolute receiver level or even a calibrated signal to noise ratio.

It is important to note that a signal strength response may not be immediately available, but will usually be received within two seconds of issuing the command. If the modem is in the process of acquiring the system, a delay in response of up to 50 seconds may be experienced. The command `AT+CSQF` form of the command returns immediately, reporting the last known calculated signal strength. Note that the signal strength returned by this command could be different from the current actual signal strength if the `AT+CSQ` form is used. This form is included for product developer application compatibility as it provides a fast response.

#### Full Iridium system diagnostic
The command `AT+CIER=1,1,1,1` enable a service that will monitor continously any changes in the status of the modem and the connection. The first digit enable the monitoring service. The second digit enable the signal quality monitoring. The third digit enable the service availability monitoring, and the last one check the status of the antenna.

How to read the results:
* `+CIEV:0,x` -- x represent the signal strenght from 0 to 5.
* `+CIEV:1,x` -- where x may take the following values:
    * 0 - Network service is currently unavailable.
    * 1 - Network service is available.
* `+CIEV:2,x` -- where x may take the following values:
    * 0 - No antenna fault detected, or antenna fault cleared.
    * 1 - Antenna fault detected, further transmission impossible.

If you only want to monitor the service availability, the `AT+CIER=1,0,1,0` is fine.

### Plugin configuration
Install the plugin in signalk app store. After installation, restart the SignalK server. Go to Server and then Plugin Config.

The following parameters can be configured:
* The sending rate of the regular Iridium SBD messages in minutes. WARNING - ROCKBLOCK CREDITS WILL BE CONSUMED!
* The sending rate of the emergency Iridium SBD messages in minutes. WARNING - ROCKBLOCK CREDITS WILL BE CONSUMED!
* The USB device path. You should tipically choose between /dev/ttyUSB0 (USB) or /dev/ttyS0 (Serial).
* Option to compress the message in a binary form. If active the message is send compressed, otherwise the message is sent in plain text. The compressing algorithm that is used is `zlib.deflateRaw`. To uncompress use the `zlib.inflateRaw` see [zlib](https://www.zlib.net/) for more details.
* The SignalK path of your position that is going to be reported, e.g., use 'navigation.position'.
* Any other information you want to sent in the message can be configured here using signalK paths.
    * Numericals field can be send in the payload of the message.
    * Alarm states of the signalk.zones plugin can be send in the payload of the message where: 0:normal, 1:alert, 2:warn, 3:alarm, 4:emergency.

Note that the message is going to have the following pattern:
`"Name;Timestamp;Latitude;Longitude;P1;P2;P3;P4;etc."`

If you want to request the rockblock to send immediatly the payload in case of emmergency you can send a TEXT MT message to the rockblock. He will reply sending immediatly the data that are required. This function can be improved in the near future to peform more complex tasks such as digital switching, etc.

## Authors
* **Jean-David Caprace** - *Author of this plugin*
