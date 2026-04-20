import { products } from "./products.js";

interface APIGatewayEvent {
  pathParameters?: Record<string, string | undefined> | null;
}

export const handler = async (event: APIGatewayEvent) => {
  const productId = event.pathParameters?.productId;
  const product = products.find((p) => p.id === productId);

  if (!product) {
    return {
      statusCode: 404,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "Product not found" }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(product),
  };
};
