const config = require("../sharedCode/config");

const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");
const { CosmosClient } = require("@azure/cosmos");

const keyVaultName = config.keyvaultname;

const keyVaultUri = `https://${keyVaultName}.vault.azure.net`;

const credential = new DefaultAzureCredential();
const secretClient = new SecretClient(keyVaultUri, credential);

module.exports = async function (context, req) {
  const endpoint = config.endpoint;

  const secretKey = await secretClient.getSecret(config.keyvaultkey);
  const key = secretKey.value;

  const client = new CosmosClient({ endpoint, key });

  const database = client.database(config.databaseId);
  const container = database.container(config.deviceTypesContainerId);

  // req.params is part of the url path
  const theId = req.params.id;
  // req.query is part of the query string
  const theType = req.query.type;
  const newObject = req.body;

  const { resource: theDeviceType } = await container
    .item(theId, theType)
    .read();

  const { id, type } = theDeviceType;

  theDeviceType.type = newObject.type;

  const { resource: updated_device_type } = await container
    .item(id, type)
    .replace(theDeviceType);

  const responseMessage = {
    status: 200,
    message: "Device type updated",
    devicetype: updated_device_type,
  };

  context.res = {
    // status: 200, /* Defaults to 200 */
    body: responseMessage,
  };
};
