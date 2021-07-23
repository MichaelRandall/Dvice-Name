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

  const device = req.body;

  const { resource: newDevice } = await container.items.create(device);

  const responseMessage = {
    status: 200,
    message: "Ok",
    device: newDevice,
  };

  context.res = {
    // status: 200, /* Defaults to 200 */
    body: responseMessage,
  };
};
