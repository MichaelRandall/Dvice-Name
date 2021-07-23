const config = require("../sharedCode/config");

const databaseId = "dvc-mngmnt-db";
const containerId = "devices";

const { CosmosClient } = require("@azure/cosmos");

const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");

const keyVaultName = config.keyvaultname;
const keyVaultUri = `https://${keyVaultName}.vault.azure.net`;

// checks to see if local.settings.json has value first, indicates local
// second uses managed identity, indicating azure, since local.settings.js not uploaded
const credential = new DefaultAzureCredential();
const secretClient = new SecretClient(keyVaultUri, credential);

module.exports = async function (context, req) {
  const endpoint = config.endpoint;

  const secretKey = await secretClient.getSecret("dvcnamingCosmosPKey");
  const key = secretKey.value;
  const client = new CosmosClient({ endpoint, key });

  const database = client.database(databaseId);
  const container = database.container(containerId);

  const theId = req.params.id;
  const theType = req.query.type;

  const { resource: deleted_device } = await container
    .item(theId, theType)
    .delete();

  const responseMessage = {
    status: 200,
    message: "Ok",
  };

  context.res = {
    // status: 200, /* Defaults to 200 */
    body: responseMessage,
  };
};
