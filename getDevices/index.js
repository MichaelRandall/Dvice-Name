const config = require("../sharedCode/config");

const databaseId = "dvc-mngmnt-db";
const containerId = "devices";

const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");
const { CosmosClient } = require("@azure/cosmos");

const keyVaultName = config.keyvaultname;

const keyVaultUri = `https://${keyVaultName}.vault.azure.net`;

const credential = new DefaultAzureCredential();
const secretClient = new SecretClient(keyVaultUri, credential);

module.exports = async function (context, req) {
  const endpoint = config.endpoint;

  const secretKey = await secretClient.getSecret("dvcnamingCosmosPKey");
  const key = secretKey.value;

  const client = new CosmosClient({ endpoint, key });

  const database = client.database(databaseId);
  const container = database.container(containerId);

  const querySpec = {
    query: "SELECT * from c",
  };

  const { resources: devices } = await container.items
    .query(querySpec)
    .fetchAll();

  const responseMessage = {
    status: "200",
    message: "Ok",
    devices: devices,
  };

  context.res = {
    // status: 200, /* Defaults to 200 */
    body: responseMessage,
  };
};
