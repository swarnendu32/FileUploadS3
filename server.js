const express = require("express");
const multer = require("multer");
const { S3Client, PutObjectCommand,  } = require("@aws-sdk/client-s3");
const { LambdaClient, InvokeCommand, InvokeAsyncCommand } = require("@aws-sdk/client-lambda");

const app = express();
const port = 3000;

// Configure AWS S3 credentials (replace with your credentials)
const s3Client = new S3Client({
    region: "us-east-1",
    credentials: {
        accessKeyId: "AKIAUZO7XDANW5NIONV6",
        secretAccessKey: "QNrQC5WacOBrAy2oFVQLi4gX1KbKCUiDILkMnydA",
    },
});

const lambdaClient = new LambdaClient({
    region: "us-east-1",
    credentials: {
        accessKeyId: "AKIAUZO7XDANW5NIONV6",
        secretAccessKey: "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",
    },
});

// Configure Multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(), // Store files in memory for direct upload to S3
    limits: { fileSize: 1024 * 1024 * 1024 }, // Limit file size to 1GB
});

// Upload function
async function uploadToS3(file) {
    try {
        const params = {
            Bucket: "sourcemcbucket",
            Key: file.originalname, // Use original filename
            Body: file.buffer,
            ContentType: file.mimetype,
        };

        const command = new PutObjectCommand(params);
        await s3Client.send(command);
        console.log("File uploaded successfully!");
    } catch (error) {
        console.error("Error uploading file:", error);
        // Handle errors appropriately, e.g., send error response to client
    }
}

// POST route for file upload
app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).send("No file uploaded");
        }

        if (!file.originalname.endsWith(".mp4")) {
            return res.status(400).send("Only MP4 files are allowed");
        }
        await uploadToS3(file);
        const params = {
            FunctionName: "testFunction",
            InvocationType: "RequestResponse",
            Payload: JSON.stringify({ file: file.originalname }),
        };
        const response = await lambdaClient.send(new InvokeCommand(params));
        console.log(response)
        res.send("Upload and Transcode successful!");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error uploading file");
    }
});

app.post("/check", async (req, res) => {
    try {
        // const params = {
        //     FunctionName: "testFunction",
        //     InvocationType: "RequestResponse",
        //     Payload: JSON.stringify({ file: "20221107_093624.mp4" }),
        // };
        // const response = await lambdaClient.send(new InvokeCommand(params));
        // console.log(JSON.parse(response))
        // res.send(JSON.parse(response))
        res.send("Hello from AWS")
    } catch (e) {
        console.log(e);
        res.status(500).send("Something went wrong!");
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
