const express = require('express');
const fs = require('fs').promises
const app = express();
const cors = require("cors");
app.use(cors());
app.use(express.json())

async function readFile() {
    let data = await fs.readFile('log.json', 'utf8')
    return JSON.parse(data)
}

async function updateLog(data) {
    if (Object.keys(data).length < 4) return;
    try {
        await fs.writeFile('log.json', JSON.stringify(data), 'utf8')
        return true;
    } catch (err) {
        return false;
        console.log(err)
    }
}

async function checkForDayChange() {
    let currentdate = new Date();
    let date = currentdate.getDate();
    let log = await readFile();
    if (log.date !== date) {
        log.date = date;
        log.pos = log.pos + 1;
        log.newReps = 0;
        if (log.pos > log.cat.length-1) {
            log.pos = 0;
        }
        updateLog(log)
    }
}

checkForDayChange();

app.post('/addRep', async (req, res) => {
    let log = await readFile()
    log.newReps = log.newReps + req.body.amnt;
    let didUpdate = await updateLog(log);
    if (didUpdate) {
        res.json({newReps: log.newReps})
    }
})

app.get('/getInfo', async (req, res) => {
    let log = await readFile()
    res.json({cat: log.cat[log.pos], newReps: log.newReps})
})

app.post('/newWeight', async (req, res) => {
    let log = await readFile()
    log.cat[log.pos].weight = +req.body.weight;
    log.cat[log.pos].reps = +req.body.reps;
    updateLog(log)
    res.status(200).json(log.cat[log.pos])
})

app.post('/movePos', async (req, res) => {
    let log = await readFile()
    log.pos = log.pos + req.body.amnt;
    let didUpdate = await updateLog(log);
    if (didUpdate) {
        res.json(log.cat[log.pos])
    }
})

app.listen(process.env.PORT || 4000, () => {
    console.log("server is listen");
});
