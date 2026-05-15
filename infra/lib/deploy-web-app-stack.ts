import { Stack, type StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DeploymentService } from './deployment-service';

interface DeployWebAppStackProps extends StackProps {
  apiDomainName: string;
}
export class DeployWebAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: DeployWebAppStackProps) {
    super(scope, id, props);

    new DeploymentService(this, 'deployment', { apiDomainName: props.apiDomainName });
  }
}