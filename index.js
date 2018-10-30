const serverless = require('serverless-http');
const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');

const app = express();

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
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

module.exports.handler = serverless(app);