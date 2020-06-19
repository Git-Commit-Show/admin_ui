var express = require('express');
var router = express.Router();
const OBSWebSocket = require('obs-websocket-js');
var fs = require('fs');
var path = require('path');
var filePath = path.join(__dirname,'../shared_files/counter.txt');
var filePath1 = path.join(__dirname,'../shared_files/announcements.txt');

const obs = new OBSWebSocket();
var scenes;
var currentScene;
obs.connect({
  address: 'localhost:4444',
  password: '0000'
})
.then(() => {
  console.log(`Success! We're connected & authenticated.`);
})
.catch(err => { // Promise convention dicates you have a catch on every chain.
  console.log(err);
});
router.get('/', function(req, res, next) {
  obs.sendCallback('GetStreamingStatus',{},(err,data)=>{
    if(data.streaming==false){
      res.render('index',{StreamingStatus:"Start Streaming",scenes_details:[],currentScene:null});
    }
    else{
      obs.sendCallback('GetSceneList', {}, (err, data) => {
        if(err)
        {
          console.log("Something went wrong!"+" "+err);
        }
        else{
          scenes = data['scenes'];
          currentScene = data['currentScene'];
          console.log('ScenesList:',data);
          res.render('index',{StreamingStatus:"Streaming",scenes_details:scenes,currentScene:currentScene});
        }
      });
    } 
  })
});
router.get('/start',function(req,res,next){
  obs.sendCallback('StartStreaming',{},(err)=>{
  })
  obs.sendCallback('GetSceneList', {}, (err, data) => {
    if(err)
    {
      console.log("Something went wrong!"+" "+err);
    }
    else{
      scenes = data['scenes'];
      currentScene = data['currentScene'];
      console.log('ScenesList:',data);
      res.render('index',{StreamingStatus:"Streaming",scenes_details:scenes,currentScene:currentScene});
    }
  });
});

router.get('/stop',function(req,res,next){  
  obs.sendCallback('StopStreaming', (error) => {
    console.log("stopped working");
  });
  res.render('index',{"StreamingStatus":"Start Streaming",scenes_details:scenes,scenes_details:scenes,currentScene:"MasterClass"});
});



router.get('/masterclass',function(req,res,next){
      obs.send('SetCurrentScene', {
        'scene-name': 'MasterClass'
    });
res.render('index',{"StreamingStatus":"Streaming",scenes_details:scenes,scenes_details:scenes,currentScene:"MasterClass"});
});
router.get('/showcase',function(req,res,next){
  obs.send('SetCurrentScene', {
    'scene-name': 'ShowCase'
});
res.render('index',{"StreamingStatus":"Streaming",scenes_details:scenes,scenes_details:scenes,currentScene:"ShowCase"});
});
router.get('/ques',function(req,res,next){
  obs.send('SetCurrentScene', {
    'scene-name': 'QuesAns'
});
res.render('index',{"StreamingStatus":"Streaming",scenes_details:scenes,scenes_details:scenes,currentScene:"Ques/Ans"});
});
router.get('/break',function(req,res,next){
  obs.send('SetCurrentScene', {
    'scene-name': 'Break'
});
res.render('index',{"StreamingStatus":"Streaming",scenes_details:scenes,scenes_details:scenes,currentScene:"Break"});
});
router.get('/counter',function(req,res,next){
  obs.send('SetCurrentScene', {
    'scene-name': 'stats'   
});
  fs.readFile(filePath, 'utf-8', function(err, data) { 
    if( !err ) 
        {
          console.log(data); 
        fs.writeFile(filePath, parseInt(data)+1, (err)=>{ 
            if( err ) { 
                throw err; 
            } 
        });} 
    else
        {throw err; }
}); 

res.render('index',{"StreamingStatus":"Streaming",scenes_details:scenes,scenes_details:scenes,currentScene:"stats"});
});
router.all('/post',function(req,res,next){
  obs.send('SetCurrentScene', {
    'scene-name': 'stats'   
});
  fs.writeFile(filePath1,req.body.announcements, (err)=>{ 
    if(err){
      console.log(err);
    }
});
res.render('index',{"StreamingStatus":"Streaming",scenes_details:scenes,scenes_details:scenes,currentScene:"stats"});
});
module.exports = router;
