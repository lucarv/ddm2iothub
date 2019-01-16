// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';
const iothub = require('azure-iothub');
const connectionString = require('./data/cs.json').cs;
const chalk = require('chalk')
console.log(connectionString)
const registry = iothub.Registry.fromConnectionString(connectionString);
/*
var Client = require('azure-iot-device').Client;
//var Protocol = require('azure-iot-device-amqp').Amqp;
var Protocol = require('azure-iot-device-mqtt').Mqtt;
// Connection string for the IoT Hub service
  // Create a device identity registry object
//
// NOTE:
// For simplicity, this sample sets the connection string in code.
// In a production environment, the recommended approach is to use
// an environment variable to make it available to your application
// or use an x509 certificate.
// https://docs.microsoft.com/azure/iot-hub/iot-hub-devguide-security
//
// Using the Azure CLI:
// az iot hub show-connection-string --hub-name {YourIoTHubName} --output table
*/
// Using the Node.js SDK for Azure Event hubs:
//   https://github.com/Azure/azure-event-hubs-node
// The sample connects to an IoT hub's Event Hubs-compatible endpoint
// to read messages sent from a device.
var {
  EventHubClient,
  EventPosition
} = require('@azure/event-hubs');

var printError = function (err) {
  console.log(err.message);
};

// Display the message content - telemetry and properties.
// - Telemetry is sent in the message body
// - The device can add arbitrary application properties to the message
// - IoT Hub adds system properties, such as Device Id, to the message.
var printMessage = function (message) {
  console.log('Telemetry received: ');
  console.log(message.body);


  // Get the device twin and send desired property update patches at intervals.
  // Print the reported properties after some of the desired property updates.
  registry.getTwin(message.body.deviceId, (err, twin) => {
    if (err) {
      console.error(err.message);
    } else {
      var patch = {
        tags: {
          state: message.body.status
        }
      };
      console.log(patch.tags)
      twin.update(patch, (err, twin) => {
        if (err) {
          console.error(err.message);
        } else {
          console.log(JSON.stringify(patch, null, 2));
        }
      });
    }
  });
}

// Connect to the partitions on the IoT Hub's Event Hubs-compatible endpoint.
// This example only reads messages sent after this application started.
var ehClient;
EventHubClient.createFromIotHubConnectionString(connectionString).then(function (client) {
  console.log("Successully created the EventHub Client from iothub connection string.");
  ehClient = client;
  return ehClient.getPartitionIds();
}).then(function (ids) {
  console.log("The partition ids are: ", ids);
  return ids.map(function (id) {
    return ehClient.receive(id, printMessage, printError, {
      eventPosition: EventPosition.fromEnqueuedTime(Date.now())
    });
  });
}).catch(printError);