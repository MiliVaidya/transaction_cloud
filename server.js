const express = require("express");
const { BlobServiceClient } = require("@azure/storage-blob");
const config = require("./config");

const app = express();
const port = process.env.PORT || 3000;

// Initialize configuration and Azure clients
let blobServiceClient;
let containerClient;

async function initializeApp() {
  try {
    // Initialize configuration
    const configuration = await config.initialize();

    // Initialize Azure Storage clients
    blobServiceClient = BlobServiceClient.fromConnectionString(
      configuration.azureStorageConnectionString
    );
    containerClient = blobServiceClient.getContainerClient(
      configuration.azureStorageContainerName
    );

    // Start the server
    app.listen(configuration.port, () => {
      console.log(`Transaction app running on port ${configuration.port}`);
      console.log(
        `Environment: ${config.isProduction ? "Production" : "Development"}`
      );
    });
  } catch (error) {
    console.error("Failed to initialize application:", error);
    process.exit(1);
  }
}

app.use(express.json());
app.use(express.static("public"));

async function uploadBlob(blobName, data) {
  try {
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.upload(data, data.length);
    return { success: true, message: `Blob ${blobName} uploaded successfully` };
  } catch (error) {
    console.error("Error uploading blob:", error);
    return { success: false, error: error.message };
  }
}

// Helper function to convert stream to string
async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => {
      chunks.push(data.toString());
    });
    readableStream.on("end", () => {
      resolve(chunks.join(""));
    });
    readableStream.on("error", reject);
  });
}

// API endpoints for blob operations
app.post("/upload", async (req, res) => {
  const { blobName, data } = req.body;
  const result = await uploadBlob(blobName, data);
  res.json(result);
});

app.get("/download/:blobName", async (req, res) => {
  const { blobName } = req.params;
  const result = await downloadBlob(blobName);
  res.json(result);
});

app.get("/list", async (req, res) => {
  const result = await listBlobs();
  res.json(result);
});

app.delete("/delete/:blobName", async (req, res) => {
  const { blobName } = req.params;
  const result = await deleteBlob(blobName);
  res.json(result);
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/process", (req, res) => {
  const { accountNumber, amount } = req.body;
  console.log(`Transaction for Account ${accountNumber}: $${amount}`);
  res.json({ status: "success", message: "Transaction processed!" });
});

// Initialize the application
initializeApp();
