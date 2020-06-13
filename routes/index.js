var express = require('express');
var router = express.Router();
const OBSWebSocket = require('obs-websocket-js');


const obs = new OBSWebSocket();
var scenes;

obs.connect({
  address: 'localhost:4444',
  password: '0000'
})
.then(() => {
  console.log(`Success! We're connected & authenticated.`);
  obs.sendCallback('GetSceneList', {}, (err, data) => {
    if(err)
    {
      console.log(err);
    }
    else{
      scenes = data['scenes'];
      console.log('ScenesList:',data);
    }
  });
})
.catch(err => { // Promise convention dicates you have a catch on every chain.
  console.log(err);
});
router.get('/', function(req, res, next) {
  res.render('index');
});
router.get('/start',function(req,res,next){
  
  obs.sendCallback('StartStreaming', (error) => {
    console.log("working");
  });
  res.redirect('/');
  
});

router.get('/stop',function(req,res,next){
  
  obs.sendCallback('StopStreaming', (error) => {
    console.log("stopped working");
  });
  res.redirect('/');
});



router.get('/masterclass',function(req,res,next){
  obs.on('SwitchScenes', (data) => {
    console.log(data);
  });
  res.redirect('/');
});
router.get('/showcase',function(req,res,next){
  obs.on('SwitchScenes', (data) => {
    console.log(data);
  });
  res.redirect('/');
});
router.get('/ques',function(req,res,next){
  obs.on('SwitchScenes', (data) => {
    console.log(data);
  });
  res.redirect('/');
});
router.get('/break',function(req,res,next){
  obs.on('SwitchScenes', (data) => {
    console.log(data);
  });
  res.redirect('/');
});


module.exports = router;
