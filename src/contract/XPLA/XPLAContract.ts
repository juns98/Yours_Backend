import { ethers } from 'ethers';
import config from '../../config';
import deployed from './XPLA-deployed-address.json';
import factoryData from '../common/YoursFactory.json';
import benefitNftData from '../common/YoursBenefitNFT.json';
import marketPlaceData from '../common/BenefitNFTTrade.json';
import { getDeployedAddress } from '../common/commonContract';

const factoryAddress = deployed.YoursFactory;
const marketPlaceAddress = deployed.BenefitNFTTrade;
const xplaProvider = new ethers.providers.FallbackProvider([
  new ethers.providers.JsonRpcProvider(config.xplaRPC),
]);

const walletObj = new ethers.Wallet(config.WalletSecretKey); // only XPLA wallet
const wallet = walletObj.connect(xplaProvider);

const xplaFactoryContract = new ethers.Contract(
  factoryAddress,
  factoryData.abi,
  xplaProvider,
);
const marketPlaceContract = new ethers.Contract(
  marketPlaceAddress,
  marketPlaceData.abi,
  xplaProvider,
);

const deployXplaNFT = async (
  name: string | null,
  uri: string | null,
  benefitUri: string | null,
) => {
  console.log(name, uri);
  let transaction;
  const gas = await xplaFactoryContract
    .connect(wallet)
    .estimateGas.deployNFT(name, '', uri, benefitUri, []);
  transaction = await xplaFactoryContract
    .connect(wallet)
    .deployNFT(name, '', uri, benefitUri, [], {
      gasLimit: gas,
    });
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

const mintXplaNFT = async (nft: ethers.Contract, address: string) => {
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
const setXplaBenefitURI = async (nft: ethers.Contract, uri: string) => {
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

const transferXplaNFT = async (
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
const makeXplaIntegratedNFT = async (
  to: string,
  uri: string,
  nftAddressList: string[] | null,
  mintIdList: number[] | null,
  chainType: string,
) => {
  try {
    let transaction;
    transaction = await xplaFactoryContract
      .connect(wallet)
      .integrateNFTs(to, uri, nftAddressList, mintIdList, {
        maxPriorityFeePerGas: ethers.utils.parseUnits('10000', 'gwei'),
        maxFeePerGas: ethers.utils.parseUnits('25000', 'gwei'),
      });
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
const updateXplaIntegratedNFT = async (
  id: number | null,
  nftAddressList: string[] | null,
  mintIdList: number[] | null,
) => {
  try {
    let transaction;
    transaction = await xplaFactoryContract
      .connect(wallet)
      .updateIntegrateNFTs(id, nftAddressList, mintIdList, {
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
const burnXplaIntegratedNFT = async (
  owner: string | null,
  id: number | null,
) => {
  try {
    let transaction;
    transaction = await xplaFactoryContract
      .connect(wallet)
      .burnIntegratedNFT(owner, id, {
        maxPriorityFeePerGas: ethers.utils.parseUnits('10000', 'gwei'),
        maxFeePerGas: ethers.utils.parseUnits('25000', 'gwei'),
      });
    return transaction;
  } catch (error) {
    throw error;
  }
};

//* @desc TODO 로직 완성하기
const xplaNftBuy = async (
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
const approveToSellXpla = async (nftAddress: string) => {
  try {
    const nftContract = new ethers.Contract(
      nftAddress,
      benefitNftData.abi,
      xplaProvider,
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
const xplaNftSell = async (
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
const deployXplaWrapNFT = async (
  name: string | null,
  uri: string | null,
  originNFTAddress: string | null,
) => {
  try {
    const transaction = await xplaFactoryContract
      .connect(wallet)
      .wrappingExternalNFT(name, '', uri, '', [], originNFTAddress, {
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
const mintXplaWrapNFT = async (
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
  xplaProvider,
  deployXplaNFT,
  mintXplaNFT,
  transferXplaNFT,
  burnXplaIntegratedNFT,
  makeXplaIntegratedNFT,
  updateXplaIntegratedNFT,
  xplaNftBuy,
  approveToSellXpla,
  xplaNftSell,
  deployXplaWrapNFT,
  mintXplaWrapNFT,
  setXplaBenefitURI,
};
