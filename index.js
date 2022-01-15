/*
 * Copyright 2022 Jean-David Caprace <jd.caprace@gmail.com>
 *
 * Add the MIT license
 */

//import {display, Font, Color, Layer } from 'oled-ssd1306-i2c'
const ssd1306 = require('oled-ssd1306-i2c');
var display = ssd1306.display;
var Font = ssd1306.Font;
var Color = ssd1306.Color;
var Layer = ssd1306.Layer;


module.exports = function (app) {
  let timer = null
  let plugin = {}

  plugin.id = 'signalk-raspberry-pi-ssd1306'
  plugin.name = 'Raspberry-Pi ssd1306'
  plugin.description = 'ssd1306 i2c mini OLED display to plot SignalK fields for Raspberry-Pi'

  plugin.schema = {
    type: 'object',
    properties: {
      rate: {
        title: "Refresh Sample Rate (in seconds)",
        type: 'number',
        default: 5
      },
      pathvoltage: {
        type: 'string',
        title: 'SignalK Path of voltage',
        description: 'This is used to build the path in Signal K for the voltage sensor data',
        default: 'electrical.batteries.battery01.voltage' //Units: V (Volt)
		    //https://signalk.org/specification/1.5.0/doc/vesselsBranch.html
      },
      reportcurrent: {
        type: 'boolean',
        title: 'Also send the current data to Signalk',
        default: true
      },
      pathcurrent: {
        type: 'string',
        title: 'SignalK Path of current',
        description: 'This is used to build the path in Signal K for the current sensor data',
        default: 'electrical.batteries.battery01.current' //Units: A (Ampere)
      },
      i2c_bus: {
        type: 'integer',
        title: 'I2C bus number',
        default: 1,
      },
      i2c_address: {
        type: 'string',
        title: 'I2C address',
        default: '0x3c',
      },
    }
  }

  plugin.start = function (options) {

    function createDeltaMessage (voltage, current) {
      var values = [
        {
          'path': options.pathvoltage,
          'value': voltage
        }
      ];
    
    // Report current if desired
    if (options.reportcurrent == true) {
      values.push(
        {
          'path': options.pathcurrent,
          'value': current
        });
      }
      

      return {
        'context': 'vessels.' + app.selfId,
        'updates': [
          {
            'source': {
              'label': plugin.id
            },
            'timestamp': (new Date()).toISOString(),
            'values': values
          }
        ]
      }
    }

    
    
    
    
    
    //Configure and setup your display using init(i2cNumber, address) method.
    //Parameter i2cNumber is the mini-pc i2c bus name in /dev/ in with is connected display.
    //Parameter address is the i2c address of display driver ad specified in datasheet.

    display.init(options.i2c_address, options.i2c_bus);      // Open bus and initialize driver
    display.turnOn();           // Turn on display module
    display.clearScreen();      // Clear display buffer
    display.refresh();          // Write buffer in display registries
    
    //Setup font
    display.setFont(Font.UbuntuMono_8ptFontInfo);

    //Fonts
    //UbuntuMono_8ptFontInfo = 0,
    //UbuntuMono_10ptFontInfo = 1,
    //UbuntuMono_12ptFontInfo = 2,
    //UbuntuMono_16ptFontInfo = 3,
    //UbuntuMono_24ptFontInfo = 4,
    //UbuntuMono_48ptFontInfo = 5,
    
    //Drawing functions
    //Following function are available.

    //display.drawPixel(x, y, color, layer);
    //display.drawLine(x, y, x1, y1, color, layer);
    //display.drawRect(x, y, w, h, color, layer);
    //display.fillRect(x, y, w, h, color, layer);
    //display.drawString(x:number, y:number, text, size, color, layer);

    //int Size
    //font size, as multiplier. Eg. 2 would double size, 3 would triple etc.

    //int color
    //Black = 0,
	  //White = 1,
    //Inverse = 2,

    //int Layers
    //Layer0 = 1,
    //Layer1 = 2,

    display.drawString(10,10,"toto",1,1,1);
    
    //Refresh function
    //Use the refresh method to update the display.
    
    //display.refresh();
    
    
    
    // The ina219 constructor options are optional.
    
    //const inaoptions = {
    //  bus : options.i2c_bus || 1, // defaults to 1
    //	address : options.i2c_address || '0x40', // defaults to 0x40
	  //  };

	  // Read ina219 sensor data
    async function readina219() {
		  const sensor = await ina219(options.i2c_address, options.i2c_bus);
      await sensor.calibrate32V2A();

		  const busvoltage = await sensor.getBusVoltage_V();
      console.log("Bus voltage (V): " + busvoltage);
      const shuntvoltage = await sensor.getShuntVoltage_mV();
      console.log("Shunt voltage (mV): " + shuntvoltage);
      const shuntcurrent = await sensor.getCurrent_mA();
      console.log("Current (mA): " + shuntcurrent);

        //console.log(`data = ${JSON.stringify(data, null, 2)}`);
		    //console.log(data)
        
        // create message
        var delta = createDeltaMessage(shuntvoltage, shuntcurrent)
        
        // send data
        app.handleMessage(plugin.id, delta)		
	
        //close sensor
        //await sensor.close()

      .catch((err) => {
      console.log(`ina219 read error: ${err}`);
      });
    }

    //readina219();
    
    timer = setInterval(readina219, options.rate * 1000);
  }

  plugin.stop = function () {
    if(timer){
      clearInterval(timer);
      timeout = null;
    }
  }

  return plugin
}


