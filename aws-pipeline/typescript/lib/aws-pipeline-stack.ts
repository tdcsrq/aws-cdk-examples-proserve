import * as cdk from '@aws-cdk/core';

// Resource-specific classes to support provisioning the pipeline
import { CodeCommitService } from './services/codeCommitService';
import { CodeBuildService } from './services/codeBuildService';
import { CodePipelineService } from './services/codePipelineService';
import { S3Service } from './services/s3Service';

export class AwsPipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Assumption: A file named codecommit-skeleton/gitskeleton.zip exists within
    // a bucket named 'cdk99-my-artifacts-manual'. This can be anything, but
    // for this demo, the zip file contains a bare bones create-react-app application.
    const codeCommitService = new CodeCommitService();
    const codeRepo = codeCommitService.createRepoWithBranch(this, 'automated-repo-one', 'automated-repo-one',
            'My CDK-generated CodeCommit Repository', 'main', 'cdk99-my-artifacts-manual',
            'codecommit-skeleton/gitskeleton.zip')


    // See lib/resources/buildspec.json for a sample CodeBuild specification.
    // The sample installs, tests, and packages the React app mentioned in the previous step
    const codeBuildService = new CodeBuildService();
    const buildProject = codeBuildService.createPipelineBuildProject(this, 'buildservice-one',
            'myProject', './lib/resources/buildspec.json');


    // Create S3 buckets for both the development and production environments
    const s3Service = new S3Service();
    const devBucket = s3Service.createBucket(this, 'automated-pipeline-s3-dev', 'automated-pipeline-cdk99-dev');
    const prodBucket = s3Service.createBucket(this, 'automated-pipeline-s3-prod', 'automated-pipeline-cdk99-prod');

    // Alternative: Specify buckets that were previously created as part of building the infrastructure
    // Note that either the bucket name or the bucket ARN can be used. For clarity, the ARN is recommended
    // const devBucket  = s3.Bucket.fromBucketName(this, 'BucketByName', 'my-bucket');
    // const prodBucket = s3.Bucket.fromBucketArn(this, 'BucketByArn', 'arn:aws:s3:::my-bucket');


    // Create the base pipeline. This includes both the CodeCommit and CodeBuild stages
    const codePipelineService = new CodePipelineService();
    codePipelineService.createPipeline(this, 'automated-pipeline-one', 'automated-pipeline-one',
      codeRepo, buildProject);
    
    // For dev, deploy to an S3 bucket in the target dev environment
    codePipelineService.addS3DeploymentStage(this, 'deploy2dev', 'deploy2dev', devBucket);

    // Production pushes should be manually triggered
    // Note: The email address is optional - either include a "real" email address, or omit the parameter
    codePipelineService.addManualCheck(this, 'manualprodcheck', 'manualprodcheck', 'pipelineSnsTopic' /*, 'someEmailAddress' */);
    codePipelineService.addS3DeploymentStage(this, 'deploy2prod', 'deploy2prod', prodBucket);
  }
}
