import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// Set your AWS region
AWS.config.update({ region: 'eu-north-1' }); // e.g., 'us-east-1'

const dynamodb = new AWS.DynamoDB.DocumentClient();

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
}

interface Stock {
  product_id: string;
  count: number;
}

async function fillData() {
  // Create test products
  const products: Product[] = [
    {
      id: uuidv4(),
      title: 'Product 1',
      description: 'Description for product 1',
      price: 100,
    },
    {
      id: uuidv4(),
      title: 'Product 2',
      description: 'Description for product 2',
      price: 200,
    },
    {
      id: uuidv4(),
      title: 'Product 3',
      description: 'Description for product 3',
      price: 100,
    },
    {
      id: uuidv4(),
      title: 'Product 4',
      description: 'Description for product 4',
      price: 200,
    },
    {
      id: uuidv4(),
      title: 'Product 5',
      description: 'Description for product 5',
      price: 100,
    },
    {
      id: uuidv4(),
      title: 'Product 6',
      description: 'Description for product 6',
      price: 200,
    },
  ];

  const stock: Stock[] = [
    {
      product_id: products[0].id,
      count: 10,
    },
    {
      product_id: products[1].id,
      count: 5,
    },
    {
      product_id: products[2].id,
      count: 123,
    },
    {
      product_id: products[3].id,
      count: 2,
    },
    {
      product_id: products[4].id,
      count: 0,
    },
    {
      product_id: products[5].id,
      count: 50,
    },
  ];

  for (const product of products) {
    await dynamodb
      .put({
        TableName: 'products',
        Item: product,
      })
      .promise();
  }

  for (const item of stock) {
    await dynamodb
      .put({
        TableName: 'stock',
        Item: item,
      })
      .promise();
  }
}

fillData()