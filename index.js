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
      iscompressed: {
        type: 'boolean',
        title: 'The message to be sent will be compressed if checked.',
        description: 'Message is compressed with zlib.deflateRaw. To uncompress use the zlib.inflateRaw.',
        default: false,
      },
      positionskpath: {
        type: 'string',
        title: 'Signal K path of the gps navigation position (latitude,longitude).',
        default: 'navigation.position',
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
      //console.log('Shipid: ', shipid);

      //Date Time
      var today = new Date();
      var DD = String(today.getDate()).padStart(2, '0');
      var MM = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
      var YYYY = today.getFullYear();
      var hh = today.getHours();
      var mm = today.getMinutes();
      var ss = today.getSeconds();
      today = YYYY + MM + DD + hh + mm + ss;
      //console.log('Date-Time: ', today);

      //First parameter is the position
      let tpv = {};
      var toprint = '';
      //let uuid = app.getSelfPath('uuid');
      //console.log('uuid: ',uuid);
      //let posi = app.getSelfPath('navigation.position');
      //console.log('posi: ',posi);

      if(app.getSelfPath(options.positionskpath)){
        //console.log('Entering in positionskpath.');
        if(!tpv.sk1) tpv.sk1 = {};
        tpv.sk1.value = app.getSelfPath(options.positionskpath).value;
        //if(typeof tpv.sk1.value == 'number'){tpv.sk1.value = tpv.sk1.value.toFixed(3);}
        
          if(options.positionskpath.includes('navigation.position')){
            tpv.sk1.value = app.getSelfPath(options.positionskpath).value;
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
            toprint = tpv.sk1.value;
          }
        //tpv.sk1.timestamp =  Date.parse(app.getSelfPath(options.positionskpath).timestamp);
        //console.log('Lat and Long: ', toprint);
      }

      //If there is some aditional parameters to sent ...
      //console.log('options length: ',options.params.length.toString());
      var addpayload = '';
      if (options.params && options.params.length > 0){
        options.params.forEach(param => {
          //app.debug(param);
          if (param.enable == true){
            if (app.getSelfPath(param.skpath) && app.getSelfPath(param.skpath).value !== null){
              addpayload = addpayload + ';' + String(app.getSelfPath(param.skpath).value.toFixed(2));
              //console.log('Payload: ', addpayload);
            }
          }
        })
      }
      var message = shipid + ';' + today + ';' + toprint + addpayload;
      console.log('Payload message: ', message);
      return message;
    }//End of constructing the message. 
  	
    /*
    iridium.on('initialized', () => {
      console.log('Iridium initialized');
  
      iridium.sendCompressedMessage('Hello world!', (err, momsn) => {
          console.log('Message Sent!');
      });
    });
    */

    function repeatsendingmessage(){
      console.log('Enter in repeatsendingmessage.');
      var txtmessage = buildingpayloadmessage();
      console.log('txtmessage: ', txtmessage);

      if (options.iscompressed == true){
        console.log('Trying to send compressed message!');
        //Message is compressed with zlib.deflateRaw. To uncompress use the zlib.inflateRaw
        iridium.sendCompressedMessage(txtmessage, (err, momsn) => {
          console.log('Compressed Message Sent!');
        });
      } else {
        console.log('Trying to send message!');
        iridium.sendMessage(txtmessage, (err, momsn) => {
          console.log('Message Sent!');
        });
      }
      
      setTimeout(repeatsendingmessage, options.messagesendingrate * 1000 * 60);
    }

    function sendingmessage(){
      console.log('Enter in sendingmessage.');
      var txtmessage = buildingpayloadmessage();
      console.log('txtmessage: ', txtmessage);

      if (options.iscompressed == true){
        console.log('Trying to send compressed message!');
        //Message is compressed with zlib.deflateRaw. To uncompress use the zlib.inflateRaw
        iridium.sendCompressedMessage(txtmessage, (err, momsn) => {
          console.log('Compressed Message Sent!');
        });
      } else {
        console.log('Trying to send message!');
        iridium.sendMessage(txtmessage, (err, momsn) => {
          console.log('Message Sent!');
        });
      }
    }



    iridium.on('initialized', () => {
      console.log('Iridium initialized!');
      iridium.enableContinousServiceAvailability();
      repeatsendingmessage();
    });
    
    iridium.on('debug', log => {
      console.log('>>> ' + log);
    });
    
    iridium.on('ringalert', function() {
      console.log("New incoming message event! Thus I will send my payload!");
      sendingmessage();
      //iridium.mailboxCheck();
    });
    
    /*
    iridium.on('newmessage', function(message, queued) {
      //When a message is received by rockblock it means that is a request to send urgently data.
      console.log("Received the new message to request data, thus I will send my payload: >", message);
      //Before sending you can check here the content of the message if you want (security)
      sendingmessage();
    });
    */
    
    //timer = setInterval(buildingpayloadmessage, 1000 * 5);
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
