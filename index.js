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
        title: "This is the message sending rate (in minutes).",
        description: 'WARNING: ROCKBLOCK CREDITS WILL BE CONSUMED!',
        type: 'number',
        default: 60
      },
      usbdevicepath: {
        type: 'string',
        title: 'USB device path',
        description: 'Example: /dev/ttyUSB0 (USB) or /dev/ttyS0 (Serial)',
        default: '/dev/ttyUSB0',
      },
      skpath1: {
        type: 'string',
        title: 'Signal K path of the gps navigation position (latitude,longitude).',
        default: 'navigation.position',
      },
      active1: {
        type: 'boolean',
        title: 'GPS position is active',
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

    function buildingpayloadmessage(){
      //Creating the payload of the message to be sent to the satellite
      //Format will be CSV as: Name; DateTime; lat; long; P1; P2; P3; ...
      
      //Shipid  
      var shipid = app.getSelfPath('name');
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

      //First parameter is the position
      let tpv = {};
      if(app.getSelfPath(options.skpath1)){
        if(!tpv.sk1) tpv.sk1 = {};
        tpv.sk1.value = app.getSelfPath(options.skpath1).value;
        if(typeof tpv.sk1.value == 'number'){tpv.sk1.value = tpv.sk1.value.toFixed(3);}
        
          if(options.skpath1.includes('navigation.position')){
            tpv.sk1.value = app.getSelfPath(options.skpath1).value;
            var pos = JSON.parse(JSON.stringify(tpv.sk1.value));
            //console.log("Position: ",pos);
            
            //If gps position not found return 999
            var lat = '999';
            var long = '999';
            tpv.sk1.value = lat + ";" + long;
            
            if(pos.longitude !== null && pos.latitude !== null){
              lat = String(pos.latitude.toFixed(8));
              long = String(pos.longitude.toFixed(8));
              tpv.sk1.value = lat + ";" + long;
            }
            tpv.sk1.toprint = tpv.sk1.value;
          }
        //tpv.sk1.timestamp =  Date.parse(app.getSelfPath(options.skpath1).timestamp);
        console.log('Lat and Long: ', tpv.sk1.toprint);
      }

      //If there is some aditional parameters to sent ...
      console.log('options length: ',options.params.length.toString());
      var addpayload = '';
      if (options.params && options.params.length > 0){
        options.params.forEach(param => {
          app.debug(param);
          if (param.enable == true){
            if (app.getSelfPath(param.skpath)){
              addpayload = addpayload + ';' + String(app.getSelfPath(param.skpath).value.toFixed(2));
              console.log('Payload: ', addpayload);
            }
          }
        })
      }
      var message = shipid + ';' + today + ';' + tpv.sk1.toprint + addpayload;
      console.log('Message: ', message);
      return message;
    }//End of constructing the message. 
  	

    function sendingmessage(){

      iridium.on('initialized', () => {
        console.log('Iridium initialized');

        var txtmessage = buildingpayloadmessage();
        console.log('txtmessage: ', txtmessage);

        iridium.enableContinousServiceAvailability();

        //Message is compressed with zlib.deflateRaw. To uncompress use the zlib.inflateRaw
        iridium.sendCompressedMessage(txtmessage, (err, momsn) => {
            console.log('Message Sent!');
        });

      });
    }

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

    timer = setInterval(sendingmessage, options.messagesendingrate * 1000 * 60);
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
