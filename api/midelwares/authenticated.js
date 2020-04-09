'use strict'
const jwt = require('jwt-simple');
const moment = require('moment');
const secret = "clave_secreta_mean_app_angular";


exports.ensureAuth = function(req,res,next){
    if(!req.headers.authorization){
        return res.status(403).send({message:"la peticion no tiene la cabecera de autenticacion"});
    }
    
    var token = req.headers.authorization.replace(/['"]+/g, '');
    try {
        var payload = jwt.decode(token, secret);
        if(payload <= moment().unix()){
            return res.status(401).send({message:"token ha expirado"});
        }
    } catch (error) {
        return res.status(404).send({message:"el token no es válido"});
    }
    
    req.user = payload;
    next();
}