import { ethers } from 'ethers';
import config from '../../config';
import deployed from './Bitfinity-deployed-address.json';
import factoryData from '../common/YoursFactory.json';
import benefitNftData from '../common/YoursBenefitNFT.json';
import marketPlaceData from '../common/BenefitNFTTrade.json';
import { getDeployedAddress } from '../common/commonContract';

const factoryAddress = deployed.YoursFactory;
const marketPlaceAddress = deployed.BenefitNFTTrade;
const BitfinityProvider = new ethers.providers.FallbackProvider([
  new ethers.providers.JsonRpcProvider(config.BitfinityRPC),
]);

const walletObj = new ethers.Wallet(config.WalletSecretKey); // only Bitfinity wallet
const wallet = walletObj.connect(BitfinityProvider);

const BitfinityFactoryContract = new ethers.Contract(
  factoryAddress,
  factoryData.abi,
  BitfinityProvider,
);
const marketPlaceContract = new ethers.Contract(
  marketPlaceAddress,
  marketPlaceData.abi,
  BitfinityProvider,
);

const deployBitfinityNFT = async (
  name: string | null,
  uri: string | null,
  benefitUri: string | null,
) => {
  console.log(name, uri);
  let transaction;
  const gas = await BitfinityFactoryContract.connect(
    wallet,
  ).estimateGas.deployNFT(name, '', uri, benefitUri, []);
  transaction = await BitfinityFactoryContract.connect(wallet).deployNFT(
    name,
    '',
    uri,
    benefitUri,
    [],
    {
      gasLimit: gas,
    },
  );
  console.log(transaction);
  const deployedInfo = await getDeployedAddress(transaction);
  while (typeof deployedInfo == 'string') {
    const deployedInfo = await getDeployedAddress(transaction);
    return deployedInfo;
  }

  const data = {
    contractAddress: deployedInfo.contractAddress,
    transactionHash: deployedInfo.transactionHash,
    date: deployedInfo.date,
  };
  return data;
};

const mintBitfinityNFT = async (nft: ethers.Contract, address: string) => {
  const transaction = await nft.connect(wallet).mint(address, {
    maxPriorityFeePerGas: ethers.utils.parseUnits('10000', 'gwei'),
    maxFeePerGas: ethers.utils.parseUnits('25000', 'gwei'),
  });
  console.log(transaction);
  const rc = await transaction.wait();
  console.log(rc);

  const event = rc.events.find((event: any) => event.event === 'Mint');
  const mintId = event.args[0].toNumber();
  const transactionHash = event.transactionHash;
  const block = await event.getBlock(); // check minting block timestamp
  const date = new Date(block.timestamp * 1000);

  const data = {
    mintId: mintId,
    transactionHash: transactionHash,
    date: date,
  };

  return data;
};

//* @desc TODO 로직 완성하기
const setBitfinityBenefitURI = async (nft: ethers.Contract, uri: string) => {
  const transaction = await nft.connect(wallet).setBenefitsURI(uri, {
    maxPriorityFeePerGas: ethers.utils.parseUnits('10000', 'gwei'),
    maxFeePerGas: ethers.utils.parseUnits('25000', 'gwei'),
  });
  const rc = await transaction.wait();
  console.log(rc.events);
  const event = rc.events.find(
    (event: any) => event.event === 'ChangeBenefitsURI',
  );
  const transactionHash = event.transactionHash;
  const block = await event.getBlock(); // check minting block timestamp
  const date = new Date(block.timestamp * 1000);

  const data = {
    transactionHash: transactionHash,
    date: date,
  };

  return data;
};

const transferBitfinityNFT = async (
  nft: ethers.Contract,
  id: number,
  from: string,
  to: string,
) => {
  const transaction = await nft.connect(wallet).transferFrom(from, to, id, {
    maxPriorityFeePerGas: ethers.utils.parseUnits('10000', 'gwei'),
    maxFeePerGas: ethers.utils.parseUnits('25000', 'gwei'),
  });
  return transaction;
};

//* @desc TODO 로직 완성하기
const makeBitfinityIntegratedNFT = async (
  to: string,
  uri: string,
  nftAddressList: string[] | null,
  mintIdList: number[] | null,
  chainType: string,
) => {
  try {
    let transaction;
    transaction = await BitfinityFactoryContract.connect(wallet).integrateNFTs(
      to,
      uri,
      nftAddressList,
      mintIdList,
      {
        maxPriorityFeePerGas: ethers.utils.parseUnits('10000', 'gwei'),
        maxFeePerGas: ethers.utils.parseUnits('25000', 'gwei'),
      },
    );
    const rc = await transaction.wait();
    const event = rc.events.find(
      (event: any) => event.event === 'MintIntegratedNFT',
    );
    let [integratedId] = event.args;
    integratedId = integratedId.toNumber();
    const transactionHash = event.transactionHash;
    const block = await event.getBlock(); // check minting block timestamp
    const date = new Date(block.timestamp * 1000);

    const data = {
      integratedId,
      transactionHash,
      chainType,
      createdAt: date,
    };

    return data;
  } catch (error) {
    throw error;
  }
};

// * @desc TODO 로직 완성하기
const updateBitfinityIntegratedNFT = async (
  id: number | null,
  nftAddressList: string[] | null,
  mintIdList: number[] | null,
) => {
  try {
    let transaction;
    transaction = await BitfinityFactoryContract.connect(
      wallet,
    ).updateIntegrateNFTs(id, nftAddressList, mintIdList, {
      maxPriorityFeePerGas: ethers.utils.parseUnits('10000', 'gwei'),
      maxFeePerGas: ethers.utils.parseUnits('25000', 'gwei'),
    });

    const rc = await transaction.wait();
    const event = rc.events.find(
      (event: any) => event.event === 'UpdateIntegratedNFT',
    );

    let [integratedId] = event.args;
    integratedId = integratedId.toNumber();
    const transactionHash = event.transactionHash;
    const block = await event.getBlock(); // check minting block timestamp
    const date = new Date(block.timestamp * 1000);

    const data = {
      transactionHash,
      date,
    };

    return data;
  } catch (error) {
    throw error;
  }
};

//* @desc TODO 로직 완성하기
const burnBitfinityIntegratedNFT = async (
  owner: string | null,
  id: number | null,
) => {
  try {
    let transaction;
    transaction = await BitfinityFactoryContract.connect(
      wallet,
    ).burnIntegratedNFT(owner, id, {
      maxPriorityFeePerGas: ethers.utils.parseUnits('10000', 'gwei'),
      maxFeePerGas: ethers.utils.parseUnits('25000', 'gwei'),
    });
    return transaction;
  } catch (error) {
    throw error;
  }
};

//* @desc TODO 로직 완성하기
const BitfinityNftBuy = async (
  mintId: number,
  contractAddress: string,
  price: number,
  tokenOwner: string,
) => {
  try {
    const transaction = await marketPlaceContract
      .connect(wallet)
      .createBuyOrder(mintId, contractAddress, 'erc721', 1, tokenOwner, {
        maxPriorityFeePerGas: ethers.utils.parseUnits('10000', 'gwei'),
        maxFeePerGas: ethers.utils.parseUnits('25000', 'gwei'),
        value: price,
      });

    return transaction;
  } catch (error) {
    throw error;
  }
};

//* @desc TODO 로직 완성하기
const approveToSellBitfinity = async (nftAddress: string) => {
  try {
    const nftContract = new ethers.Contract(
      nftAddress,
      benefitNftData.abi,
      BitfinityProvider,
    );
    const transaction = await nftContract
      .connect(wallet)
      .approveToSell(marketPlaceAddress, {
        maxPriorityFeePerGas: ethers.utils.parseUnits('10000', 'gwei'),
        maxFeePerGas: ethers.utils.parseUnits('25000', 'gwei'),
      });
    await transaction.wait();
  } catch (error) {
    throw error;
  }
};

//* @desc TODO 로직 완성하기
const BitfinityNftSell = async (
  nftId: number,
  contractAddress: string,
  nftType: string,
  price: number,
) => {
  try {
    const transaction = await marketPlaceContract
      .connect(wallet)
      .createSellOrder(nftId, contractAddress, 'erc721', price, 1, {
        maxPriorityFeePerGas: ethers.utils.parseUnits('10000', 'gwei'),
        maxFeePerGas: ethers.utils.parseUnits('25000', 'gwei'),
      });
    return transaction;
  } catch (error) {
    throw error;
  }
};

//* @desc TODO 로직 완성하기
const deployBitfinityWrapNFT = async (
  name: string | null,
  uri: string | null,
  originNFTAddress: string | null,
) => {
  try {
    const transaction = await BitfinityFactoryContract.connect(
      wallet,
    ).wrappingExternalNFT(name, '', uri, '', [], originNFTAddress, {
      maxPriorityFeePerGas: ethers.utils.parseUnits('10000', 'gwei'),
      maxFeePerGas: ethers.utils.parseUnits('25000', 'gwei'),
    });

    const deployedInfo = await getDeployedAddress(transaction);
    const data = {
      nftAddress: deployedInfo.contractAddress,
      transactionHash: deployedInfo.transactionHash,
    };
    return data;
  } catch (error) {
    throw error;
  }
};

//* TODO 로직 완성하기
const mintBitfinityWrapNFT = async (
  wrap: ethers.Contract,
  address: string,
  originalNFTAddress: string,
  originalNFTId: number,
) => {
  const transaction = await wrap
    .connect(wallet)
    .mint(address, originalNFTAddress, originalNFTId, {
      maxPriorityFeePerGas: ethers.utils.parseUnits('10000', 'gwei'),
      maxFeePerGas: ethers.utils.parseUnits('25000', 'gwei'),
    });
  const rc = await transaction.wait();
  const event = rc.events.find((event: any) => event.event === 'Mint');
  const mintId = event.args[0].toNumber();
  const transactionHash = event.transactionHash;
  const block = await event.getBlock(); // check minting block timestamp
  const date = new Date(block.timestamp * 1000);

  const data = {
    mintId,
    transactionHash,
    date,
  };
  return data;
};

export {
  BitfinityProvider,
  deployBitfinityNFT,
  mintBitfinityNFT,
  transferBitfinityNFT,
  burnBitfinityIntegratedNFT,
  makeBitfinityIntegratedNFT,
  updateBitfinityIntegratedNFT,
  BitfinityNftBuy,
  approveToSellBitfinity,
  BitfinityNftSell,
  deployBitfinityWrapNFT,
  mintBitfinityWrapNFT,
  setBitfinityBenefitURI,
};
