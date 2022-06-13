
# signalk-raspberry-pi-rockblock9603

This plugin is desigmed to send data from the SignalK server via Iridium SBD (Short Burst Data).

The plugin has been developped for with RockBlock Iridium 9603 modem but also works with RockBlock Iridium 9602.

This plugin can be downloaded via the SignalK application.

Some examples of possible uses are found below:
* Send your position,
* Send critical alarms,
* or send any field values of your choice such as speed over ground, course over ground, heading magnetic, water temperature, wind speed, etc.

## Getting Started
You will need a raspberry pi with SignalK installed along with a rockblock iridium 9603 to used it.

### The Rockblock Iridium modem
Personally I am using the iridium modem found at the following [link]{https://www.sparkfun.com/products/14498} on Sparkfun. However there are other distributors to pick from. 

![rockblock9603](../main/Pictures/rockblock9603.png)

The datasheet and valuable information are available here: https://docs.rockblock.rock7.com/docs/

### Connecting the Rockblock Iridium modem

All you need is connecting the 4 pins (ground - GND), (5V power supply - 5VIN), (iridium TX input to RockBLOCK - TXD) and (iridium RX output from RockBlock - RXD) to your Raspberry Pi. An alternative is to buy the USB cable for the device and directly connect it to your Raspberry Pi.

The GPIO of the raspberry Pi is detailed here: https://docs.microsoft.com/pt-br/windows/iot-core/learn-about-hardware/pinmappings/pinmappingsrpi

The GPIO of the RockBLOCK 9603 and 9602 are presented here: https://docs.rockblock.rock7.com/docs/connectors

You need to make sure Raspberry Pi is turned off while doing this!

### Plugin configuration
After installation, restart the Signal K server.
Go to Server > Plugin Config.

TODO - Details goes here.

## Troubleshooting
TODO - Details goes here.

## Authors
* **Jean-David Caprace** - *Author of this plugin*
