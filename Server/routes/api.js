const express = require('express');
const router = express.Router();

const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://Angular:jz0pXKkBrcv0668M@yuno-shard-00-00-vxsxf.mongodb.net:27017,yuno-shard-00-01-vxsxf.mongodb.net:27017,yuno-shard-00-02-vxsxf.mongodb.net:27017/test?ssl=true&replicaSet=Yuno-shard-0&authSource=admin";
// const url = 'mongodb://Yuno:Password@localhost:27017';

router.get('/', (req, res) => {
    res.send('From API route');
});

router.get('/nodewar/:id', (req, res) => {
    let userData = req.params.id;
    
    MongoClient.connect(url, (err, client) => {
        const col = client.db("UserInformation").collection("NodeWarList");
        col.find({ JoinString: userData }).toArray((err, items) => {
            if (err) {
                console.log('There was an error ' + err);
            } else {
                if (!items) {
                    res.status(404).send('Nodewar does not exists');
                } else {
                    res.status(200).send(items);
                }
            }
            client.close();
        });
    });
});

router.get('/userlist/:id', (req, res) => {
    let userData = req.params.id;
    
    MongoClient.connect(url, (err, client) => {
        const col = client.db("UserInformation").collection("UserList");
        col.find({UserGuildId: userData}).toArray((err, items) => {
            if (err) {
                console.log('There was an error ' + err);
            } else {
                if (!items) {
                    res.status(404).send('Nodewar does not exists');
                } else {
                    res.status(200).send(items);
                }
            }
            client.close();
        });
    });
});

module.exports = router;