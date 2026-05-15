import { APIGatewayProxyEvent } from 'aws-lambda';

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({})),
  PutObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

const mockGetSignedUrl = jest.fn();
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mockGetSignedUrl,
}));

import { handler } from '../importProductsFile';

const makeEvent = (name?: string): APIGatewayProxyEvent =>
  ({
    queryStringParameters: name ? { name } : null,
  } as unknown as APIGatewayProxyEvent);

describe('importProductsFile handler', () => {
  const BUCKET = 'test-bucket';

  beforeEach(() => {
    process.env.BUCKET_NAME = BUCKET;
    jest.clearAllMocks();
  });

  it('returns 400 when name query param is missing', async () => {
    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result).toMatchObject({
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing file name' }),
    });
  });

  it('returns 400 when queryStringParameters is null', async () => {
    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result).toMatchObject({ statusCode: 400 });
  });

  it('returns 200 with signed URL when name is provided', async () => {
    const signedUrl = 'https://s3.amazonaws.com/test-bucket/uploaded/test.csv?signature=abc';
    mockGetSignedUrl.mockResolvedValue(signedUrl);

    const result = await handler(makeEvent('test.csv'), {} as any, {} as any);

    expect(result).toMatchObject({
      statusCode: 200,
      body: JSON.stringify({ url: signedUrl }),
    });
  });

  it('places the file under the uploaded/ prefix', async () => {
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    mockGetSignedUrl.mockResolvedValue('https://signed-url');

    await handler(makeEvent('products.csv'), {} as any, {} as any);

    expect(PutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({ Key: 'uploaded/products.csv' })
    );
  });

  it('sets ContentType to text/csv', async () => {
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    mockGetSignedUrl.mockResolvedValue('https://signed-url');

    await handler(makeEvent('data.csv'), {} as any, {} as any);

    expect(PutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({ ContentType: 'text/csv' })
    );
  });

  it('uses the BUCKET_NAME env variable', async () => {
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    mockGetSignedUrl.mockResolvedValue('https://signed-url');

    await handler(makeEvent('data.csv'), {} as any, {} as any);

    expect(PutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({ Bucket: BUCKET })
    );
  });

  it('includes CORS headers in the 200 response', async () => {
    mockGetSignedUrl.mockResolvedValue('https://signed-url');

    const result = await handler(makeEvent('file.csv'), {} as any, {} as any) as any;

    expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(result.headers['Access-Control-Allow-Credentials']).toBe(true);
  });

  it('requests a signed URL that expires in 60 seconds', async () => {
    mockGetSignedUrl.mockResolvedValue('https://signed-url');

    await handler(makeEvent('file.csv'), {} as any, {} as any);

    expect(mockGetSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ expiresIn: 60 })
    );
  });
});
