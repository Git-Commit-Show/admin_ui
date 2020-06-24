const OBSWebSocket = require('obs-websocket-js');
var fs = require('fs');
var path = require('path');
const obs = new OBSWebSocket();
obs.connect({

    address: "Localhost:4444",
    password: "0000"
  })
  .then(() => {
    console.log(`Success! We're connected & authenticated.`);
    var max_vol = 0.7;
    for(i=1;i<=max_vol;i=i+0.1){
      obs.send('SetVolume',{"source":"clps","volume":i});
    }
    //obs.sendCallback('GetSourceSettings',{"sourceName":"try"},(err,data)=>{console.log(data);});
})

  .catch(err => { // Promise convention dicates you have a catch on every chain.
    response.send("Couldnt connect to OBS Studio"+ JSON.stringify(err));
  });
 