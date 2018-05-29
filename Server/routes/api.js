const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const db = 'mongodb://Yuno:Password@localhost:27017'
// Need to create a user on the nodewarlist database

const nodeWarSchema = require('../models/nodewarModel');

mongoose.connect(db, err => {
    if (err) {
        console.error('Error ' + err);
    } else {
        console.log('Connected to database');
    }
});

router.get('/', (req, res) => {
    res.send('From API route');
});

router.post('/nodewar', (req, res) => {
    let userData = req.body;
    console.log(userData);
    console.log(userData.code);

    nodeWarSchema.findOne({ JoinString: userData.code }, (error, user) => {
        if (error) {
            console.log('There was an error ' + error);
        } else {
            if (!user) {
                res.status(404).send('Nodewar does not exists');
                console.log(user);
            } else {
                res.status(200).send(user);
                console.log(user);
            }
        }
    });
});

module.exports = router;