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
  const container = database.container(config.deviceNmngComponentsContainerId);

  // req.params is part of the url path
  const theId = req.params.id;
  // req.query is part of the query string
  const theActive = req.query.active;
  const newObject = req.body;

  const { resource: theComponent } = await container
    .item(theId, theActive)
    .read();

  const { id, component_type } = theComponent;

  theComponent.component = newObject.component;

  const { resource: updated_component } = await container
    .item(id, component_type)
    .replace(theComponent);

  const responseMessage = {
    status: 200,
    message: "Ok",
    component: updated_component,
  };

  context.res = {
    // status: 200, /* Defaults to 200 */
    body: responseMessage,
  };
};
