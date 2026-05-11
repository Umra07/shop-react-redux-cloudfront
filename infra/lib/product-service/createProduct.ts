import { APIGatewayProxyHandler } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { DYNAMO_DB_CLIENT, PRODUCTS_TABLE_NAME, STOCK_TABLE_NAME } from './db/client';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { title, description, price, count } = body;

    if (!title || !price || typeof count !== 'number') {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ message: 'title, price, and count are required' }),
      };
    }

    const id = crypto.randomUUID();

    const product = {
      id,
      title,
      description,
      price,
    };

    await DYNAMO_DB_CLIENT.send(new PutCommand({
      TableName: PRODUCTS_TABLE_NAME,
      Item: product,
    }));

    const stock = {
      product_id: id,
      count,
    };

    await DYNAMO_DB_CLIENT.send(new PutCommand({
      TableName: STOCK_TABLE_NAME,
      Item: stock,
    }));

    return {
      statusCode: 201,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ...product, count }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Internal server error', error: (e as Error).message }),
    };
  }
};