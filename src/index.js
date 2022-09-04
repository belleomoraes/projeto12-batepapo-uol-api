import express from "express";
import dayjs from "dayjs";
import cors from "cors";
import joi from "joi";
import { MongoClient, ObjectId } from "mongodb";
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

const userSchema = joi.object({
  name: joi.string().trim().required(),
});

const messagesSchema = joi.object({
  to: joi.string().trim().required(),
  text: joi.string().trim().required(),
  type: joi.string().valid("message", "private_message").required(),
});

async function removeInactiveUsers() {
  const participants = await db.collection("user").find().toArray();
  await participants
    .filter((inactive) => Date.now() - Number(inactive.lastStatus) > 10000)
    .map(async (inactive) => {
      try {
        const inactiveMessage = {
          from: inactive.name,
          to: "Todos",
          text: "sai da sala...",
          type: "status",
          time: dayjs().format("HH:mm:ss"),
        };
        db.collection("user").deleteOne(inactive);
        db.collection("messages").insertOne(inactiveMessage);
      } catch (error) {
        console.log(error);
      }
    });
}

setInterval(removeInactiveUsers, 15000);
app.post("/participants", async (req, res) => {
  const { name } = req.body;
  const validation = userSchema.validate(req.body, { abortEarly: false });
  const participants = await db.collection("user").find().toArray();
  const isUserExists = participants.find((v) => v.name === name);

  if (validation.error) {
    res.sendStatus(422);
    return;
  }

  if (isUserExists) {
    res.sendStatus(409);
    return;
  }

  try {
    db.collection("user").insertOne({ name, lastStatus: Date.now() });
    db.collection("messages").insertOne({
      from: name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: dayjs().format("HH:mm:ss"),
    });
    res.sendStatus(201);
  } catch (error) {
    res.sendStatus(500);
  }
});

app.get("/participants", async (req, res) => {
  try {
    const participants = await db.collection("user").find().toArray();
    res.send(participants);
  } catch (error) {
    res.sendStatus(422);
  }
});

app.post("/messages", async (req, res) => {
  const { to, text, type } = req.body;
  const from = req.headers.user;
  const validation = messagesSchema.validate(req.body, { abortEarly: false });
  const participants = await db.collection("user").find().toArray();
  const isUserExists = participants.find((v) => v.name === to);
  if (validation.error) {
    res.sendStatus(422);
    return;
  }

  if (!isUserExists) {
    res.sendStatus(422);
    return;
  }
  try {
    db.collection("messages").insertOne({
      to,
      text,
      type,
      from,
      time: dayjs().format("HH:mm:ss"),
    });
    res.sendStatus(201);
  } catch (error) {
    res.sendStatus(500);
  }
});

app.get("/messages", async (req, res) => {
  const { limit } = req.query;
  const user = req.headers.user;
  console.log(limit);

  try {
    const messagesList = await db.collection("messages").find().toArray();
    if (limit <= 0) {
      res.send(messagesList);
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
    res.send(filteredMessages);
  } catch (error) {
    res.sendStatus(500);
  }
});

app.post("/status", async (req, res) => {
  const user = req.headers.user;
  const participants = await db.collection("user").find().toArray();

  const isUserExists = participants.find((v) => v.name === user);
  if (!isUserExists) {
    res.sendStatus(404);
    return;
  }
  const idUser = isUserExists._id;
  try {
    await db.collection("user").updateOne({ _id: idUser }, { $set: { lastStatus: Date.now() } });
    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(500);
  }
});

app.listen(5000, () => console.log("Listening on port 5000"));
