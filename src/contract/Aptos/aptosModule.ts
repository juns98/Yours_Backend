import {
  AptosClient,
  AptosAccount,
  TokenClient,
  getPropertyValueRaw,
  FaucetClient,
} from 'aptos';
import config from '../../config';
const client = new AptosClient(config.aptosNodeUrl);
const tokenClient = new TokenClient(client);
const collectionName = config.aptosCollectionName;
const faucetClient = new FaucetClient(
  config.aptosNodeUrl,
  config.aptosFaucetUrl,
);

function getDateFromTimeStamp(timestamp: string) {
  var today = new Date(parseInt(timestamp));
  today.setHours(today.getHours() + 9);
  return today.toISOString().replace('T', ' ').substring(0, 19);
}
const getTransactionDate = async (transactionHash: string) => {
  const transactionResult = await client.waitForTransactionWithResult(
    transactionHash,
    {
      checkSuccess: true,
    },
  );
  const data = JSON.parse(JSON.stringify(transactionResult, null, 4));
  const timeStamp = data['timestamp'].substring(0, 10) + '000';
  return getDateFromTimeStamp(timeStamp);
};
const mutateProperties = async (
  account: AptosAccount,
  collectionName: string,
  nftName: string,
  propertyVersion: number,
  key: string[],
  value: string[],
  type: string[],
) => {
  try {
    const mutationTxHash = await tokenClient.mutateTokenProperties(
      account,
      account.address(),
      account.address(),
      collectionName,
      nftName,
      propertyVersion,
      1,
      key,
      getPropertyValueRaw(value, type),
      type,
    );
    await client.waitForTransaction(mutationTxHash, { checkSuccess: true });
    return mutationTxHash;
  } catch (error) {
    throw error;
  }
};
const getTokenDataWithPropertyVersion = async (
  tokenName: string,
  propertyVersion: string,
  owner: AptosAccount,
  collectionName: string,
) => {
  const tokenId = {
    token_data_id: {
      creator: owner.address().hex(),
      collection: collectionName,
      name: tokenName,
    },
    property_version: propertyVersion,
  };
  const data = await tokenClient.getTokenForAccount(owner.address(), tokenId);
  return data;
};
const createCollection = async (
  account: AptosAccount,
  collectionName: string,
) => {
  const txnHash1 = await tokenClient.createCollection(
    account,
    collectionName,
    '',
    '',
  );
  await client.waitForTransaction(txnHash1, { checkSuccess: true });
};

const getCollectionData = async (
  account: AptosAccount,
  collectionName: string,
) => {
  const collectionData = await tokenClient.getCollectionData(
    account.address(),
    collectionName,
  );
  return collectionData;
};

const getRandomNumber = (max: number, min: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getUpgrageResult = (
  successPercentage: number,
  generatedPercentage: number,
) => {
  return successPercentage >= generatedPercentage;
};

const upgradeEquipment = async (
  owner: AptosAccount,
  equipmentName: string,
  ingredientName: string,
  imageLink: string,
) => {
  const equipmentToken = await getTokenDataWithPropertyVersion(
    equipmentName,
    '1',
    owner,
    'testUpgrade',
  );
  const level = parseInt(equipmentToken.token_properties.data.level.value);
  const newLevel = (level + 1).toString();
  await mutateProperties(
    owner,
    'testUpgrade',
    equipmentName,
    1,
    ['level', 'imageLink'],
    [newLevel, imageLink],
    ['string', 'string'],
  );
};

const burnIngredient = async (owner: AptosAccount, ingredientName: string) => {
  await tokenClient.burnByCreator(
    owner,
    owner.address(),
    collectionName,
    ingredientName,
    0,
    1,
  );
};

const makeCollectionIfNotExist = async (
  account: AptosAccount,
  collectionName: string,
) => {
  try {
    await tokenClient.getCollectionData(account.address(), collectionName);
  } catch (error) {
    await initializeAccount(account, collectionName);
  }
};

const initializeAccount = async (
  owner: AptosAccount,
  collectionName: string,
) => {
  //await faucetClient.fundAccount(owner.address(), 100_000_000);
  await createCollection(owner, collectionName);
};

export {
  getTransactionDate,
  mutateProperties,
  getTokenDataWithPropertyVersion,
  createCollection,
  getCollectionData,
  getRandomNumber,
  getUpgrageResult,
  upgradeEquipment,
  burnIngredient,
  makeCollectionIfNotExist,
};
