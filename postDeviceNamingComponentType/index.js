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
  const container = database.container(
    config.deviceNmngComponentTypesContainerId
  );

  const componentType = req.body;

  const { resource: new_component_type } = await container.items.create(
    componentType
  );

  const responseMessage = {
    status: 200,
    message: "Ok",
    componenttype: new_component_type,
  };

  context.res = {
    // status: 200, /* Defaults to 200 */
    body: responseMessage,
  };
};
