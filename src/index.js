import express from 'express';
import cors from "cors";
import {MongoClient} from 'mongodb';
import dotenv from "dotenv"
dotenv.config()


const app = express();
app.use(cors());
app.use(express.json());
const mongoClient = new MongoClient(process.env.MONGO_URI)
let db
mongoClient.connect().then(() => {
	db = mongoClient.db("batepapouol");
});


app.post("/participants", (req, res) => {
    const { name } = req.body

    if(!name) {
        res.sendStatus(422)
        return;
    }

    res.sendStatus(201)
})

app.get("/participants", (req, res) => {
    

    res.send(participantes)
})

app.post("/messages", (req, res) => {
    

    res.sendStatus(201)
})


app.listen(5000, () => console.log("Listening on 5000"));