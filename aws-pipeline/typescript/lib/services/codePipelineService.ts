import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import { PipelineProject } from '@aws-cdk/aws-codebuild';
import { IRepository } from '@aws-cdk/aws-codecommit';
import { Topic } from '@aws-cdk/aws-sns';

export class CodePipelineService {

  pipeline: codepipeline.Pipeline | null;
  buildArtifact: codepipeline.Artifact | null;

  constructor() {
    this.pipeline = null;
    this.buildArtifact = null;
  }

  createPipeline(owner: cdk.Construct, cdkId: string, pipelineName: string,
    repository: IRepository, buildProject: PipelineProject
    /*, snsNotificationTopicId: string,
    devTargetBucket: s3.Bucket, prodTargetBucket: s3.Bucket */): void {

    this.pipeline = new codepipeline.Pipeline(owner, cdkId, {
      pipelineName: pipelineName,
      crossAccountKeys: false
    });

    // Add the CodeCommit Stage
    const sourceOutput = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.CodeCommitSourceAction({
      actionName: 'CodeCommit',
      branch: 'main',
      repository: repository,
      output: sourceOutput
    });

    this.pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction]
    });

    // Add the CodeBuild Stage
    this.buildArtifact = new codepipeline.Artifact();
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'CodeBuild',
      project: buildProject,
      input: sourceOutput,
      outputs: [this.buildArtifact]
    });

    this.pipeline.addStage({
      stageName: 'Build',
      actions: [buildAction]
    });

  }

  addS3DeploymentStage(owner: cdk.Construct, actionName: string, stageName: string,
    targetBucket: s3.Bucket, inputArtifact?: codepipeline.Artifact | null) {

    if (!this.pipeline) {
      throw new Error("Pipeline is null. Please call createPipeline() first")
    }

    const curArtifact = (inputArtifact == null) ? this.buildArtifact : inputArtifact;
    if (!curArtifact) {
      throw new Error("The input for the deployment stage is null.")
    }

    const s3DeployAction = new codepipeline_actions.S3DeployAction({
      actionName: actionName,
      bucket: targetBucket,
      input: curArtifact
    });

    this.pipeline.addStage({
      stageName: stageName,
      actions: [s3DeployAction]
    });

  }

  addManualCheck(owner: cdk.Construct, actionName: string, stageName: string, snsTopicName: string, emailAddr? : string) {
 
    if (!this.pipeline) {
      throw new Error("Pipeline is null. Please call createPipeline() first")
    }

    let manualActionProps: codepipeline_actions.ManualApprovalActionProps = {
      actionName: actionName,
      additionalInformation: 'Please manually invoke this step',
      notificationTopic: new Topic(owner, snsTopicName)
    };

    if (emailAddr) {
      manualActionProps = Object.assign({}, {notifyEmails:[emailAddr]}, manualActionProps);
    }

    const manualAction = new codepipeline_actions.ManualApprovalAction(manualActionProps);

    this.pipeline.addStage({
      stageName: stageName,
      actions: [manualAction]
    });

  }
}