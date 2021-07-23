const config = require("../sharedCode/config");

const { CosmosClient } = require("@azure/cosmos");

const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");

const databaseId = "dvc-mngmnt-db";
const containerId = "devices";

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

  // req.params is part of the url path
  const theId = req.params.id;
  // req.query is part of the query string
  // const theId = req.query.id;
  const theType = req.query.type;
  const newObject = req.body;

  context.log("VALUES " + theId + ", " + theType)

  const { resource: theDevice } = await container.item(theId, theType).read();

  const { id, type } = theDevice;

  theDevice.device = newObject.device;

  const { resource: updated_device } = await container
    .item(id, type)
    .replace(theDevice);

  const responseMessage = {
    status: 200,
    message: "Ok",
    device: updated_device,
  };

  context.res = {
    // status: 200, /* Defaults to 200 */
    body: responseMessage,
  };
};
