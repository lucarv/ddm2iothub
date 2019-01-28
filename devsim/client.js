// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';
const request = require('request');
//const uri = 'http://hubproxy.northeurope.azurecontainer.io/messages/urn:ce408dcf-db88-4344-b690-42798d38506f:ddm-iot-hub-device'
const uri = 'http://localhost:3000/messages/ddm_dev_002'
const devices = require('./devices.json')

const startTele = () => {
  var loop = setInterval(function () {
        let tempVal = 10 + Math.random();
        let pressureVal = 1 + Math.random();
        let now = Date.now();

        let ipso = {
          "e": [{
            "n": "endpointId/3303/0/5700",
            "v": tempVal,
            "t": now
          }, {
            "n": "endpointId/3303/0/5700",
            "v": pressureVal,
            "t": now            
          }]

      }
      console.log("--------------------------------------------------------------------------------------------------------------------") 
      console.log(devices[0] + ' reporting values: { temperature: ' + ipso.e[0].v + '}') 
      request.post(uri, {
        form: JSON.stringify(ipso)
      })
    }, 1000);
};

startTele();
