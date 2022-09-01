import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(() => {
  db = mongoClient.db("batepapouol");
});

app.post("/participants", async (req, res) => {
  const { name } = req.body;

  try {
    if (!name) {
      res.sendStatus(422);
      return;
    }

    db.collection("user").insertOne({ name, lastStatus: Date.now() });
    db.collection("messages").insertOne({
      from: name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: "HH:MM:SS",
    });
    res.sendStatus(201);
  } catch {
    res.sendStatus(422);
  }
});

app.get("/participants", async (req, res) => {
  try {
    const participants = await db.collection("user").find().toArray();
    res.send(participants.map(v => ({...v, _id: undefined})));
  } catch {
    res.sendStatus(422);
  }
});

app.post("/messages", (req, res) => {
  res.sendStatus(201);
});

app.listen(5000, () => console.log("Listening on 5000"));
