/*
 * Copyright 2022 Jean-David Caprace <jd.caprace@gmail.com>
 *
 * Add the MIT license
 */

const startiridium = require('iridium-sbd')

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
        description: 'Example: /dev/ttyUSB0',
        default: '/dev/tty/USB0',
      },
     /* skpath1: {
        type: 'string',
        title: 'SK1 - Signal K path of the 1st parameter',
        default: 'navigation.position',
      },
      active1: {
        type: 'boolean',
        title: 'SK1 - Is active',
        default: true,
      },
      skpath2: {
        type: 'string',
        title: 'SK2 - Signal K path of the 2nd parameter',
        default: 'navigation.speedOverGround',
      },
      active2: {
        type: 'boolean',
        title: 'SK2 - Is active',
        default: true,
      },      
      skpath3: {
        type: 'string',
        title: 'SK3 - Signal K path of the 3rd parameter',
        default: 'navigation.courseOverGroundTrue',
      },
      active3: {
        type: 'boolean',
        title: 'SK3 - Is active',
        default: true,
      },  
      skpath4: {
        type: 'string',
        title: 'SK4 - Signal K path of the 4st parameter',
        default: 'environment.outside.temperature',
      },
      active4: {
        type: 'boolean',
        title: 'SK4 - Is active',
        default: true,
      },  */     
    }
  }

  var unsubscribes = [];

  plugin.start = function (options) {
    let tpv = {};

    iridium.open({
      debug: 1, //turn debugging on
      port: options.usbdevicepath,
      flowControl: true, //set to false to disable flowControl on the SBD for 3-wire UART setups
    });

    iridium.on('initialized', () => {
      console.log('Iridium initialized');
  
      iridium.sendCompressedMessage('Hello world!', (err, momsn) => {
          console.log('Message Sent!');
      });
    });

    iridium.on('debug', log => {
      console.log('>>> ' + log);
    });

    function iridiumsendregularmessage(){
    //TODO - Develop here the message package to be sent with a certain frequence.
    }

    /*
    iridium.on('ringalert', function() {
      console.log("New incoming message event!");
      iridium.mailboxCheck();
    });
     
    iridium.on('newmessage', function(message, queued) {
      console.log("Received new message ", message);
    });
    */

    /*
		if(app.getSelfPath(options.skpath1)){
			if(!tpv.sk1) tpv.sk1 = {};
      tpv.sk1.shortcode = options.shortcode1;
			tpv.sk1.value = app.getSelfPath(options.skpath1).value;
      if(options.offset1!=0){tpv.sk1.value = Number(tpv.sk1.value) + Number(options.offset1);}
      if(options.multiplier1!=1){tpv.sk1.value = Number(tpv.sk1.value) * Number(options.multiplier1);}
      if(typeof tpv.sk1.value == 'number'){tpv.sk1.value = tpv.sk1.value.toFixed(3);}
      
        if(options.skpath1.includes('navigation.position')){
          tpv.sk1.value = app.getSelfPath(options.skpath1).value;
          var pos = JSON.parse(JSON.stringify(tpv.sk1.value));
          //console.log("pos: ",pos);
          if(pos.longitude !== null && pos.latitude !== null)
          {
          tpv.sk1.value = 'LON: ' + String(pos.longitude.toFixed(6)) + ' LAT: ' + String(pos.latitude.toFixed(6));
          }
        }

			tpv.sk1.timestamp =  Date.parse(app.getSelfPath(options.skpath1).timestamp);
      tpv.sk1.toprint = tpv.sk1.shortcode + ': ' + String(tpv.sk1.value);
		}


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

    	     
    timer = setInterval(iridiumsendregularmessage, options.messagesendingrate * 1000 * 60);
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


