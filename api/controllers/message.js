'use strict'

const moment = require('moment');
const mongosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follower');
var Message = require('../models/message');

function probando(req , res){
    res.status(200).send({message:"probando desde el archivo message"});
}
function saveMessage(req,res){
    var params = req.body;
    
    if(!params.text || !params.receiver) return res.status(200).send({message:"Envia los valores necesarios"});
   
        var message = new Message();
        message.emitter= req.user.sub;
        message.receiver= params.receiver;
        message.text = params.text;
        message.created_at = moment().unix();
        message.viewed = 'false'
    
        message.save((err, messageStored)=>{
            if(err) return res.status(500).send({message:"Error en la peticion"});
            if(!messageStored) return res.status(500).send({message:"Error al enviar la peticion"});
            return res.status(200).send({message:messageStored});
        })
    
}
function getReceivedMessages(req,res){
    var userId = req.user.sub;
    var page =1;
    if(req.params.page){
        page = req.params.page;
    }
    var itemsPerPage = 4;

    Message.find({receiver:userId}).populate('emitter','name surname _id nick image').paginate(page, itemsPerPage, (err, messages, total)=>{
        if(err) return res.status(500).send({message:"Error al emitir mensaje"});
        if(!messages) return res.status(404).send({message:"debe enviar un mensaje"});
        return res.status(200).send({
            total:total,
            pages: Math.ceil(total/itemsPerPage),
            messages
        })
    });
}

function getEmmitMessages(req,res){
    var userId = req.user.sub;
    var page =1;
    if(req.params.page){
        page = req.params.page;
    }
    var itemsPerPage = 4;

    Message.find({emitter:userId}).populate('emitter receiver','name surname _id nick image').paginate(page, itemsPerPage, (err, messages, total)=>{
        if(err) return res.status(500).send({message:"Error al emitir mensaje"});
        if(!messages) return res.status(404).send({message:"debe enviar un mensaje"});
        return res.status(200).send({
            total:total,
            pages: Math.ceil(total/itemsPerPage),
            messages
        })
    });
}

function getUnviewedMessages(req,res){
    var userId = req.user.sub;
    Message.find({receiver: userId, viewed:'false'}).exec((err,count)=>{
        if(err) return res.status(500).send({message:"Error en la peticio de unviewed"});
        return res.status(200).send({
            'unviewed': count
        });
    })

}

function setViewedMessages(req,res){
    var userId = req.params.sub;
    Message.update({receiver:userId, viewed:'false'},{viewed:'true'},{'multi':true},(err,messagesUpdated)=>{
        if(err) return res.status(500).send({message:"Error en la peticio"});
        return res.status(200).send({
            messages:messagesUpdated
        })

    })
}

module.exports={
    probando,
    saveMessage,
    getReceivedMessages,
    getEmmitMessages,
    getUnviewedMessages,
    setViewedMessages
};