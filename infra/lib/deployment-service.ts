import {
  aws_cloudfront,
  aws_cloudfront_origins,
  aws_s3,
  aws_s3_deployment,
  CfnOutput,
  RemovalPolicy,
} from 'aws-cdk-lib';
import { BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

const path = './resources/build';

interface DeploymentServiceProps {
  apiDomainName: string;
}

export class DeploymentService extends Construct {
  constructor(scope: Construct, id: string, props: DeploymentServiceProps) {
    super(scope, id);

    const hostingBucket = new aws_s3.Bucket(this, 'FrontendBucket', {
      removalPolicy: RemovalPolicy.DESTROY,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true
    });

    const distribution = new aws_cloudfront.Distribution(
      this,
      'CloudfrontDistribution',
      {
        defaultBehavior: {
          origin: aws_cloudfront_origins.S3BucketOrigin.withOriginAccessControl(
            hostingBucket
          ),
          viewerProtocolPolicy: aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        defaultRootObject: 'index.html',
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
          },
        ],
      }
    );

    distribution.addBehavior('/prod/*', new aws_cloudfront_origins.HttpOrigin(props.apiDomainName), {
      allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_ALL,
      viewerProtocolPolicy: aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      cachePolicy: aws_cloudfront.CachePolicy.CACHING_DISABLED,
      originRequestPolicy: aws_cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
    });

    new aws_s3_deployment.BucketDeployment(this, 'BucketDeployment', {
      sources: [aws_s3_deployment.Source.asset(path)],
      destinationBucket: hostingBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    new CfnOutput(this, 'CloudFrontURL', {
      value: distribution.domainName,
      description: 'The distribution URL',
      exportName: 'CloudfrontURL',
    });

    new CfnOutput(this, 'BucketName', {
      value: hostingBucket.bucketName,
      description: 'The name of the S3 bucket',
      exportName: 'BucketName',
    });
  }
}