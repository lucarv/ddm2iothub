'use strict';

const express = require('express');
const router = express.Router();
const iothub = require('azure-iothub');
const connectionString = require('../data/cs.json').cs;
const registry = iothub.Registry.fromConnectionString(connectionString);
var deviceStatus = null;

let q_online = "SELECT * FROM devices WHERE tags.state = 'ONLINE'";
let q_all = "SELECT * FROM devices";

var query1 = registry.createQuery(q_online, 100);
var query2 = registry.createQuery(q_all, 100);
var online = [];
var all = [];

var onlineResults = function (err, results) {
  online = [];
  if (err) {
    console.error('Failed to fetch the results: ' + err.message);
  } else {
    // Do something with the results
    results.forEach(function (twin) {
      online.push(twin.deviceId)
    });

    if (query1.hasMoreResults) {
      query1.nextAsTwin(onlineResults);
    }
  }
};

var allResults = function (err, results) {
  all = [];
  if (err) {
    console.error('Failed to fetch the results: ' + err.message);
  } else {
    // Do something with the results
    results.forEach(function (twin) {
      if (!twin.tags.hasOwnProperty('state')) {
        twin.tags.state = 'OFFLINE'
      }
      all.push({
        "id": twin.deviceId,
        "status": twin.tags.state
      })
    });
  }
};

function wait(timeout) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, timeout)
  })
}

function getStatus(id) {
  return new Promise((resolve, reject) => {
    registry.getTwin(id, (err, twin) => {
      if (err) {
        console.log('error:' + err.name)
        reject(err);
      } else {
        console.log(twin.tags)
        let status = (twin.tags.state == undefined) ? 'OFFLINE' : twin.tags.state;
        resolve(status);
      }
    });
  });
}

router.get('/:id', async (req, res) => {
  let {
    id
  } = req.params;

  try {
    switch (id) {
      case 'all':
        console.time('query registry ALL took')
        query2.nextAsTwin(allResults);
        console.timeEnd('query registry ALL took')

        await wait(1000); // ouch this is super ugly
        res.status(200).send({
          devices: all
        });
        break;
      case 'online':
        console.time('query registry ONLINE took')
        query1.nextAsTwin(onlineResults);
        console.timeEnd('query registry ONLINE took')

        console.log('ONLINE');
        await wait(1000); // ouch this is super ugly
        res.status(200).send({
          devices: online
        });

        break;
      default:
        console.log('checking: ' + id);
        deviceStatus = await getStatus(id);
        console.log('status: ' + deviceStatus);

        res.status(200).send({
          status: deviceStatus
        })
        break;
    }
  } catch (error) {
    console.log(`${id}: ${error}`);
  }
})

module.exports = router;