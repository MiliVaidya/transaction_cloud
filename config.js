const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");

class Config {
  constructor() {
    this.isProduction = process.env.NODE_ENV === "production";
    this.config = {};
    this.keyVaultClient = null;

    if (this.isProduction) {
      const keyVaultName = process.env.KEY_VAULT_NAME;
      const keyVaultUrl = `https://${keyVaultName}.vault.azure.net`;
      const credential = new DefaultAzureCredential();
      this.keyVaultClient = new SecretClient(keyVaultUrl, credential);
    }
  }

  async getSecret(secretName) {
    if (this.isProduction) {
      try {
        const secret = await this.keyVaultClient.getSecret(secretName);
        return secret.value;
      } catch (error) {
        console.error(
          `Error fetching secret ${secretName} from Key Vault:`,
          error
        );
        throw error;
      }
    } else {
      // Local development - use environment variables
      return process.env[secretName];
    }
  }

  async initialize() {
    try {
      if (this.isProduction) {
        // Fetch secrets from Key Vault
        this.config.azureStorageConnectionString = await this.getSecret(
          "AZURE-STORAGE-CONNECTION-STRING"
        );
        this.config.azureStorageContainerName =
          (await this.getSecret("AZURE-STORAGE-CONTAINER-NAME")) ||
          "default-container";
      } else {
        // Use local environment variables
        this.config.azureStorageConnectionString =
          process.env.AZURE_STORAGE_CONNECTION_STRING;
        this.config.azureStorageContainerName =
          process.env.AZURE_STORAGE_CONTAINER_NAME || "default-container";
      }

      this.config.port = process.env.PORT || 3000;

      return this.config;
    } catch (error) {
      console.error("Error initializing configuration:", error);
      throw error;
    }
  }
}

module.exports = new Config();
