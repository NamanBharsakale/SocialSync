import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, S3_BUCKET } from "./s3.js";

export const getS3PresignedUrl = async (
    key: string,
    expiresIn = 3600
): Promise<string> => {
    return getSignedUrl(
        s3,
        new GetObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
        }),
        { expiresIn }
    );
};