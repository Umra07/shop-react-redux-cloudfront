import { S3Event, S3Handler } from 'aws-lambda';
import { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import csv from 'csv-parser';

const s3 = new S3Client({ region: process.env.AWS_REGION });

export const handler: S3Handler = async (event: S3Event) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    const getObjectParams = {
      Bucket: bucket,
      Key: key,
    };

    try {
      const command = new GetObjectCommand(getObjectParams);
      const data = await s3.send(command);

      if (!data.Body) {
        console.log('No data.Body found');
        continue;
      }

      const stream = data.Body!.transformToWebStream();
      const nodeStream = require('stream').Readable.fromWeb(stream);

      await new Promise((resolve, reject) => {
        const results: Record<string, unknown>[] = [];
        nodeStream
          .pipe(csv())
          .on('data', (row: Record<string, unknown>) => {
            console.log('Parsed row:', row);
            results.push(row);
          })
          .on('end', () => {
            console.log('CSV parsing completed');
            resolve(results);
          })
          .on('error', (err: Error) => {
            console.error('CSV parsing error:', err);
            reject(err);
          });
      });

      const parsedKey = key.replace(/^uploaded\//, 'parsed/');
      await s3.send(new CopyObjectCommand({
        Bucket: bucket,
        CopySource: `${bucket}/${key}`,
        Key: parsedKey,
      }));
      await s3.send(new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }));
    } catch (err) {
      console.error('Error processing S3 event:', err);
    }
  }
};