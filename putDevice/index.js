const config = require("../sharedCode/config");

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
  const secretKey = await secretClient.getSecret(config.keyvaultkey);
  const key = secretKey.value;
  const client = new CosmosClient({ endpoint, key });

  const database = client.database(config.databaseId);
  const container = database.container(config.devicesContainerId);

  // req.params is part of the url path
  const theId = req.params.id;
  // req.query is part of the query string
  const theActive = req.query.active;
  const newObject = req.body;

  const { resource: theDevice } = await container.item(theId, theActive).read();

  const { id, device } = theDevice;

  theDevice.device = newObject.device;

  const { resource: updated_device } = await container
    .item(id, device)
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
