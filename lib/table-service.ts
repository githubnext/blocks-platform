import {
  TableServiceClient,
  TableClient,
  AzureNamedKeyCredential,
} from "@azure/data-tables";

const accountName = process.env.COSMOS_DB_ACCOUNT_NAME;
const accountKey = process.env.COSMOS_DB_ACCOUNT_KEY;
const credential = new AzureNamedKeyCredential(accountName, accountKey);

// this is what's in the @azure/data-tables docs and the EH code,
// but the hostname doesn't resolve
// const tableServiceUrl = `https://${accountName}.table.core.windows.net`;

// this is from the connection string in the Azure portal
const tableServiceUrl = `https://${accountName}.table.cosmos.azure.com:443/`;

const serviceClient = new TableServiceClient(tableServiceUrl, credential);

const makeTableClient = async ({
  blockOwnerId,
  blockRepoId,
  blockId,
}: {
  blockOwnerId: string;
  blockRepoId: string;
  blockId: string;
}) => {
  // table names are case-insensitive and must satisfy /^[A-Za-z][A-Za-z0-9]{2,62}$/
  // https://docs.microsoft.com/en-us/rest/api/storageservices/understanding-the-table-service-data-model#table-names
  const tableName = `${blockOwnerId}z${blockRepoId}z${blockId}`;
  await serviceClient.createTable(tableName);

  return new TableClient(tableServiceUrl, tableName, credential);
};

const makePartitionKey = ({ owner, repo }: { owner: string; repo: string }) => {
  // separator should not be a valid character in GitHub owners / repos
  // https://stackoverflow.com/questions/59081778/rules-for-special-characters-in-github-repository-name
  // partition keys disallow / \ # ?
  // https://docs.microsoft.com/en-us/rest/api/storageservices/Understanding-the-Table-Service-Data-Model#characters-disallowed-in-key-fields
  return `${owner}^${repo}`;
};

export const storeGet = async ({
  blockOwnerId,
  blockRepoId,
  blockId,
  owner,
  repo,
  key,
}: {
  blockOwnerId: string;
  blockRepoId: string;
  blockId: string;
  owner: string;
  repo: string;
  key: string;
}) => {
  const tableClient = await makeTableClient({
    blockOwnerId,
    blockRepoId,
    blockId,
  });
  try {
    const result = await tableClient.getEntity(
      makePartitionKey({ owner, repo }),
      key
    );
    return JSON.parse(result.value as string);
  } catch (e) {
    if (e.name === "RestError" && e.statusCode === 404) {
      return undefined;
    } else {
      console.log(e);
      throw e;
    }
  }
};

export const storeSet = async ({
  blockOwnerId,
  blockRepoId,
  blockId,
  owner,
  repo,
  key,
  value,
}: {
  blockOwnerId: string;
  blockRepoId: string;
  blockId: string;
  owner: string;
  repo: string;
  key: string;
  value: string;
}) => {
  const tableClient = await makeTableClient({
    blockOwnerId,
    blockRepoId,
    blockId,
  });
  const entity = {
    partitionKey: makePartitionKey({ owner, repo }),
    rowKey: key,
    // TODO(jaked)
    // we pass JSON in the request, Next.js decodes it, then we re-encode it
    // don't do that
    value: JSON.stringify(value),
  };
  return tableClient.upsertEntity(entity);
};

export const storeDelete = async ({
  blockOwnerId,
  blockRepoId,
  blockId,
  owner,
  repo,
  key,
}: {
  blockOwnerId: string;
  blockRepoId: string;
  blockId: string;
  owner: string;
  repo: string;
  key: string;
}) => {
  const tableClient = await makeTableClient({
    blockOwnerId,
    blockRepoId,
    blockId,
  });
  return tableClient.deleteEntity(makePartitionKey({ owner, repo }), key);
};
