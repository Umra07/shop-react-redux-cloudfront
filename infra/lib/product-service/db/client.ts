import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"

export const PRODUCTS_TABLE_NAME = "products"
export const STOCK_TABLE_NAME = "stock"

export const DYNAMO_DB = new DynamoDBClient({ region: process.env.AWS_REGION })
export const DYNAMO_DB_CLIENT = DynamoDBDocumentClient.from(DYNAMO_DB)