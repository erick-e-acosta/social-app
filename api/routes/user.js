'use strict'

const express = require('express');
var UserController = require('../controllers/user');
var multipart = require('connect-multiparty');

var api = express.Router();
var md_auth = require('../midelwares/authenticated');
var md_upload = multipart({uploadDir:'./uploads/users'})


api.get('/home', UserController.home);
api.get('/pruebas',md_auth.ensureAuth, UserController.pruebas);
api.post('/register', UserController.saveUser);
api.post('/login', UserController.loginUser);
api.get('/user/:id', md_auth.ensureAuth, UserController.getUser);
api.get('/users/:page?', md_auth.ensureAuth, UserController.getUsers);
api.get('/counters/:id?', md_auth.ensureAuth, UserController.getCounters);
api.put('/update-user/:id', md_auth.ensureAuth, UserController.updateUser);
api.post('/upload-image-user/:id', [md_auth.ensureAuth,md_upload],UserController.uploadImage);
api.get('/get-image-file/:imageFile', UserController.getImageFile);

module.exports = api;