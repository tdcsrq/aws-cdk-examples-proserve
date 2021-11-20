import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';

// Base properties used for all buckets. (Ensure public access is always blocked)
const s3PropsBase: s3.BucketProps = {
    versioned: true,
    encryption: s3.BucketEncryption.S3_MANAGED,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    autoDeleteObjects: true
};

export class S3Service {

    constructor() {
    }

    createBucket(owner: cdk.Construct, cdkId: string, bucketName?: string) {
        const s3uploadProps = bucketName ? Object.assign({ bucketName: bucketName }, s3PropsBase) : s3PropsBase;
        const s3uploadBucket = new s3.Bucket(owner, cdkId, s3uploadProps);
        return s3uploadBucket;
    }

}