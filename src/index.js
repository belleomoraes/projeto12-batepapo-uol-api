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
    res.send(participants.map((v) => ({ ...v, _id: undefined })));
  } catch {
    res.sendStatus(422);
  }
});

app.post("/messages", (req, res) => {
  const { to, text, type } = req.body;
  const from = req.headers.user;

  try {
    db.collection("messages").insertOne({
      to,
      text,
      type,
      from,
      time: "HH:MM:SS",
    });
    res.sendStatus(201);
  } catch {
    res.sendStatus(422);
  }
});

app.get("/messages", async (req, res) => {
  const { limit } = req.query;
  const user = req.headers.user;
  console.log(limit);

  try {
    const messagesList = await db.collection("messages").find().toArray();
    if (limit <= 0) {
      res.send(messagesList.map((v) => ({ ...v, _id: undefined })));
    }
    const filteredMessages = messagesList
      .filter((msg) => {
        if (
          msg.type === "message" ||
          msg.type === "status" ||
          (msg.type === "private_message" && (msg.from === user || msg.to === user))
        ) {
          return msg;
        }
      })
      .slice(-limit);
    res.send(filteredMessages.map((v) => ({ ...v, _id: undefined })));
  } catch {
    res.sendStatus(422);
  }
});

app.listen(5000, () => console.log("Listening on port 5000"));
