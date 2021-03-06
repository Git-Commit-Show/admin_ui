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
var redis = require('redis');
const url = require('url');
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

var redis_host = process.env.REDIS_HOST;
var redis_port = process.env.REDIS_PORT;
var redis_password = process.env.REDIS_PASSWORD;
var client = redis.createClient(redis_port,redis_host,redis_password);

client.on('connect', function() {
  console.log('connected');
});

app.use(bodyParser.urlencoded({extended : false}));
app.use(bodyParser.json());
app.set('views', path.join(__dirname,'..','views'));
//login
app.get('/', function(req, res) {
	res.render('login.ejs',{message:""});
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
        response.render('login',{message:"Incorrect Username and/or Password!"});
            }
        }else{
          response.render('login',{message:"Please enter both username and password"});
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
      console.log("Couldnt connect to OBS Studio"+ JSON.stringify(err));
      response.render('index',{message:"OBS not connected",StreamingStatus:"OBS not connected",scenes_details:[],currentScene:null});
    }); 
  	} else {
		response.redirect('/');
  }
});

//open webpage
app.get('/connect',isAuthenticated, function(req, res) {

   obs.sendCallback('GetStreamingStatus',{},(err,data)=>{
    if(data.streaming==false){
      
      res.render('index',{message:"",StreamingStatus:"Not Streaming",scenes_details:[],currentScene:null});
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
          res.render('index',{message:"",StreamingStatus:"Streaming",scenes_details:scenes,currentScene:currentScene});
        }
      });
    } 
  })


});

//start streaming
app.get('/start',isAuthenticated,function(req,res){
  var msg = "";
  obs.sendCallback('StartStreaming',{},(err)=>{
    if(err)
    {
      console.log(err);
      if(err.code=="NOT_CONNECTED"){
        res.render('index',{message:err.description,StreamingStatus:"OBS Not Connected",scenes_details:[],currentScene:[]});
      }
      else if(err.error=="streaming already active"){
        msg=err.error;
      }
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
      res.render('index',{message:msg,StreamingStatus:"Streaming",scenes_details:scenes,currentScene:currentScene});
    }
  });
});
});

//stop streaming
app.get('/stop',isAuthenticated,function(req,res){  
  var msg="";
  obs.sendCallback('StopStreaming', (error) => {
    if(error){
        console.log(error);
        if(error.code=="NOT_CONNECTED"){
          res.render('index',{message:error.description,StreamingStatus:"OBS Not Connected",scenes_details:[],currentScene:[]});
        }
        else if(error.error=="streaming not active"){
          msg=error.error;
        }
    }
  });
  //obs.on('StreamStopping',()=>{console.log("Stopping...")});
  obs.on('StreamStopped',()=>{
    res.render('index',{message:"",StreamingStatus:"Not Streaming",scenes_details:[],currentScene:null});
  });
});

//change scenes
app.get('/scenes/:scene',isAuthenticated,function(req,res){
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
 
app.all('/configuration/livestream/live_link',isAuthenticated,function(req,res){
  client.lrange('configuration:livestream:live', 0, -1, function(err, reply) {
    res.send(reply);
});
});
app.get('/configuration/livestream/attendee_link',isAuthenticated,function(req,res){
  client.lrange('configuration:livestream:attendee', 0, -1, function(err, reply) {
    res.send(reply);
});
});
app.get('/livestream/new_link',isAuthenticated,function(req,res){
  const queryObject = url.parse(req.url,true).query;
  let link = queryObject['link'];
  client.rpush('configuration:livestream:live',link,function(err,reply){
    if(err)
    {
      console.log(err);
    }
  });
  //let count1 = "live"+queryObject['count'];
  //console.log(count1);
  //client.set(count1,link);
  res.redirect('/users');
});
app.get('/livestream/new_attendee_link',isAuthenticated,function(req,res){
  const queryObject = url.parse(req.url,true).query;
  let link = queryObject['link'];
  client.rpush('configuration:livestream:attendee',link,function(err,reply){
    if(err)
    {
      console.log(err);
    }
  });
  /*let count1 = "attendee"+queryObject['count'];
  client.set(count1,link);*/
  res.redirect('/users');
});

app.get('/configuration/livestream/live_settings',isAuthenticated,function(req,res){
  total_reply={}
  client.lrange('configuration:livestream:live_settings:HandsRaised', 0, -1, function(err, reply) {
    total_reply['HandsRaised']=reply;
    
});
client.lrange('configuration:livestream:live_settings:ClapsRaised', 0, -1, function(err, reply) {
  total_reply['ClapsRaised']=reply;
});
client.lrange('configuration:livestream:live_settings:Questions:questions', 0, -1, function(err, reply) {
  total_reply['questions']=reply;
});
client.lrange('configuration:livestream:live_settings:Questions:time', 0, -1, function(err, reply) {
  total_reply['time']=reply;
});
client.lrange('configuration:livestream:live_settings:CurrentlyWatching', 0, -1, function(err, reply) {
  total_reply['CurrentlyWatching']=reply;
  res.send(total_reply);
});
});

//sound of claps
app.get('/counter',isAuthenticated,function(req,res){
 

//var i= 0;
obs.send('SetMute',{source:"Claps",mute:false});
/*(async()=>
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
})();*/
(async()=>
{obs.sendCallback('SetVolume',{source:"Claps",volume:0.9},(err,data)=>{
  console.log(data);
  if(err){
    console.log(err);
  }
});
await sleep(30000);
obs.send('SetMute',
  {
    source:"Claps",
    mute:true
  }).catch((error)=>
  {
  console.log(error);
  });
})();
res.redirect('/connect');
});

//post announcements
app.get('/post',isAuthenticated,function(req,res){
  const queryObject = url.parse(req.url,true).query;
  var announcements = queryObject['announcements'];
  
  obs.sendCallback('SetTextGDIPlusProperties',{"source":"Announcements",
  "text":announcements+ "      "},(err)=>{
  if(err.code=="NOT_CONNECTED")
  {
    res.render('index',{message:err.description,StreamingStatus:"OBS Not Connected",scenes_details:[],currentScene:[]});
  }
  else{
    res.redirect('/connect');
  }
});
});
app.get('/remove',isAuthenticated,function(req,res){
  obs.send('SetTextGDIPlusProperties',
  {"source":"Announcements",
  "text":""
}).catch((err)=>{
  res.send(err);
});
res.redirect('/connect');
});
//mute/unmute scenes
app.post('/mute',isAuthenticated,function(req,res){
  const queryObject = url.parse(req.url,true).query;
  var source = queryObject['source'];
  obs.sendCallback('SetMute',{source:source,mute:true},(err)=>{
    if(err)
    {
      console.log(err);
      if(err.code=="NOT_CONNECTED"){
        res.render('index',{message:err.description,StreamingStatus:"OBS Not Connected",scenes_details:[],currentScene:[]});
      }
    }
    else{
      res.redirect('/connect');
    }
  });
});

//Update upcoming talks
app.post('/updatetalks',isAuthenticated,function(req,res){
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
app.get('/claps',function(req,res)
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
function isAuthenticated(req, res, next) {
  // do any checks you want to in here

  // CHECK THE USER STORED IN SESSION FOR A CUSTOM VARIABLE
  // you can do this however you want with whatever variables you set up
  if (req.session.loggedin)
      return next();

  // IF A USER ISN'T LOGGED IN, THEN REDIRECT THEM SOMEWHERE
  res.redirect('/');
}

module.exports = app;
