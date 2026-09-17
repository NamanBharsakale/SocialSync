import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3, S3_BUCKET } from "./s3.js";

export const uploadToS3 = async (
    buffer: Buffer,
    key: string,
    contentType: string
): Promise<string> => {
    await s3.send(
        new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        })
    );

    return key;
};