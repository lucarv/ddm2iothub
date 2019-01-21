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

  console.log('execute query')
  if (err) {
    console.error('Failed to fetch the results: ' + err.message);
  } else {
    // Do something with the results
    results.forEach(function (twin) {
      online.push(twin)
    });

    if (query1.hasMoreResults) {
      query1.nextAsTwin(onlineResults);
    }
  }
};

var allResults = function (err, results) {
     all = [];

  console.log('execute query')
  if (err) {
    console.error('Failed to fetch the results: ' + err.message);
  } else {
    console.log('query executed')
    // Do something with the results
    results.forEach(function (twin) {
      console.log(twin.deviceId)
      if (!twin.tags.hasOwnProperty('state')) {
        twin.tags.state = 'OFFLINE'
      }
      all.push(twin)
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
        console.log(twin.deviceId)
        let status = twin.tags.state;
        resolve(status);
      }
    });
  });
}

router.post('/device', async (req, res) => {
  let id = req.body.deviceId;
  try {
    console.log('checking status of: ' + id);
    deviceStatus = await getStatus(id); // ouch this is super ugly
    console.log('deviceStatus')
    res.render('single', { id: id, status: deviceStatus })
  } catch (e) {
    res.render('error', {error: e });
  }

});

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

        await wait(500); // ouch this is super ugly
        res.render('all', {devices: all})
        break;
      case 'online':
        console.time('query registry ONLINE took')
        query1.nextAsTwin(onlineResults);
        console.timeEnd('query registry ONLINE took')

        console.log('ONLINE');
        await wait(1500); // ouch this is super ugly
        res.render('all', {devices: online})

        break;
      default:
        console.log('checkind status of: ' + id);
        deviceStatus = await getStatus(id); // ouch this is super ugly
        res.status(200).send({
          status: deviceStatus
        })
        break;
    }
  } catch (error) {
    console.log(`${id}: ${error}`);
  }
})



router.get('/', async (req, res) => {
  res.render('index', {
    title: 'Device Status',
    devices: online
  });
});
router.get('/online', (req, res) => {
  res.render('on', {
    title: 'Online Devices',
    devices: online
  });
});

router.get('/all', (req, res) => {
  res.render('all', {
    title: 'All Devices',
    devices: all
  });
});




module.exports = router;