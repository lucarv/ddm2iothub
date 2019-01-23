const express = require('express');
const router = express.Router();
const chalk = require('chalk')
const iothub = require('azure-iothub');
const Gateway = require('azure-iot-multiplexing-gateway').Gateway;
const gateway = new Gateway();
var Message = require('azure-iot-common').Message;

var addDevicePromises = [];
const connectionString = require('../data/cs.json').cs;
const registry = iothub.Registry.fromConnectionString(connectionString);
var devices = [];

const main = () => {
  registry.list(function (err, devicesList) {
    if (err)
      return err;
    else {
      devicesList.forEach((device) => {
        devices.push(device.deviceId)
      });
      startgw();
    }
  });

}
const startgw = async function () {

  let name = 'startgw';
  console.time('Open tunnel took');
  try {
    await gateway.open(connectionString);
    console.timeEnd('Open tunnel took');
    if (devices.length > 0) {
      devices.forEach((deviceId) => {
        addDevicePromises.push(gateway.addDevice(deviceId));
      });
      console.log(chalk.blue(`${devices.length} devices already provisioned`))
      console.time('Add devices took');
      await Promise.all(addDevicePromises);
      console.timeEnd('Add devices took');
      console.log('--------------------------------------------------------')
    }
  } catch (error) {
    console.log(`${name}: ${error}`);
  }
};

const addDevice = async function (id) {
  let name = 'addDevice';
  try {
    addDevicePromises.push(gateway.addDevice(id));
    console.time('Add new device took');
    await Promise.all(addDevicePromises);
    console.timeEnd('Add new device took');
    console.log('--------------------------------------------------------')
  } catch (error) {
    console.log(`${name}: ${error}`);
  }
};

const delDevice = async function (id) {
  console.time('Delete device took')
  let name = 'delDevice';
  try {
    let detached = gateway.removeDevice(id);
    let index = addDevicePromises.indexOf(detached);
    if (index > -1) {
      addDevicePromises.splice(index, 1);
    }
    await Promise.all(addDevicePromises);
    console.timeEnd('Delete device took');
    console.log('--------------------------------------------------------')
  } catch (error) {
    console.log(`${name}: ${error}`);
  }
};

const sender = async function (device, message) {
  console.log(message.getData())
  console.time('Send message took');
  let name = 'sender';
  try {
    await gateway.sendMessage(device, message);
    console.log(chalk.green(`** message sent from ${device}`))
    console.timeEnd('Send message took');
    console.log('--------------------------------------------------------')
  } catch (error) {
    console.log(chalk.red(`** ${name}: ${error}`));
  }
}

router.post('/devices/:id', function (req, res, next) {
  var device = {
    deviceId: req.params.id
  };
  console.log('\n**creating device \'' + device.deviceId + '\'');
  registry.create(device, function (err, deviceInfo) {
    if (err) {
      res.status(500).send({
        error: err.message
      })
    } else {
      devices.push(device.deviceId);
      addDevice(device.deviceId)
      res.status(200).send(deviceInfo.deviceId + ' created');
    }
  });
});

router.delete('/devices/:id', function (req, res, next) {
  let id = req.params.id;
  const index = devices.findIndex(deviceId => deviceId === id);
  if (index > -1) {
    console.log('\n**deleting device \'' + id + '\'');

    registry.delete(id, function (err, deviceInfo) {
      if (err) {
        res.status(500).send({ error: err.message })
      } else {
        devices.splice(index, 1);
        delDevice(id)
        res.status(200).send(id + ' deleted');
      }
    });
  } else
    res.status(500).send(id + ' not provisioned');
});

router.post('/devices/:id/status/:status', function (req, res) {
  let id = req.params.id;
  const index = devices.findIndex(deviceId => deviceId === id);
  if (index > -1) {
    let message = new Message({
      deviceId: req.params.id,
      status: req.params.status
    });
    sender(id, message)
    res.status(200).send(id + ' status set to ' + req.params.status);
  } else
    res.status(500).send(id + ' not provisioned');
});

router.post('/messages/:id', function (req, res, next) {
  let id = req.params.id;
  const index = devices.findIndex(deviceId => deviceId === id);
  if (index > -1) {
    var message = new Message(JSON.stringify(req.body));

    sender(id, message)
    res.status(200).send('POST message: ' + req.params.id);
  } else
    res.status(500).send(id + ' not provisioned');
});


main();

module.exports = router;