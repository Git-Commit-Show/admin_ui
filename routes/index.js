var express = require('express');
var router = express.Router();
const OBSWebSocket = require('obs-websocket-js');
var fs = require('fs');
var path = require('path');
var root = path.join(__dirname);

const obs = new OBSWebSocket();
var scenes;
var currentScene;
obs.connect({
  address: 'https://www.paperspace.com/machine/psaqlqaw3',
  password: '0000'
})
.then(() => {
  console.log(`Success! We're connected & authenticated.`);
})
.catch(err => { // Promise convention dicates you have a catch on every chain.
  console.log(err);
});
router.get('/', function(req, res, next) {
  obs.sendCallback('GetSceneList', {}, (err, data) => {
    if(err)
    {
      console.log("Something went wrong!"+" "+err);
    }
    else{
      scenes = data['scenes'];
      currentScene = data['currentScene'];
      console.log('ScenesList:',data);
      res.render('index',{StreamingStatus:"Start Streaming",scenes_details:[],currentScene:null});
    }
  })
});
router.get('/start',function(req,res,next){
  
  obs.sendCallback('StartStreaming', (error) => {
  });
  res.render('index',{"StreamingStatus":"Streaming",scenes_details:scenes,scenes_details:scenes,currentScene:currentScene});
  
});

router.get('/stop',function(req,res,next){  
  obs.sendCallback('StopStreaming', (error) => {
    console.log("stopped working");
  });
  res.redirect('/');
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

/*fs.readFile(root+'‪\counter.txt',function(err,data){
   fs.writeFile(root+'\counter.txt',data+1, function (err) {
    if (err) throw err;
    console.log('Replaced!');
  });});*/
  console.log('File contents:' + Number(fs.readFileSync(root+'counter.txt')));
  //console.log(t);
  fs.readFile(root+'counter.txt', 'utf-8', function(err, data) { 
    // Write the data read from readeMe.txt 
    // to a file writeMe.txt
    if( !err ) 
        {
          console.log(data); 
        fs.writeFile(root+'counter.txt‪', data, (err)=>{ 
            if( err ) { 
                throw err; 
            } 
        });} 
    else
        {throw err; }
}); 

res.render('index',{"StreamingStatus":"Streaming",scenes_details:scenes,scenes_details:scenes,currentScene:"Break"});
});
module.exports = router;
