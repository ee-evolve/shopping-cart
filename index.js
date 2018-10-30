const serverless = require('serverless-http');
const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const uuid = require('uuid/v4');

const app = express();

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
const BASKETS_TABLE = process.env.BASKETS_TABLE;
const dynamoDb = new AWS.DynamoDB.DocumentClient();

app.use(bodyParser.json({strict: false}));

app.get('/', function (req, res) {
  res.send('Hello World!')
});

app.get('/products', function (req, res) {
  const candidateId = req.headers["candidate-id"];

  const params = {
    ExpressionAttributeValues: { ":v" : candidateId },
    FilterExpression: "candidateId = :v",
    TableName: PRODUCTS_TABLE
  };

  dynamoDb.scan(params, (error, result) => {
    if (error) {
      res.status(400).json({error: "No workie"});
    } else {
      res.json({results: result.Items.map( item => ({productId: item.productId, name: item.name, price: item.price}))});
    }
  });
});

app.get('/products/:productId', function (req, res) {
  const candidateId = req.headers["candidate-id"];

  const params = {
    ExpressionAttributeValues: { ":p" : req.params.productId, ":c" : candidateId },
    FilterExpression: "candidateId = :c",
    TableName: PRODUCTS_TABLE,
    KeyConditionExpression: "productId = :p"
  };

  dynamoDb.query(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({error: "Invalid product ID"});
    }
    else if (result.Items) {
      const {productId, name, price} = result.Items[0];
      res.json({ productId, name, price});
    } else {
      res.status(404).json({error: "Product not found"});
    }
  });
});

app.post('/products', function (req, res) {
  const candidateId = req.headers["candidate-id"];
  const {productId, name, price} = req.body;

  const params = {
    TableName: PRODUCTS_TABLE,
    Item: {
      productId: productId,
      candidateId: candidateId,
      name: name,
      price: price
    },
  };

  dynamoDb.put(params, (error) => {
    if(error) {
      console.log(error);
      res.status(400).json({ error: 'Cannot create product'});
    }
    res.json({ productId, name, price});
  });
});

app.get("/baskets", function (req,res) {
  const candidateId = req.headers["candidate-id"];

  const params = {
    ExpressionAttributeValues: { ":v" : candidateId },
    FilterExpression: "candidateId = :v",
    TableName: BASKETS_TABLE
  };

  dynamoDb.scan(params, (error, result) => {
    if (error) {
      res.status(400).json({error: "No workie"});
    } else {
      res.json({results: result.Items.map( item => ({basketId: item.basketId, basketItems: item.basketItems}))});
    }
  });
});

app.post("/baskets", function (req, res) {
  const candidateId = req.headers["candidate-id"];
  const basketId = uuid();

  const params = {
    TableName: BASKETS_TABLE,
    Item: {
      basketId: basketId,
      candidateId: candidateId,
      basketItems: []
    }
  }

  dynamoDb.put(params, (error) => {
    if(error) {
      console.log(error);
      res.status(400).json({ error: 'Cannot create basket'});
    } else {
      res.setHeader('Location', "/baskets/" + basketId);
      res.status(201).json({location: "/baskets/" + basketId});
    }
  })
});

module.exports.handler = serverless(app);