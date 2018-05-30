const express = require('express');
const router = express.Router();

const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://Yuno:Password@localhost:27017';

router.get('/', (req, res) => {
    res.send('From API route');
});

router.post('/nodewar', (req, res) => {
    let userData = req.body;
    const dbName = 'NodeWarList';
    // Connect using MongoClient
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
            console.log(items);
            client.close();
        });
    });
});

router.post('/userlist', (req, res) => {
    let userData = req.body;
    const dbName = 'UserLists';
    // Connect using MongoClient
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
            console.log(items);
            client.close();
        });
    });
});

module.exports = router;