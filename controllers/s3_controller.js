import { S3 } from "@aws-sdk/client-s3"
import fs from "fs"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid';

const bucketParams = {
    ACL: 'public-read',
    Bucket: "49-space",
    Key: '',
    Body: '',
};

const s3Client = new S3({
    endpoint: "https://fra1.digitaloceanspaces.com",
    region: "us-east-1",
    credentials: {
        accessKeyId: 'DIOLLO23MITLHHEPPU2X',
        secretAccessKey: 'ETQVk27pRdvJwtYSnjfLxnMJh4n3BF3vK6NQ1P4mb8U',
        
    }
});

async function getFileStream(req, res, next) {

    if (req.tempPaths)
        for (const item of req.tempPaths) {
            var fileStream = fs.createReadStream(item.path)
            bucketParams.Key = `test/${uuidv4()}.${item.filename.split('.').pop()}`
            bucketParams.Body = fileStream
            bucketParams.ContentType = item.mimetype
            item.url = bucketParams.Key
            run().then(() => {
                fs.unlink(item.path, () => {
                    console.log('deleted')
                })
            })
        }
    return next();
}

export async function uploadSingleFile(item, deleteFile) {

    var fileStream = fs.createReadStream(item.path)
    bucketParams.Key = `main/${uuidv4()}.${item.filename.split('.').pop()}`
    bucketParams.Body = fileStream
    bucketParams.ContentType = item.mimetype

    run().then(() => {
        if (deleteFile == true) {
            fs.unlink(item.path, () => {
                console.log('deleted')
            })
        }
    })

    return bucketParams.Key
}
async function getFileStreamRelease(req, res, next) {

    if (req.tempPaths)
        for (const item of req.tempPaths) {
            var fileStream = fs.createReadStream(item.path)
            bucketParams.Key = `main/${uuidv4()}.${item.filename.split('.').pop()}`
            bucketParams.Body = fileStream
            bucketParams.ContentType = item.mimetype
            item.url = bucketParams.Key
            run().then(() => {
                fs.unlink(item.path, () => {
                    console.log('deleted')
                })
            })
        }
    return next();
}

const run = async () => {
    try {
        const data = await s3Client.send(new PutObjectCommand(bucketParams));
        console.log(
            "Successfully uploaded object: " +
            bucketParams.Bucket +
            "/" +
            bucketParams.Key
        );
        console.log(data)
        return data;
    } catch (err) {
        console.log("Error", err);
    }
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/');
    },

    filename: function (req, file, cb) {

        const filePath = 'files/' + uuidv4() + uuidv4() + path.extname(file.originalname)
        cb(null, filePath);

        if (!req.tempPaths) req.tempPaths = []
        req.tempPaths.push(
            {
                path: `./public/${filePath}`,
                filename: filePath.split('/').pop(),
                mimetype: path.extname(file.originalname).replace('.', '')
            }
        )
    }
});

export const downloadFiles = multer({ storage: storage })
export const uploadFiles = getFileStream

export const uploadFilesRelease = getFileStreamRelease
