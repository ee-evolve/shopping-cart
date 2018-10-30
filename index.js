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

app.get('/products/:productId', function (req, res) {
  const params = {
    TableName: PRODUCTS_TABLE,
    Key: {
      productId: req.params.productId,
    },
  };

  dynamoDb.get(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({error: "Invalid product ID"});
    }
    if (result.Item) {
      const {productId, name, price} = result.Item;
      res.json({ productId, name, price});
    } else {
      res.status(404).json({error: "Product not found"});
    }
  });
});

app.post('/products', function (req, res) {
  const {productId, name, price} = req.body;

  const params = {
    TableName: PRODUCTS_TABLE,
    Item: {
      productId: productId,
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