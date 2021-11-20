import * as cdk from '@aws-cdk/core';
import * as codebuild from '@aws-cdk/aws-codebuild';
import { Repository } from '@aws-cdk/aws-codecommit';
import * as fs from 'fs';
export class CodeBuildService {
  constructor() {

  }

  // Use this method if the project will be part of a CodePipeline pipeline. Inputs (source) and outputs (artifact) are handled differently
  createPipelineBuildProject(owner: cdk.Construct, cdkId: string, projectName: string, buildSpecFile: string): codebuild.PipelineProject {

    const specDetails = fs.readFileSync(buildSpecFile, 'utf-8');
    const buildSpecJson = JSON.parse(specDetails);
    const buildSpec = codebuild.BuildSpec.fromObject(buildSpecJson);

    const pipelineProject = new codebuild.PipelineProject(owner, cdkId, {
      projectName: projectName,
      buildSpec: buildSpec
    });
    return pipelineProject;
  }

  // Use this method for a stand-alone build project. For integration with CodePipeline, see createPipelineProject()
  createBuildProject(owner: cdk.Construct, cdkId: string, repository: Repository, buildSpecFile: string): codebuild.Project {

    // const inMemoryBuildSpec = codebuild.BuildSpec.fromObject({
    //   version: '0.2',
    //   phases: {
    //     build: {
    //       commands: [
    //         'echo "Hello, CodeBuild!"',
    //       ],
    //     },
    //   },
    // });

    const buildSpec = codebuild.BuildSpec.fromSourceFilename(buildSpecFile)

    const buildProject = new codebuild.Project(owner, cdkId, {
      source: codebuild.Source.codeCommit({ repository }),
      buildSpec: buildSpec
    });

    return buildProject;
  }
}