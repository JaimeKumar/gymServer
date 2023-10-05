const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()
const uri = `mongodb+srv://jimTrack-user:${process.env.MONGO_PW}@jimtracker.jtdklby.mongodb.net/?retryWrites=true&w=majority`
const express = require('express');
const fs = require('fs').promises
const app = express();
const cors = require("cors");
app.use(cors());
app.use(express.json())

const newClient = async () => {
    const client = new MongoClient(uri)
    try {
        await client.connect()
        const db = client.db('JimTracker-db')
        const collection = db.collection('JimTracker-collection');
        return { client, collection };
    } catch (error) {
        return null;
    }
}

async function writeDB(newJSON) {
    try {
        const { client, collection } = await newClient()
        let id = newJSON._id;
        delete newJSON._id
        const updateOperation = {
            $set: newJSON
        };
        await collection.updateOne({_id: id}, updateOperation)
        client.close()
        return true
    } catch (err) {
        console.log('failed to write to db')
        return false
    }
}

async function readDB() {
    try {
        const { client, collection } = await newClient()
        const res = await collection.find({}).toArray()
        client.close()
        return res[0];
    } catch (err) {
        console.log('failed to read db')
        return null;
    }
}

async function checkForDayChange() {
    let currentdate = new Date();
    let date = currentdate.getDate();
    let log = await readDB()
    if (log.date !== date) {
        log.date = date;
        log.pos = log.pos + 1;
        log.newReps = 0;
        if (log.pos > log.cat.length-1) {
            log.pos = 0;
        }
        writeDB(log)
    }
}

checkForDayChange();

app.post('/addRep', async (req, res) => {
    let log = await readDB()
    log.newReps = log.newReps + req.body.amnt;
    let didUpdate = await writeDB(log);
    if (didUpdate) {
        res.json({newReps: log.newReps})
    }
})

app.get('/getInfo', async (req, res) => {
    let log = await readDB()
    res.json({cat: log.cat[log.pos], newReps: log.newReps})
})

app.post('/newWeight', async (req, res) => {
    let log = await readDB()
    log.cat[log.pos].weight = +req.body.weight;
    log.cat[log.pos].reps = +req.body.reps;
    writeDB(log)
    res.status(200).json(log.cat[log.pos])
})

app.post('/movePos', async (req, res) => {
    let log = await readDB()
    log.pos = (log.pos + req.body.amnt) % log.cat.length;
    console.log((log.pos + req.body.amnt) % (log.cat.length))
    let didUpdate = await writeDB(log);
    if (didUpdate) {
        res.json(log.cat[log.pos])
    }
})

app.listen(process.env.PORT || 4000, () => {
    console.log("server is listen");
});
