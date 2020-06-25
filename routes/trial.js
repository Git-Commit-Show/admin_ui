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
   // obs.send('SetTextGDIPlusProperties',{"source":"Announcements","text":"No,Dont Do it"},);
    /*obs.sendCallback('SetTextGDIPlusProperties',{},(err,data)=>{
      console.log(data);
      if(err){
        console.log(err);
      }
    });*/
    var i= 0;
    while(i<=1)
    {
    obs.sendCallback('SetVolume',{source:"Claps",volume:i},(err,data)=>{
      console.log(data);
      if(err){
        console.log(err);
      }
    });
    obs.sendCallback('GetVolume',{source:"Claps"},(err,data)=>{
      console.log(data);
      if(err){
        console.log(err);
      }
    });
    i=i+0.1;
  }
    obs.sendCallback('GetSourceSettings',{"sourceName":"clps"},(err,data)=>{
      console.log(data);
      if(err){
        console.log(err);
      }
    });
    /*for(i=-80;i<=max_vol;i=i+10){
      obs.send('SetVolume',{"source":"MasterClass1","volume":i}).catch((err)=>{console.log(err);});
    }*/
    //obs.sendCallback('GetSourceSettings',{"sourceName":"try"},(err,data)=>{console.log(data);});
})

  .catch(err => { // Promise convention dicates you have a catch on every chain.
    response.send("Couldnt connect to OBS Studio"+ JSON.stringify(err));
  });
 