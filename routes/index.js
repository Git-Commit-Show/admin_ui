var express = require('express');
var session = require('express-session');
const OBSWebSocket = require('obs-websocket-js');
var fs = require('fs');
var path = require('path');
var bodyParser = require('body-parser');
var path = require('path');
var config1 = require('../config/login.json');
var speakers = require('../config/speakers.json');
const { router } = require('../app');
const { request } = require('http');
var obs_address = require('../config/obs.json');
var filePath = path.join(__dirname,'../shared_files/counter.txt');
var filePath1 = path.join(__dirname,'../shared_files/announcements.txt');
const obs = new OBSWebSocket();
var scenes;
var currentScene;

var app = express();
//Session
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: false
}));

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

//login
app.get('/', function(req, res) {
	res.render('login.ejs');
});
app.post('/auth', function(request, response) {
	var username = request.body.user_id;
    var password = request.body.password;
    if(username && password){
	if (username ==config1[0].Admin.user_id && password==config1[0].Admin.password) {
				request.session.loggedin = true;
				request.session.username = username;
				response.redirect('/users');
			} else {
				response.send('Incorrect Username and/or Password!');
            }
        }else{
            response.send("Please enter both username and password");
        }			
});

//connect to obs
app.get('/users', function(request, response) {
	if (request.session.loggedin) {
    obs.connect({
      address: obs_address[0].address, //Keep 0 for localhost address and 1 for remote server
      password: obs_address[0].password  //Keep 0 for localhost password and 1 for remote server
    })
    .then(() => {
      console.log(`Success! We're connected & authenticated.`);
      response.redirect("/connect");
    })
    .catch(err => { // Promise convention dicates you have a catch on every chain.
      response.send("Couldnt connect to OBS Studio"+ JSON.stringify(err));
    });
	} else {
		response.redirect('/');
  }
});

//open webpage
app.get('/connect', function(req, res) {
  if(req.session.loggedin){
  obs.sendCallback('GetStreamingStatus',{},(err,data)=>{
    console.log(data);
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
}
else{
  res.redirect('/');
}
});

//start streaming
app.get('/start',function(req,res){
  obs.sendCallback('StartStreaming',{},(err)=>{
    if(err)
    {
      console.log(err);
      res.send("Couldn't connect to the Socket!!<br>"+JSON.stringify(err));
    }
  });
  obs.on('StreamStarting',()=>{console.log("Connecting")});
  obs.on('StreamStarted',()=>{
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
});

//stop streaming
app.get('/stop',function(req,res){  
  obs.sendCallback('StopStreaming', (error) => {
    if(error){
    res.send("Couldn't Stop" + JSON.stringify(error));
    }
  });
  obs.on('StreamStopping',()=>{console.log("Stopping...")});
  obs.on('StreamStopped',()=>{
    res.render('index',{StreamingStatus:"Start Streaming",scenes_details:[],currentScene:null});
  });
});

//change scenes
app.get('/scenes/:scene',function(req,res){
   obs.sendCallback('GetCurrentScene',(err,data)=>{
     if(req.params.scene==data.name)
     {
       console.log('The current Scene is the same!!');
       res.redirect('/connect');
     }
     else{
     }
   });
   obs.send('SetCurrentScene', {
    'scene-name': req.params.scene})
    .catch((err)=>{console.log(err);
    });
    res.redirect('/connect');
});

//sound of claps
var volume_data = 0;
app.get('/counter',function(req,res){
  obs.send('SetSourceSettings',{
    'sourceName':"",
    "sourceType" : "",
    "sourceSettings":
    {
      "local_file" : "" 
    }    
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
obs.send('SetVolume',{
  'source':"claps1",
    "volume":volume_data
});
obs.on('SourceVolumeChanged',()=>{console.log("volume changed");});

res.render('index',{"StreamingStatus":"Streaming",scenes_details:scenes,scenes_details:scenes,currentScene:"stats"});

});

//post announcements
app.all('/post',function(req,res){
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

//mute/unmute scenes
app.get('/mute',function(req,res){
  obs.send('ToggleMute',
  {
    "source":"SpeakerIntroVideo"
  }).catch((error)=>
  {
  console.log(error);
  });
  res.redirect('/connect');
});

//Update upcoming talks
app.get('/updatetalks',function(req,res){
  obs.send('SetSourceSettings',{"sourceName":"SpeakerIntroVideo","sourceSettings": {"local_file":speakers[1].intro_video},"sourceType":'ffmpeg_source'}).catch((err)=>{console.log(err);});
  res.redirect('/connect');
});

module.exports = app;
