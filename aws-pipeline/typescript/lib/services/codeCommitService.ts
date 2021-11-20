import * as cdk from '@aws-cdk/core';
import * as codecommit from '@aws-cdk/aws-codecommit';

export class CodeCommitService {
    constructor() {

    }

    // Creates an empty CodeCommit repository. No branches are created, so this may not be an ideal starting point
    createRepo(owner: cdk.Construct, cdkId: string, repoName: string, repoDescr: string): codecommit.Repository {
        const repo = new codecommit.Repository(owner, cdkId, {
            repositoryName: repoName,
            description: repoDescr
        });
        return repo;
    }

    // Creates a repository with a branch. The details of the branch are:
    // branchName - the name of the branch. (It is recommended that 'main' be used)
    // S3 bucket / S3 key - the name and location of a zip file which contains the default contents
    //                      of the repo. This can be as simple as a single README.md file.
    createRepoWithBranch(owner: cdk.Construct, cdkId: string, repoName: string, repoDescr: string,
        branchName: string, templateS3Bucket: string, templateS3Key: string): codecommit.IRepository {

        const interimId = cdkId + "-cfn"
        const cfnRepo = new codecommit.CfnRepository(owner, interimId, {
            repositoryName: repoName,
            code: {
                branchName: branchName,
                "s3": {
                    bucket: templateS3Bucket,
                    key: templateS3Key
                }
            }
        });

        // Other components - such as a CodePipeline - will require a construct, so convert this back to a
        // high-level IRepository construct.
        const repo = codecommit.Repository.fromRepositoryArn(owner, cdkId, cfnRepo.attrArn);
        return repo;
    }
}