'use strict'
//const path = require('path');
//const fs = require('fs');
const mongoosePaginate = require('mongoose-pagination');
const User = require('../models/user');
const Follow = require('../models/follower');

function saveFollow(req, res){
    var params = req.body;
    var follow = new Follow();

    follow.user = req.user.sub;
    follow.followed = params.followed;

    follow.save((err, followedStored) =>{
        if(err) return res.status(500).send({message:"No se pudo guardar el follow"});
        if(!followedStored) return res.status(404).send({message:"El seguimiento no se ha guardado"});
        return res.status(200).send({follow:followedStored})
    });

}

function deleteFollow(req,res){
    var userId = req.body.sub;
    var followId = req.params.id;

    Follow.find({'user':userId, "followed":followId}).remove(err=>{
        if(err) return res.status(500).send({message:"No se pudo eliminar el follow"});
        return res.status(200).send({message:"Se elimino correctamente el follow"});
    })
}

function getFollowingdUsers(req,res){
    var userId = req.user.sub;
    if(req.params.id && req.params.page){
        userId = req.params.id;
    }
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }else{
        page = req.params.id;
    }
    var itemsPerPage = 4;
    Follow.find({'user':userId}).populate({path:'followed'}).paginate(page,itemsPerPage,(err, follows, total)=>{
        if(err) return res.status(500).send({message:"Usuario seguido no encontrado"});
        if(!follows) return res.status(404).send({message:"No esta siguiendo ningun usuario"});
        return res.status(200).send({
            total:total,
            pages: Math.ceil(total/itemsPerPage),
            follows
        })
    })
}
function getFollowedUsers(req,res){
    var userId = req.user.sub;
    if(req.params.id && req.params.page){
        userId = req.params.id;
    }
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }else{
        page = req.params.id;
    }
    var itemsPerPage = 4;
    //Follow.find({followed:userId}).populate('user followed').paginate(page,itemsPerPage,(err, follows, total)=>{
        Follow.find({followed:userId}).populate('user followed').paginate(page,itemsPerPage,(err, follows, total)=>{ 
        if(err) return res.status(500).send({message:"Usuario seguido no encontrado"});
        if(!follows) return res.status(404).send({message:"No esta siguiendo ningun usuario"});
        return res.status(200).send({
            total:total,
            pages: Math.ceil(total/itemsPerPage),
            follows
        })
    })
}
//Usuarios listados
function getMyFollows(req,res){
    var userId = req.user.sub
    
    var find = Follow.find({user:userId});
    if(req.params.followed){
        find = Follow.find({followed:userId})
    }
    find.populate('user followed').exec((err, follows)=>{
        if(err) return res.status(500).send({message:"Error en el servidor"});
        if(!follows) return res.status(500).send({message:"No esta siguiendo ningun usuario"});
        return res.status(200).send({follows})
    })
}

module.exports = {
    saveFollow,
    deleteFollow,
    getFollowingdUsers,
    getFollowedUsers,
    getMyFollows
}