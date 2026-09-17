import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION;
const bucket = process.env.S3_BUCKET_NAME;

if (!region) {
    throw new Error("AWS_REGION environment variable is not set");
}

if (!bucket) {
    throw new Error("S3_BUCKET_NAME environment variable is not set");
}

export const s3 = new S3Client({
    region,
});

export const S3_BUCKET = bucket;