'use strict'
const User = require('../models/user');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('../services/jwt');
const Publication = require('../models/publication')
const mongoosePaginate = require('mongoose-pagination');
var fs = require('fs');
var path = require('path');
const Follow = require('../models/follower');

//routes
//metodos de prueba
function home(req,res){
    res.status(200).send({
        message:"test action by Erick"
    })
}
//metodos de prueba
function pruebas (req,res){
    res.status(200).send({
        message:"accion de prueba desde el servidor Nodejs"
    })
}
//registro
function saveUser(req,res){
    var params = req.body;
    var user = new User();

        if(params.name && params.surname && params.nick && params.email && params.password){
            user.name = params.name;
            user.surname = params.surname;
            user.nick = params.nick;
            user.email = params.email;
            user.image = null;
            user.role = 'ROLE_USER';
            
            //controllar usuarios duplicados
            User.find( {$or:[
                {email:user.email.toLowerCase()},
                {nick:user.nick.toLowerCase()}
                
            ]}).exec((err,users)=>{
                if(err){
                    return res.status(500).send({message:"ERROR en la peticion de usuarios"});
                }
                if(users && users.length >= 1){
                    return res.status(200).send({message:"El usuario que intenta registrar ya existe"});
                }else{

            //cifrar contraseña y guardar los datos
            bcrypt.hash(params.password,null,null,(err,hash)=>{
                user.password =hash;
                user.save((err, userStored)=>{
                    if(err) return res.status(500)({message:"error al guardar usuario"});
                    if(userStored){
                        res.status(200).send({user:userStored});
                    }else{
                        res.status(404).send({message:"No se ha registrado el usuario"})
                    }
                }) 
             });
                }
            })
            
        }else{
            res.status(200).send({message:"envia todos los campos necesarios"
        }) 
    }
}
//login
function loginUser(req,res){
    var params = req.body;
    var email = params.email;
    var password = params.password;
    User.findOne({email:email},(err,user)=>{
        if(err) return res.status(500).send({message:"Error en la petición"});
        
        if(user){
            bcrypt.compare(password,user.password,(err,check)=>{
                if(check){
                    
                    if(params.gettoken){
                        return res.status(200).send({
                            token: jwt.createToken(user)
                        });

                    }else{
                        user.password = undefined;
                        return res.status(200).send({user});
                    }
                }else{
                    return res.status(404).send({message:"El usuario no ha podido ser identificado"});
                }
            });
        }else{
            return res.status(404).send({message:"El usuario no se ha podido identificar"});
        }
    })
}
//
function getUser(req,res) {
    var user_Id = req.params.id;
    User.findById(user_Id,(err,user)=>{
        if(err){
            return res.status(500).send({message:"error en la petición"});
        }
        if(!user) return res.status(404).send({message:"Usuario no existe"});

        followThisUser(req.user.sub, user_Id).then((value)=>{
            return res.status(200).send({
                user, 
                following: value.following,
                followed: value.followed
            });
        });
    })
    
}
//devolver un listado de usuarios paginados
async function followThisUser(identity_user_id,user_Id){
    var following = await Follow.findOne({"user":identity_user_id, 'followed':user_Id}).exec((err,follow)=>{
        if(err)return handleError(err)
        return follow;
    });
    var followed =  await Follow.findOne({"user":user_Id, 'followed':user_Id}).exec((err,follow)=>{
        if(err)return handleError(err)
        return follow;
    });
    return{
        following:following,
        followed:followed
    }
}

function getUsers(req,res) {
    var identity_user_id = req.user.sub;
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }
    var itemsPerPage = 5;
    User.find().sort('_id').paginate(page,itemsPerPage,(err,users,total)=>{
        if(err) return res.status(500).send({message:"error en la petición"});
        if(!users) return res.status(404).send({message:"No hay usuarios disponibles"});
        followUserId(identity_user_id).then((value)=>{
            return res.status(200).send({
                users,
                users_following:value.following,
                users_follow_me:value.followed,
                total,
                pages:Math.ceil(total/itemsPerPage)
            })

        })
    })
}

async function followUserId(user_Id){
    var following = await Follow.find({"user":user_Id}).select({'_id':0,'_v':0,'user':0}).exec((err, follows)=>{
        if(err) return res.status(500).send({message:"ERROR GARRAFAL"})
        return follows;
    });
    var followed = await Follow.find({"followed":user_Id}).select({'_id':0,'_v':0,'followed':0}).exec((err, follows)=>{
        if(err) return res.status(500).send({message:"ERROR GARRAFAL"})
        return follows;  
    });
    //procesar following ids
    var following_clean = [];
    following.forEach((follow)=>{
            following_clean.push(follow.followed);
    })
    //procesar followed ids
    var followed_clean = [];
    followed.forEach((follow)=>{
            followed_clean.push(follow.user);
    })

    return{
        following:following_clean,
        followed:followed_clean
    }
};

const getCounters = (req, res) => {
    let userId = req.user.sub;
    if(req.params.id){
        userId = req.params.id;      
    }
    getCountFollow(userId).then((value) => {
        return res.status(200).send(value);
    })
}
 
const getCountFollow = async (user_id) => {
    try{
        // Lo hice de dos formas. "following" con callback de countDocuments y "followed" con una promesa
        let following = await Follow.countDocuments({"user": user_id},(err, result) => { return result });
        let followed = await Follow.countDocuments({"followed": user_id}).then(count => count);
        // let publication = await Publication.count({'user':user_id}).exec((err,count)=>{
        //     if(err) return handleError(err);
        //     return count;
        // });

        let publication = await Publication.count({'user':user_id}).then(count=>count);
        return { following, followed , publication}
        
    } catch(e){
        console.log(e);
    }
}

function updateUser(req,res) {
    var userId = req.params.id;
    var update = req.body;
    // borrar propiedad password
    delete update.password;

    if(userId != req.user.sub){
        return res.status(500).send({message: "No tiene permisos de actualizar los datos de usuario"})
    }
    User.findByIdAndUpdate(userId,update,{new:true},(err,userUpdated)=>{
        if(err) return res.status(500).send({message: "Error en la petición"});
        if(!userUpdated) return res.status(404).send({message: "No se ha podido actualizar el usuario"});
        return res.status(200).send({user:userUpdated});
    })
    
}

function uploadImage(req, res) {
    var userId = req.params.id;
    if(userId != req.user.sub){
        return res.status(500).send({message: "No tiene permisos de actualizar los datos de usuario"})
    }
    if(req.files){
        var files_path = req.files.image.path;
        console.log(files_path);
        var file_split =files_path.split('/');
        console.log(file_split);
        var file_name =file_split[2];
        var ext = file_name.split('\.');
        var file_ext = ext[1];

        if(userId != req.user.sub){
            return  removeFilesOfUpload(res, files_path, 'No tienes permisos para actualizar los datos del usuario');
           
        }

        if(file_ext == "png" || file_ext == "jpg" || file_ext == "jpeg" || file_ext == "gif"){
            // actualizar documento de usuario logueado
            User.findByIdAndUpdate(userId,{image:file_name},{new:true},(err, userUpdated)=>{
                if(err) return res.status(500).send({message:"Error en la petición"});
                if(!userUpdated) return res.status(404).send({message: "No se ha podido actualizar el usuario"});
                return res.status(200).send({user:userUpdated});
            })
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
    var path_file = './uploads/users/'+image_file; 
    fs.exists(path_file,(exists)=>{
        if(exists){
            res.sendFile(path.resolve(path_file));
        }else{
            res.status(200).send({message:"No existe la imagen..."})
        }
    })
    
}


module.exports = {
    home,
    pruebas,
    saveUser,
    loginUser,
    getUser,
    getUsers,
    getCounters,
    updateUser,
    uploadImage,
    getImageFile
}

