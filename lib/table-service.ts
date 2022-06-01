import {
  TableServiceClient,
  TableClient,
  AzureNamedKeyCredential,
} from "@azure/data-tables";

const accountName = process.env.COSMOS_DB_ACCOUNT_NAME;
const accountKey = process.env.COSMOS_DB_ACCOUNT_KEY;
const credential = new AzureNamedKeyCredential(accountName, accountKey);

const serviceClient = new TableServiceClient(
  `https://${accountName}.table.core.windows.net`,
  credential
);

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

  return new TableClient(
    `https://${accountName}.table.core.windows.net`,
    tableName,
    credential
  );
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
    const result = await tableClient.getEntity(`${owner}/${repo}`, key);
    return result.value;
  } catch (e) {}
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
    partitionKey: `${owner}/${repo}`,
    rowKey: key,
    value,
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
  return tableClient.deleteEntity(`${owner}/${repo}`, key);
};
