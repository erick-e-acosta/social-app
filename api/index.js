'use strict'
const mongoose = require('mongoose');
const app = require('./app');
var port = 3800;
mongoose.set('useFindAndModify', false);
mongoose.Promise = global.Promise;

mongoose.connect('mongodb://localhost:27017/social_app',{ useNewUrlParser:true, useUnifiedTopology: true } )
.then(()=>{
    console.log("DB IS CONNECTED MEAN SOCIAL APP");
    //create server
    app.listen(port, ()=>{
        console.log("server running in http://localhost:3800"); 
    });
}).catch(err => console.error(err));

/*
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/social_app',{useMongoClient:true})
    .then(()=>{
    console.log("CONEXION OK");
    })
    .catch(err => console.log(err));

*/