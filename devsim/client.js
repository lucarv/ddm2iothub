// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

var uuid = require('uuid');
//var Protocol = require('azure-iot-device-mqtt').Mqtt;
// Uncomment one of these transports and then change it in fromConnectionString to test other transports
// var Protocol = require('azure-iot-device-amqp').AmqpWs;
// var Protocol = require('azure-iot-device-http').Http;
var Protocol = require('azure-iot-device-amqp').Amqp;
// var Protocol = require('azure-iot-device-mqtt').MqttWs;
var Client = require('azure-iot-device').Client;
var Message = require('azure-iot-device').Message;
const devices = require('./devices.json')
console.log(devices[0].cs);

// String containing Hostname, Device Id & Device Key in the following formats:
//  "HostName=<iothub_host_name>;DeviceId=<device_id>;SharedAccessKey=<device_key>"

// fromConnectionString must specify a transport constructor, coming from any transport package.
var client = Client.fromConnectionString(devices[0].cs, Protocol);

client.open(function (err) {
  if (err) {
    console.error('Could not connect: ' + err.message);
  } else {
    console.log('Client connected');
    startTele();
  }
});


const startTele = () => {
  var loop = setInterval(function () {
    console.log('tick')
    let tempVal = 10 + (Math.floor(Math.random() * 16) + 5)/100;
    let pressureVal = 25 + (Math.floor(Math.random() * 10) + 1)/100 ;

    let ipso = {
      "bn": "",
      "bt": 1.276020076001e+09,
      "e": [{
          "n": "endpointId/3303/5700",
          "v": tempVal,
          "u": "Celcius"
        },
        {
          "n": "endPointId/3304/5700",
          "v": pressureVal,
          "u": "Barometer"
        }
      ]
    }
    var message = new Message(JSON.stringify(ipso));
    message.messageId = uuid.v4();
    console.log('Sending message: ' + message.getData());

    client.sendEvent(message, function (err) {
      if (err) {
        console.error('Could not send: ' + err.toString());
        process.exit(-1);
      } else {
        console.log('Message sent: ' + message.messageId);
      }

    });
  }, 10000);
};