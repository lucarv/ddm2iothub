'use strict';

const express = require('express');
const router = express.Router();
const iothub = require('azure-iothub');
const connectionString = require('../data/cs.json').cs;
const registry = iothub.Registry.fromConnectionString(connectionString);
var online = [];
var all = []

let q_online = "SELECT * FROM devices WHERE tags.state = 'online'";
let q_all = "SELECT * FROM devices";

var query1 = registry.createQuery(qonline, 100);
var query2 = registry.createQuery(qall, 100);

var onlineResults = function (err, results) {
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
  console.log('execute query')
  if (err) {
    console.error('Failed to fetch the results: ' + err.message);
  } else {
    // Do something with the results
    results.forEach(function (twin) {
      console.log(twin.deviceId)
      if (!twin.tags.hasOwnProperty('state')) {
        twin.tags.state = 'offline'
      }
      all.push(twin)
    });

    if (query2.hasMoreResults) {
      query2.nextAsTwin(allResults);
    }
  }
};

router.get('/:id', async (req, res) => {
  const { id } = req.params
  const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id])
  res.send(rows[0])
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

query1.nextAsTwin(onlineResults);
query2.nextAsTwin(allResults);


module.exports = router;
