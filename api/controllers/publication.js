'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Publication = require('../models/publication');
var User = require('../models/user');
var Follow = require('../models/follower');

function probando(req,res){
    res.status(200).send({message:"probando desde el fichero publication"});
}

function savePublication(req, res){
    var params = req.body;
    if(!params.text) return res.status(200).send({message:'Debes enviar un texto'})
    var publication = new Publication();
    publication.text = params.text;
    publication.file = null;
    publication.created_at = moment().unix();
    publication.save((err,publicationStored)=>{
        if(err) return res.status(500).send({message:'Error al guardar la publicacion'})
        if(!publicationStored) return res.status(404).send({message:'La publicacion no ha sido guardad'})
        return res.status(200).send({publication:publicationStored})
    })
}

function getPublications(req, res) {
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }
    var itemsPerPage = 4;
    Follow.find({user:req.user.sub}).populate('followed').exec((err,follows)=>{
        if(err) return res.status(500).send({message:'Error al devolver el seguimiento'})
        var follows_clean=[];
        follows.forEach((follow)=>{
            follows_clean.push(follow.followed);
        })
        Publication.find({user:{"$in":follows_clean}}).sort('-created_at').populate('user').paginate(page,itemsPerPage,(err,publications,total)=>{
            if(err) return res.status(500).send({message:'Error al devolver publicacion'})
            if(!publications) return res.status(404).send({message:'No hay publicacion'})
            return res.status(200).send({
                total_items:total,
                pages:Math.ceil(total/itemsPerPage),
                page:page,
                publications
            })
        })
        
    })
}

function getPublication(req, res) {
    var publicationId = req.params.id;
    Publication.findById(publicationId, (err, publication)=>{
        if(err) return res.status(500).send({message:'Error al devolver publicaciones'})
        if(!publication) return res.status(404).send({message:'No existe la publicacion'})
        return res.status(200).send({publication})
    })
}
function deletePublication(req, res){
    var publicationId = req.params.id;
    var userId =  req.body.sub;
    Publication.find({'user':userId, '_id': publicationId}).exec((err, publicationRemoved) =>{
        if(err) return res.status(500).send({message:"No se pudo eliminar la publicacion"});
        if(!publicationRemoved) return res.status(404).send({message:'No se ha borrado la publicacion'})
        return res.status(200).send({publication:publicationRemoved});
    })
}
function uploadImage(req, res) {
    var publicationId = req.params.id;
    if(req.files){
        var files_path = req.files.image.path;
        console.log(files_path);
        var file_split =files_path.split('/');
        console.log(file_split);
        var file_name =file_split[2];
        var ext = file_name.split('\.');
        var file_ext = ext[1];

        if(file_ext == "png" || file_ext == "jpg" || file_ext == "jpeg" || file_ext == "gif"){
            Publication.findOne({'user':req.body.sub, '_id':publicationId}).exec((err, publication)=>{
                console.log("AQUI GILIPOYAS",publication);
                if(publication){
                    // actualizar documento de usuario logueado
                    Publication.findByIdAndUpdate(publicationId,{file:file_name},{new:true},(err, publicationUpdated)=>{
                        if(err) return res.status(500).send({message:"Error en la petición"});
                        if(!publicationUpdated) return res.status(404).send({message: "No se ha podido actualizar el usuario"});
                        return res.status(200).send({publication:publicationUpdated});
                    })
                }else{
                    return removeFilesOfUpload(res,files_path, 'Extencion no valida');
                }
            });
                
        }else{
            // no se ha subido el fichero
            return removeFilesOfUpload(res,files_path, 'Extencion no valida');
        }
    }else{
        return res.status(200).send({message:"No se han subido archivos"});
    }
}

function removeFilesOfUpload(res, files_path, message){
    fs.unlink(files_path,(err)=>{
        return res.status(200).send({message:message});
    });
}

function getImageFile(req,res) {
    var image_file = req.params.imageFile;
    var path_file = './uploads/publications/'+image_file; 
    fs.exists(path_file,(exists)=>{
        if(exists){
            res.sendFile(path.resolve(path_file));
        }else{
            res.status(200).send({message:"No existe la imagen..."})
        }
    })
    
}

module.exports = {
    probando,
    savePublication,
    getPublications,
    getPublication,
    deletePublication,
    uploadImage,
    getImageFile
};