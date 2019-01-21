// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';
const iothub = require('azure-iothub');
const connectionString = require('./data/cs.json').cs;
const chalk = require('chalk')
console.log(connectionString)
const registry = iothub.Registry.fromConnectionString(connectionString);

var {
  EventHubClient,
  EventPosition
} = require('@azure/event-hubs');

var printError = function (err) {
  console.log(err.message);
};


var printMessage = function (message) {
  console.log('Telemetry received: ');
  console.log(message.body);

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