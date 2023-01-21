import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import { Cluster, ContainerImage, FargateService, FargateTaskDefinition } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancer, ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';
import path = require('path');

export interface AppStackProps extends StackProps {
  stageId: string
}

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);

    const { stageId } = props;

    const vpc = new Vpc(this, 'Vpc', {
      vpcName: `${stageId}Vpc`
    });

    const cluster = new Cluster(this, 'Cluster', {
      clusterName: `${stageId}Cluster`,
      vpc,
    });

    const asset = new DockerImageAsset(this, 'ContainerImage', {
      directory: path.join('../app/'),
    });

    const taskDefinition = new FargateTaskDefinition(this, 'TaskDefinition', {
      cpu: 256,
      memoryLimitMiB: 512,
    });

    taskDefinition.addContainer('Container', {
      image: ContainerImage.fromDockerImageAsset(asset),
      readonlyRootFilesystem: true,
      portMappings: [{
        containerPort: 3000,
      }],
    })

    const service = new FargateService(this, 'Service', {
      serviceName: `${stageId}Service`,
      taskDefinition,
      cluster,
    });

    const loadBalancer = new ApplicationLoadBalancer(this, 'LoadBalancer', {
      loadBalancerName: `${stageId}LoadBalancer`,
      vpc,
      internetFacing: true,
    });

    const listener = loadBalancer.addListener('Listener', {
      open: true,
      port: 3000,
      protocol: ApplicationProtocol.HTTP,
    });

    listener.addTargets('Target', {
      targetGroupName: `${stageId}TargetGroup`,
      port: 3000,
      protocol: ApplicationProtocol.HTTP,
      targets: [
        service,
      ],
    });

    new CfnOutput(this, 'ApplicationUrl', {
      value: `http://${loadBalancer.loadBalancerDnsName}:3000`,
    });
  }
}
