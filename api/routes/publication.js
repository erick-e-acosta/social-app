'use strict'

var express = require('express');
var PublicactionController = require('../controllers/publication');
var api = express.Router();
var md_auth = require('../midelwares/authenticated');

var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir: './uploads/publications'});

api.get('/probando-pub', md_auth.ensureAuth, PublicactionController.probando);
api.post('/publication', md_auth.ensureAuth, PublicactionController.savePublication);
api.get('/publications/:page?', md_auth.ensureAuth, PublicactionController.getPublications);
api.delete('/delete-publication/:id', md_auth.ensureAuth, PublicactionController.deletePublication);
api.post('/upload-image-pub/:id',[md_auth.ensureAuth, md_upload], PublicactionController.uploadImage)
api.get('/get-image-pub/:imageFile', PublicactionController.getImageFile);

module.exports = api;