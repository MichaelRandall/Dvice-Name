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
  const container = database.container(config.deviceNmngComponentsContainerId);

  const theId = req.params.id;
  context.log("WHERE IS THE theId", theId);
  console.log("WHERE IS THE theId", theId);

  const { resource: theComponent } = await container.item(theId).read();
  console.log("WHERE IS THE COMPONENT", theComponent);

  const responseMessage = {
    status: "200",
    message: "Ok",
    component: theComponent,
  };

  context.res = {
    // status: 200, /* Defaults to 200 */
    body: responseMessage,
  };
};
