const fs = require('fs');
var path = require('path');
var root = path.join(__dirname);

fs.readFile(root+'counter.txt',"utf-8",(err,data)=>{
    if(err){
        console.log(err);
    }
    else{
         console.log(data);

    }

});
