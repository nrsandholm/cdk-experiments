import { SecretValue, Stack, StackProps, Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { AppStack } from './app-stack';

class PipelineAppStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const appStack = new AppStack(this, 'AppStack', {
      stageId: id
    });
  }
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'FargatePipeline',
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub('nrsandholm/cdk-experiments', 'main', {
          authentication: SecretValue.secretsManager(this.node.tryGetContext('repo-auth-token-name'))
        }),
        commands: [
          'cd codepipeline-with-fargate/infra',
          'npm install',
          'npm run cdk synth',
        ],
        // Define this if you're not working at the root of the repo
        primaryOutputDirectory: 'codepipeline-with-fargate/infra/cdk.out',
      })
    });

    pipeline.addStage(new PipelineAppStage(this, "Development", {
      // env: { account: "111111111111", region: "eu-west-1" }
    }));
  }
}