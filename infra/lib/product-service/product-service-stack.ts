import { Stack, StackProps, aws_dynamodb as dynamodb, RemovalPolicy, Duration, CfnOutput } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import * as path from 'path';
import { PRODUCTS_TABLE_NAME, STOCK_TABLE_NAME } from './db/client';

export class ProductServiceStack extends Stack {
  public readonly apiDomain: string;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const productsTable = new dynamodb.TableV2(this, "products", {
      tableName: PRODUCTS_TABLE_NAME,
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING
      },
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const stockTable = new dynamodb.TableV2(this, "stock", {
      tableName: STOCK_TABLE_NAME,
      partitionKey: {
        name: "product_id",
        type: dynamodb.AttributeType.STRING
      },
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const lambdaCode = lambda.Code.fromAsset(path.join(__dirname, './'));

    const getProductsList = new lambda.Function(this, 'getProductsList', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: Duration.seconds(5),
      handler: 'getProductsList.handler',
      code: lambdaCode,
      environment: {
        PRODUCTS_TABLE: PRODUCTS_TABLE_NAME,
        STOCK_TABLE: STOCK_TABLE_NAME
      }
    });

    const getProductsById = new lambda.Function(this, 'getProductsById', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: Duration.seconds(5),
      handler: 'getProductsById.handler',
      code: lambdaCode,
      environment: {
        PRODUCTS_TABLE: PRODUCTS_TABLE_NAME,
        STOCK_TABLE: STOCK_TABLE_NAME
      }
    });
    
    const createProduct = new lambda.Function(this, 'createProduct', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: Duration.seconds(5),
      handler: 'createProduct.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, './')),
      environment: {
        PRODUCTS_TABLE: PRODUCTS_TABLE_NAME,
        STOCK_TABLE: STOCK_TABLE_NAME
      }
    });


    const api = new apigateway.RestApi(this, 'ProductsApi', {
      restApiName: 'Product Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    productsTable.grantReadData(getProductsList);
    productsTable.grantReadData(getProductsById);
    productsTable.grantWriteData(createProduct);
    stockTable.grantReadData(getProductsList);
    stockTable.grantReadData(getProductsById);
    stockTable.grantWriteData(createProduct);

    const productsResource = api.root.addResource('products');
    productsResource.addMethod('GET', new apigateway.LambdaIntegration(getProductsList));
    productsResource.addMethod('POST', new apigateway.LambdaIntegration(createProduct));
    
    const productByIdResource = productsResource.addResource('{productId}');
    productByIdResource.addMethod('GET', new apigateway.LambdaIntegration(getProductsById));



    this.apiDomain = `${api.restApiId}.execute-api.${this.region}.amazonaws.com`;

    new CfnOutput(this, 'ProductsApiUrl', {
      value: api.url,
      description: 'Products API Gateway URL',
      exportName: 'ProductsApiUrl',
    });
  }
}
