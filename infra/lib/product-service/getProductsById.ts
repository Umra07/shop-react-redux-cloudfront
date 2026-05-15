import { DYNAMO_DB_CLIENT, PRODUCTS_TABLE_NAME, STOCK_TABLE_NAME } from "./db/client";
import { GetCommand } from "@aws-sdk/lib-dynamodb"

interface APIGatewayEvent {
  pathParameters?: Record<string, string | undefined> | null;
}

export const handler = async (event: APIGatewayEvent) => {
  const productId = event.pathParameters?.productId;

  if (!productId) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: "Missing productId in path." }),
    };
  }

  try {
    const productResult = await DYNAMO_DB_CLIENT.send(
      new GetCommand({
        TableName: PRODUCTS_TABLE_NAME,
        Key: { id: productId },
      })
    );

    if (!productResult.Item) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ message: "Product not found." }),
      };
    }

    const stockResult = await DYNAMO_DB_CLIENT.send(
      new GetCommand({
        TableName: STOCK_TABLE_NAME,
        Key: { product_id: productId },
      })
    );

    const joinedProduct = {
      ...productResult.Item,
      count: stockResult.Item?.count ?? 0,
    };

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(joinedProduct),
    };
  } catch(e) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: "Internal server error", e }),
    };
  }
};
