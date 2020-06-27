import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

export class S3Service {
  constructor(
    private readonly s3 = createS3(),
    private readonly bucketName = process.env.TODO_ATTACHMENTS_S3_BUCKET,
    private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION
  ) {}

  getAttachmentUrls(todoId: string): [string, string] {
    const uploadUrl = this.s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: todoId,
      Expires: this.urlExpiration
    })
    const attachmentUrl = `https://${this.bucketName}.s3.amazonaws.com/${todoId}`
    return [uploadUrl, attachmentUrl]
  }
}

function createS3() {
  return new XAWS.S3({
    signatureVersion: 'v4'
  })
}
