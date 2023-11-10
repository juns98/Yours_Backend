import {
  AptosClient,
  AptosAccount,
  TokenClient,
  HexString,
  getPropertyValueRaw,
} from 'aptos';
import 'dotenv/config';
import config from '../../config';

import {
  getTransactionDate,
  mutateProperties,
  getTokenDataWithPropertyVersion,
  makeCollectionIfNotExist,
} from './aptosModule';
import { logger } from '../../config/logger';

const client = new AptosClient(config.aptosNodeUrl);
const tokenClient = new TokenClient(client);
const privateKeyBytes = HexString.ensure(
  config.aptosWalletPrivateKey!,
).toUint8Array();
const yoursAccount = new AptosAccount(
  privateKeyBytes,
  config.aptosWalletAddress,
);
const collectionName = config.aptosCollectionName;

const key = ['benefitUri', 'indexList', 'owner', 'maxPropertyVersion'];
const type = ['string', 'string', 'string', 'string'];

const integratedKey = ['owner', 'nameList', 'propertyVersionList'];
const integratedType = ['string', 'string', 'string'];

const wrappedKey = ['benefitUri', 'indexList', 'owner', 'maxPropertyVersion', 'originNFTAddress', 'originNFTId'];
const wrappedType = ['string', 'string', 'string', 'string', 'string', 'string'];

const deployAptosNFT = async (
  nftName: string,
  uri: string,
  benefitUri: string,
) => {
  try {
    await makeCollectionIfNotExist(yoursAccount, collectionName);
    const value = [benefitUri, '[]', 'defaultOwner', '1'];
    const propertyValue = getPropertyValueRaw(value, type);
    const deployTokenHash = await tokenClient.createTokenWithMutabilityConfig(
      yoursAccount,
      collectionName,
      nftName,
      'description',
      100,
      uri,
      undefined,
      undefined,
      undefined,
      undefined,
      key,
      propertyValue,
      type,
      [true, true, true, true, true],
    );
    await client.waitForTransaction(deployTokenHash, { checkSuccess: true });
    await mutateProperties(
      yoursAccount,
      collectionName,
      nftName,
      0,
      ['owner'],
      ['version1'],
      ['string'],
    );

    const date = await getTransactionDate(deployTokenHash);
    const data = {
      date: new Date(date),
      address: yoursAccount.address(),
      transactionHash: deployTokenHash,
    };
    return data;
  } catch (error: any) {
    logger.error(error);
    logger.error(error.transaction.vm_status);
    throw error;
  }
};

const mintAptosNFT = async (nftName: string, receiverName: string) => {
  try {
    const mintTxHash = await mutateProperties(
      yoursAccount,
      collectionName,
      nftName,
      0,
      ['owner'],
      [receiverName],
      ['string'],
    );
    const version1Data = await getTokenDataWithPropertyVersion(
      nftName,
      '1',
      yoursAccount,
      collectionName,
    );
    const maxPropertyVersion = parseInt(
      version1Data.token_properties.data.maxPropertyVersion.value.toString(),
    );
    const ownedToken = await getTokenDataWithPropertyVersion(
      nftName,
      `${maxPropertyVersion + 1}`,
      yoursAccount,
      collectionName,
    );
    if (
      ownedToken.token_properties.data.owner.value.toString() === receiverName
    ) {
      await mutateProperties(
        yoursAccount,
        collectionName,
        nftName,
        1,
        ['maxPropertyVersion'],
        [`${maxPropertyVersion + 1}`],
        ['string'],
      );
      const mintDate = await getTransactionDate(mintTxHash);
      const data = {
        mintId: maxPropertyVersion + 1,
        mintTxHash,
        date: mintDate,
      };
      return data;
    }
  } catch (error: any) {
    logger.error(error);
    logger.error(error.transaction.vm_status);
    throw error;
  }
};

const setAptosBenefitURI = async (nftName: string, uri: string) => {
  try {
    const transactionHash = await mutateProperties(
      yoursAccount,
      collectionName,
      nftName,
      1,
      ['benefitUri'],
      [`${uri}`],
      ['string'],
    );
    const date = await getTransactionDate(transactionHash);
    const data = { date, transactionHash };
    return data;
  } catch (error: any) {
    logger.error(error);
    logger.error(error.transaction.vm_status);
    throw error;
  }
};

const transferAptosNFT = async (
  receiverAddress: string,
  nftName: string,
  mintId: number,
) => {
  const receiverAccount = new AptosAccount(undefined, receiverAddress);
  const transferTokenHash = await tokenClient.offerToken(
    yoursAccount,
    receiverAccount.address(),
    yoursAccount.address(),
    collectionName,
    nftName,
    1,
    mintId,
  );
  await client.waitForTransaction(transferTokenHash, {
    checkSuccess: true,
  });
  return {
    transactionHash: transferTokenHash,
  };
};

const makeAptosIntegratedNFT = async (
  integratedNftName: string,
  owner: string,
  uri: string,
  nftNameList: string[],
  propertyVersionList: number[],
) => {
  try {
    const value = [
      'defaultOwner',
      nftNameList.toString(),
      propertyVersionList.toString(),
    ];
    const propertyValue = await getPropertyValueRaw(value, integratedType);
    const deployTokenHash = await tokenClient.createTokenWithMutabilityConfig(
      yoursAccount,
      collectionName,
      integratedNftName,
      'description',
      1,
      uri,
      undefined,
      undefined,
      undefined,
      undefined,
      integratedKey,
      propertyValue,
      integratedType,
      [true, true, true, true, true],
    );
    await client.waitForTransaction(deployTokenHash, { checkSuccess: true });
    await mutateProperties(
      yoursAccount,
      collectionName,
      integratedNftName,
      0,
      ['owner'],
      [owner],
      ['string'],
    );
    const token = await tokenClient.getTokenData(
      yoursAccount.address(),
      collectionName,
      integratedNftName,
    );

    const date = await getTransactionDate(deployTokenHash);
    const data = {
      transactionHash: deployTokenHash,
      chainType: 'Aptos',
      createdAt: date,
    };

    return data;
  } catch (error: any) {
    logger.error(error);
    logger.error(error.transaction.vm_status);
    throw error;
  }
};

const updateAptosIntegratedNFT = async (
  integratedNftName: string,
  nftNameList: string[],
  propertyVersionList: number[],
) => {
  try {
    const integratedNftData = await getTokenDataWithPropertyVersion(
      integratedNftName,
      '1',
      yoursAccount,
      collectionName,
    );
    const oldNameList =
      integratedNftData.token_properties.data.nameList.value.toString();
    const oldPropertyVersionList =
      integratedNftData.token_properties.data.propertyVersionList.value.toString();
    const mutateHash = await mutateProperties(
      yoursAccount,
      collectionName,
      integratedNftName,
      1,
      ['nameList', 'propertyVersionList'],
      [
        (oldNameList + ',' + nftNameList).toString(),
        (oldPropertyVersionList + ',' + propertyVersionList).toString(),
      ],
      ['string', 'string'],
    );
    await client.waitForTransaction(mutateHash, {
      checkSuccess: true,
    });
    const date = await getTransactionDate(mutateHash);

    const data = {
      transactionHash: mutateHash,
      date: date,
    };

    return data;
  } catch (error: any) {
    logger.error(error);
    logger.error(error.transaction.vm_status);
    throw error;
  }
};

const burnAptosIntegratedNft = async (tokenName: string) => {
  try {
    const burnTokenHash = await tokenClient.burnByCreator(
      yoursAccount,
      yoursAccount.address(),
      collectionName,
      tokenName,
      1,
      1,
    );
    await client.waitForTransaction(burnTokenHash, {
      checkSuccess: true,
    });
    const burnDate = await getTransactionDate(burnTokenHash);
    const data = {
      transactionHash: burnTokenHash,
      date: burnDate,
    };
    return data;
  } catch (error: any) {
    logger.error(error);
    logger.error(error.transaction.vm_status);
    throw error;
  }
};

const deployExternalAptosNFT = async (
  nftName: string,
  uri: string,
  originNFTAddress: string,
) => {
  try {
    await makeCollectionIfNotExist(yoursAccount, collectionName);
    const value = ['[]', '[]', 'defaultOwner', '1', originNFTAddress, '0'];
    const propertyValue = getPropertyValueRaw(value, wrappedType);
    const deployTokenHash = await tokenClient.createTokenWithMutabilityConfig(
      yoursAccount,
      collectionName,
      nftName,
      'description',
      1000,
      uri,
      undefined,
      undefined,
      undefined,
      undefined,
      wrappedKey,
      propertyValue,
      wrappedType,
      [true, true, true, true, true, false, true],
    );
    await client.waitForTransaction(deployTokenHash, { checkSuccess: true });
    await mutateProperties(
      yoursAccount,
      collectionName,
      nftName,
      0,
      ['owner'],
      ['version1'],
      ['string'],
    );

    const date = await getTransactionDate(deployTokenHash);
    const data = {
      date: new Date(date),
      address: yoursAccount.address(),
      transactionHash: deployTokenHash,
    };
    return data;
  } catch (error: any) {
    logger.error(error);
    logger.error(error.transaction.vm_status);
    throw error;
  }
};

const mintExternalAptosNFT = async (nftName: string, receiverName: string, _originNFTId: string) => {
  try {
    const mintTxHash = await mutateProperties(
      yoursAccount,
      collectionName,
      nftName,
      0,
      ['owner', 'originNFTId'],
      [receiverName, _originNFTId],
      ['string', 'string'],
    );
    const version1Data = await getTokenDataWithPropertyVersion(
      nftName,
      '1',
      yoursAccount,
      collectionName,
    );
    const maxPropertyVersion = parseInt(
      version1Data.token_properties.data.maxPropertyVersion.value.toString(),
    );
    const ownedToken = await getTokenDataWithPropertyVersion(
      nftName,
      `${maxPropertyVersion + 1}`,
      yoursAccount,
      collectionName,
    );
    if (
      ownedToken.token_properties.data.owner.value.toString() === receiverName
    ) {
      await mutateProperties(
        yoursAccount,
        collectionName,
        nftName,
        1,
        ['maxPropertyVersion'],
        [`${maxPropertyVersion + 1}`],
        ['string'],
      );
      const mintDate = await getTransactionDate(mintTxHash);
      const data = {
        mintId: maxPropertyVersion + 1,
        mintTxHash,
        date: mintDate,
      };
      return data;
    }
  } catch (error: any) {
    logger.error(error);
    logger.error(error.transaction.vm_status);
    throw error;
  }
};

const unwrapExternalAptosNFT = async (
  wrappedNFTName: string,
  receiverAddress: string,
  originNftName: string,
  originMintId: number,
) => {
  // const burnTokenHash = await tokenClient.burnByCreator(
  //   yoursAccount,
  //   yoursAccount.address(),
  //   collectionName,
  //   wrappedNFTName,
  //   1,
  //   1,
  // );
  // await client.waitForTransaction(burnTokenHash, {
  //   checkSuccess: true,
  // });


  // const receiverAccount = new AptosAccount(undefined, receiverAddress);
  // const transferToken = await tokenClient.offerToken(
  //   yoursAccount,
  //   receiverAccount.address(),
  //   yoursAccount.address(),
  //   collectionName,
  //   nftName,
  //   1,
  //   mintId,
  // );
  // await client.waitForTransaction(transferToken, {
  //   checkSuccess: true,
  // });
};

export {
  deployAptosNFT,
  mintAptosNFT,
  setAptosBenefitURI,
  transferAptosNFT,
  makeAptosIntegratedNFT,
  burnAptosIntegratedNft,
  updateAptosIntegratedNFT,
  deployExternalAptosNFT,
  mintExternalAptosNFT,
  unwrapExternalAptosNFT
};
