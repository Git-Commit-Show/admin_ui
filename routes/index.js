var express = require('express');
var session = require('express-session');
const OBSWebSocket = require('obs-websocket-js');
var fs = require('fs');
var path = require('path');
var bodyParser = require('body-parser');
var path = require('path');
const sleep = require('sleep-promise');
var speakers = require('../config/speakers.json');
const { router } = require('../app');
const { request } = require('http');
const { setTimeout } = require('timers');
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
	if (username == process.env.USER_ID && password==process.env.PASSWORD) {
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
      address: process.env.OBS_WEBSOCKET_ADDRESS,
      password: process.env.OBS_WEBSOCKET_PASSWORD
    })
    .then(() => {
      console.log(`Success! We're connected & authenticated.`);
      response.redirect("/connect");
    })
    .catch(err => { 
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
   });
   obs.send('SetCurrentScene', {
    'scene-name': req.params.scene})
    .catch((err)=>{console.log(err);
    });
    res.redirect('/connect');
});

//sound of claps
app.get('/counter',function(req,res){
  /*obs.send('SetSourceSettings',{
    'sourceName':"",
    "sourceType" : "",
    "sourceSettings":
    {
      "local_file" : "" 
    }    
});
 /* fs.readFile(filePath, 'utf-8', function(err, data) { 
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

res.render('index',{"StreamingStatus":"Streaming",scenes_details:scenes,scenes_details:scenes,currentScene:"stats"});*/
var i= 0;
obs.send('ToggleMute',{source:"Claps"});
(async()=>
{
  while(i<1)
{
obs.sendCallback('SetVolume',{source:"Claps",volume:i},(err,data)=>{
  console.log(data);
  if(err){
    console.log(err);
  }
});
await sleep(5000);
i=i+0.1;
}
})();
res.redirect('/connect');
});

//post announcements
app.all('/post',function(req,res){
  obs.send('SetTextGDIPlusProperties',
  {"source":"Announcement",
  "text":req.body.announcements+ "      "
}).catch((err)=>{
  res.send(err);
});
res.redirect('/connect');
});
app.all('/remove',function(req,res){
  obs.send('SetTextGDIPlusProperties',
  {"source":"Announcement",
  "text":""
}).catch((err)=>{
  res.send(err);
});
res.redirect('/connect');
});
//mute/unmute scenes
app.get('/mute',function(req,res){
  obs.send('SetMute',
  {
    "source":"Claps"
  }).catch((error)=>
  {
  console.log(error);
  });
  res.redirect('/connect');
});

//Update upcoming talks
app.all('/updatetalks',function(req,res){
  obs.send('SetSourceSettings',{"sourceName":"ShowcaseImage",
  "sourceSettings": {"file":speakers[(req.body.count1)-1].image}
})
  .catch((err)=>{console.log(err);});
  obs.send('SetSourceSettings',
  {"sourceName":"SpeakerIntroVideo",
  "sourceSettings": {"local_file":speakers[(req.body.count1)-1].video},
  "sourceType":'ffmpeg_source'})
  .catch((err)=>{console.log(err);});
  res.redirect('/connect');
});
var change_volume = 0;
//To change claps sound as per click
app.all('/claps',function(req,res)
{
  change_volume+=0.1;
  obs.send('ToggleMute',{source:"Claps"});
  obs.send('SetVolume',{source:"Claps",volume:change_volume},(err,data)=>{
    console.log(data);
    if(err){
      console.log(err);
    }
  }
  );
});

module.exports = app;
