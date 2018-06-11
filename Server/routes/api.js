const express = require('express');
const router = express.Router();

const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://Angular:jz0pXKkBrcv0668M@yuno-shard-00-00-vxsxf.mongodb.net:27017,yuno-shard-00-01-vxsxf.mongodb.net:27017,yuno-shard-00-02-vxsxf.mongodb.net:27017/test?ssl=true&replicaSet=Yuno-shard-0&authSource=admin";
// const url = 'mongodb://Yuno:Password@localhost:27017';

router.get('/', (req, res) => {
    res.send('From API route');
});

router.post('/nodewar', (req, res) => {
    let userData = req.body;
    const dbName = 'NodeWarList';
    
    MongoClient.connect(url, (err, client) => {
        const adminDb = client.db(dbName).admin();
        const col = client.db(dbName).collection(userData.GuildId);
        col.find({ JoinString: userData.code }).toArray((err, items) => {
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

router.post('/userlist', (req, res) => {
    let userData = req.body;
    const dbName = 'UserLists';
    
    MongoClient.connect(url, (err, client) => {
        const adminDb = client.db(dbName).admin();
        const col = client.db(dbName).collection(userData.GuildId);
        col.find({ }).toArray((err, items) => {
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