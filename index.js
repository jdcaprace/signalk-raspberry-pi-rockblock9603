/*
 * Copyright 2022 Jean-David Caprace <jd.caprace@gmail.com>
 *
 * Add the MIT license
 */

//See the latest version of iridium here:
//https://github.com/dudewheresmycode/node-iridium-sbd
const iridium = require('./iridium-sbd.js')

//To obtain the SignalK paths
const signalkSchema = require('@signalk/signalk-schema')
const Bacon = require('baconjs')
const relevantKeys = Object.keys(signalkSchema.metadata)
  .filter(s => s.indexOf('/vessels/*') >= 0)
  .map(s => s.replace('/vessels/*', '').replace(/\//g, '.').replace(/RegExp/g, '*').substring(1)).sort()

module.exports = function (app) {
  let timer = null
  let plugin = {}

  plugin.id = 'signalk-raspberry-pi-rockblock9603'
  plugin.name = 'Raspberry-Pi rockblock9603'
  plugin.description = 'Iridium rockblock9603 to send SignalK path values by Iridium Satellite Short Burst Data (SBD)'

  plugin.schema = {
    type: 'object',
    properties: {
      messagesendingrate: {
        title: "This is the message sending rate (in minutes)",
        type: 'number',
        default: 60
      },
      usbdevicepath: {
        type: 'string',
        title: 'USB device path',
        description: 'Example: /dev/ttyUSB0 (USB) or /dev/ttyS0 (Serial) ',
        default: '/dev/ttyUSB0',
      },
      skpath1: {
        type: 'string',
        title: 'SK1 - Signal K path of the navigation.',
        default: 'navigation.position',
      },
      active1: {
        type: 'boolean',
        title: 'SK1 - Is active',
        default: true,
      },
      params: {
        type: "array",
        title: "SignalK path",
        description: 'Path of the data to be sent by satellite comunication',
        items: {
          type: "object",
          required: ['enable','skpath'],
          properties: {
            enable: {
              type: 'boolean',
              title: 'Enable this signalK path',
              default: false
            },
            skpath: {
              type: 'string',
              title: 'SignalK path',
              description: 'This is used to extract the value of the field you want to send with Iridium satellite. Support only numbers at the moment.',
              default: 'environment.outside.temperature'
            }
          }
        },
      },  
    }
  }

  var unsubscribes = [];

  plugin.start = function (options) {
    
    iridium.open({
      debug: 1, //turn debugging on
      port: options.usbdevicepath,
      flowControl: false, //set to false to disable flowControl on the SBD for 3-wire UART setups
      maxAttempts: 15,
      defaultTimeout: 90000, // 90 seconds general timeout for all commands
    });

    iridium.on('initialized', () => {
      console.log('Iridium initialized');
      
      iridium.enableContinousServiceAvailability();

      iridium.sendCompressedMessage('Hello world!', (err, momsn) => {
          console.log('Message Sent!');
      });
    });

    iridium.on('debug', log => {
      console.log('>>> ' + log);
    });

    /*
    iridium.on('ringalert', function() {
      console.log("New incoming message event!");
      iridium.mailboxCheck();
    });
     
    iridium.on('newmessage', function(message, queued) {
      console.log("Received new message ", message);
    });
    */


    function iridiumsendpayloadmessage(){
    //TODO - Develop here the message package to be sent with a certain frequence.
    console.log('Virtual payload message for testing!');
    }

    //let tpv = {};

    //Creating the payload of the message to be sent by satellite
    //ID, DateTime, lat, long, P1, P2, P3, P4, S1, A1, A2, A3, A4.
    
    //Shipid
    var shipid = app.getSelfPath('name').value;
    console.log('Shipid: ', shipid);

    //Date Time
    var today = new Date();
    var DD = String(today.getDate()).padStart(2, '0');
    var MM = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var YYYY = today.getFullYear();
    var hh = today.getHours();
    var mm = today.getMinutes();
    var ss = today.getSeconds();
    today = YYYY + MM + DD + hh + mm + ss;
    console.log('Date-Time: ', today);


    //First parameter - Should be the position if it is intented to be used.
		if(app.getSelfPath(options.skpath1)){
			if(!tpv.sk1) tpv.sk1 = {};
			tpv.sk1.value = app.getSelfPath(options.skpath1).value;
      if(typeof tpv.sk1.value == 'number'){tpv.sk1.value = tpv.sk1.value.toFixed(3);}
      
        if(options.skpath1.includes('navigation.position')){
          tpv.sk1.value = app.getSelfPath(options.skpath1).value;
          var pos = JSON.parse(JSON.stringify(tpv.sk1.value));
          //console.log("pos: ",pos);
          if(pos.longitude !== null && pos.latitude !== null){
            var lat = String(pos.latitude.toFixed(8));
            var long = String(pos.longitude.toFixed(8));
            tpv.sk1.value = lat + ";" + long;
          }
          tpv.sk1.toprint = String(tpv.sk1.value);
        }
			//tpv.sk1.timestamp =  Date.parse(app.getSelfPath(options.skpath1).timestamp);
      console.log('P1 (latlong): ', tpv.sk1.toprint);
		}

    //If there is some aditional parameters to sent ...
    var mainpayload = '';
    if (options.param && options.param.length > 0){
      options.params.forEach(param => {
        app.debug(param);
        if (param.enable == true){
          if (app.getSelfPath(param.skpath)){
            mainpayload = mainpayload + ',' + String(app.getSelfPath(param.skpath).value.tofixed(2));
            console.log('Mainpayload: ', mainpayload);
          }
        }
      })
    }



/*
    if(app.getSelfPath(options.skpath2)){
			if(!tpv.sk2) tpv.sk2 = {};
      tpv.sk2.shortcode = options.shortcode2;
			tpv.sk2.value = app.getSelfPath(options.skpath2).value;
      if(options.offset2!=0){tpv.sk2.value = Number(tpv.sk2.value) + Number(options.offset2);}
      if(options.multiplier2!=1){tpv.sk2.value = Number(tpv.sk2.value) * Number(options.multiplier2);}
      if(typeof tpv.sk2.value == 'number'){tpv.sk2.value = tpv.sk2.value.toFixed(3);}
			tpv.sk2.timestamp =  Date.parse(app.getSelfPath(options.skpath2).timestamp);
      tpv.sk2.toprint = tpv.sk2.shortcode + ': ' + String(tpv.sk2.value);
		}
    //console.log("tpv.sk2.value: ",tpv.sk2.value);

    if(app.getSelfPath(options.skpath3)){
			if(!tpv.sk3) tpv.sk3 = {};
      tpv.sk3.shortcode = options.shortcode3;
			tpv.sk3.value = app.getSelfPath(options.skpath3).value;
      if(options.offset3!=0){tpv.sk3.value = Number(tpv.sk3.value) + Number(options.offset3);}
      if(options.multiplier3!=1){tpv.sk3.value = Number(tpv.sk3.value) * Number(options.multiplier3);}
      if(typeof tpv.sk3.value == 'number'){tpv.sk3.value = tpv.sk3.value.toFixed(3);}
			tpv.sk3.timestamp =  Date.parse(app.getSelfPath(options.skpath3).timestamp);
      tpv.sk3.toprint = tpv.sk3.shortcode + ': ' + String(tpv.sk3.value);
		}
    //console.log("tpv.sk3.value: ",tpv.sk3.value);

    if(app.getSelfPath(options.skpath4)){
			if(!tpv.sk4) tpv.sk4 = {};
      tpv.sk4.shortcode = options.shortcode4;
			tpv.sk4.value = app.getSelfPath(options.skpath4).value;
      if(options.offset4!=0){tpv.sk4.value = Number(tpv.sk4.value) + Number(options.offset4);}
      if(options.multiplier4!=1){tpv.sk4.value = Number(tpv.sk4.value) * Number(options.multiplier4);}
      if(typeof tpv.sk4.value == 'number'){tpv.sk4.value = tpv.sk4.value.toFixed(3);}
			tpv.sk4.timestamp =  Date.parse(app.getSelfPath(options.skpath4).timestamp);
      tpv.sk4.toprint = tpv.sk4.shortcode + ': ' + String(tpv.sk4.value);
		}
    //console.log("tpv.sk4.value: ",tpv.sk4.value);
*/

    	     
    timer = setInterval(iridiumsendpayloadmessage, options.messagesendingrate * 1000 * 60);
  }

 
  plugin.stop = function () {
    app.debug('Plugin stopped');
    if(timer){
      clearInterval(timer);
      timeout = null;
    }

    unsubscribes.forEach(f => f())
    unsubscribes = []
  }

  return plugin;
}
