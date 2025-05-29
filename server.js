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

app.get("/transaction", (req, res) => {
  res.json({ status: "Transaction processed by mainframe." });
});
// API endpoints for blob operations
app.post("/upload", async (req, res) => {
  const { blobName, data } = req.body;
  const result = await uploadBlob(blobName, data);
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
