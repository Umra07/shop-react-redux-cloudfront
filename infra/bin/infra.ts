#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { DeployWebAppStack } from '../lib/deploy-web-app-stack';
import { ProductServiceStack } from "../lib/product-service/product-service-stack";

const app = new cdk.App();

const productServiceStack = new ProductServiceStack(app, "ProductServiceStack", {});

new DeployWebAppStack(app, 'InfraStack', {
  apiDomainName: productServiceStack.apiDomain,
});