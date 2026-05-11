import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { PRODUCTS_TABLE_NAME, STOCK_TABLE_NAME, DYNAMO_DB_CLIENT } from './db/client';

export const handler = async () => {
  try {
    const productsResult = await DYNAMO_DB_CLIENT.send(new ScanCommand({ TableName: PRODUCTS_TABLE_NAME }));
    const products = productsResult.Items || [];

    const stockResult = await DYNAMO_DB_CLIENT.send(new ScanCommand({ TableName: STOCK_TABLE_NAME }));
    const stock = stockResult.Items || [];

    const stockMap = new Map<string, number>();
    for (const s of stock) {
      stockMap.set(s.product_id, s.count);
    }

    const joined = products.map((product) => ({
      ...product,
      count: stockMap.get(product.id) ?? 0,
    }));

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(joined),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Internal server error', error }),
    };
  }
};
