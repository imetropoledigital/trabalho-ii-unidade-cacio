const express = require('express');
const bodyParser = require('body-parser');
const { projectionFieldsToProjection } = require('./utils');
const { MongoClient, ObjectID } = require("mongodb");

const uri = "mongodb://mongodb:27017";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

let database;

async function connectToMongoDB() {
  try {
    await client.connect();
    database = client.db("trabalhoii");
    console.log("Connected successfully to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1);
  }
}

// GET /:collection/ - Fetch multiple documents
app.get('/:collection/', async (req, res) => {
  try {
    const { collection } = req.params;
    const { query, fields, skip, limit } = req.query;

    const filterQuery = query ? JSON.parse(query) : {};
    const projectionFields = fields || '';
    const projection = projectionFieldsToProjection(projectionFields);

    const pageSkip = skip ? parseInt(skip) : 0;
    const pageLimits = limit ? parseInt(limit) : 0;
    const pagination = {
      skip: pageSkip,
      limit: pageLimits,
    };

    const data = await database.collection(collection).find(filterQuery, { projection, ...pagination }).toArray();
    res.send(data);
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: "Error fetching data" });
  }
});

// GET /:collection/:id - Fetch a single document by ID
app.get('/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;

    if (!ObjectID.isValid(id)) {
      return res.status(400).send({ message: "Invalid ID format" });
    }

    const data = await database.collection(collection).findOne({ _id: ObjectID(id) });

    if (!data) {
      return res.status(404).send({ message: "Document not found" });
    }

    res.send(data);
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: "Error fetching the document" });
  }
});

// POST /:collection/ - Insert a new document
app.post('/:collection/', async (req, res) => {
  try {
    const { collection } = req.params;
    const data = req.body;

    const result = await database.collection(collection).insertOne(data);

    res.status(201).send(result.ops);
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: "Error inserting the document" });
  }
});

// PUT /:collection/:id - Update a document
app.put('/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    const updateData = req.body;

    if (!ObjectID.isValid(id)) {
      return res.status(400).send({ message: "Invalid ID format" });
    }

    const result = await database.collection(collection).updateOne(
      { _id: ObjectID(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Document not found" });
    }

    res.send({ message: "Document updated successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: "Error updating the document" });
  }
});

// DELETE /:collection/:id - Delete a document
app.delete('/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;

    if (!ObjectID.isValid(id)) {
      return res.status(400).send({ message: "Invalid ID format" });
    }

    const result = await database.collection(collection).deleteOne({ _id: ObjectID(id) });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "Document not found" });
    }

    res.send({ message: "Document deleted successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: "Error deleting the document" });
  }
});

// Start the server after connecting to MongoDB
connectToMongoDB().then(() => {
  app.listen(port, () => {
    console.log(`App listening on port ${port}`);
  });
});
