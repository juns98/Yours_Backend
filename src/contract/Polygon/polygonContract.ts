import { ethers } from 'ethers';
import config from '../../config';
import deployed from './polygon-deployed-address.json';
import factoryData from '../common/YoursFactory.json';
import benefitNftData from '../common/YoursBenefitNFT.json';
import marketPlaceData from '../common/BenefitNFTTrade.json';
import { getDeployedAddress } from '../common/commonContract';

const factoryAddress = deployed.YoursFactory;
const marketPlaceAddress = deployed.BenefitNFTTrade;
const polygonProvider = new ethers.providers.FallbackProvider([
  new ethers.providers.JsonRpcProvider(config.polygonRPC),
]);
const walletObj = new ethers.Wallet(config.WalletSecretKey);
const wallet = walletObj.connect(polygonProvider);
const contract = new ethers.Contract(
  factoryAddress,
  factoryData.abi,
  polygonProvider,
);
const marketPlaceContract = new ethers.Contract(
  marketPlaceAddress,
  marketPlaceData.abi,
  polygonProvider,
);
const deployPolygonNFT = async (
  name: string | null,
  uri: string | null,
  benefitUri: string | null,
) => {
  let transaction;
  const gasFeeData = await polygonProvider.getFeeData();
  transaction = await contract
    .connect(wallet)
    .deployNFT(name, '', uri, benefitUri, [], {
      gasPrice: gasFeeData.gasPrice,
    });
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

const mintPolygonNFT = async (nft: any, address: string) => {
  const gasFeeData = await polygonProvider.getFeeData();
  // const transaction = await nft
  //   .connect(wallet)
  //   .mint(address, { gasPrice: gasFeeData.gasPrice });
  const transaction = await nft
    .connect(wallet)
    .mint(config.walletAddress, { gasPrice: gasFeeData.gasPrice });
  const rc = await transaction.wait();
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

const setPolygonBenefitURI = async (nft: ethers.Contract, uri: string) => {
  const transaction = await nft.connect(wallet).setBenefitsURI(uri);
  const rc = await transaction.wait();
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
const transferPolygonNFT = async (
  nft: ethers.Contract,
  id: number,
  from: string,
  to: string,
) => {
  const transaction = await nft.connect(wallet).transferFrom(from, to, id);
  return transaction;
};

const makePolygonIntegratedNFT = async (
  to: string,
  uri: string,
  nftAddressList: string[] | null,
  mintIdList: number[] | null,
  chainType: string,
) => {
  try {
    let transaction;
    const gas = await contract
      .connect(wallet)
      .estimateGas.integrateNFTs(to, uri, nftAddressList, mintIdList);
    transaction = await contract
      .connect(wallet)
      .integrateNFTs(to, uri, nftAddressList, mintIdList, {
        gasLimit: gas,
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

const updatePolygonIntegratedNFT = async (
  id: number | null,
  nftAddressList: string[] | null,
  mintIdList: number[] | null,
) => {
  try {
    let transaction;
    const gas = await contract
      .connect(wallet)
      .estimateGas.updateIntegrateNFTs(id, nftAddressList, mintIdList);
    transaction = await contract
      .connect(wallet)
      .updateIntegrateNFTs(id, nftAddressList, mintIdList, { gasLimit: gas });

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

const burnPolygonIntegratedNFT = async (
  owner: string | null,
  id: number | null,
) => {
  try {
    let transaction;
    const gasFeeData = await polygonProvider.getFeeData();
    transaction = await contract.connect(wallet).burnIntegratedNFT(owner, id, {
      gasPrice: gasFeeData.gasPrice,
    });
    return transaction;
  } catch (error) {
    throw error;
  }
};

const polygonNftBuy = async (
  mintId: number,
  contractAddress: string,
  price: number,
  tokenOwner: string,
) => {
  try {
    const gas = await marketPlaceContract
      .connect(wallet)
      .estimateGas.createBuyOrder(
        mintId,
        contractAddress,
        'erc721',
        1,
        tokenOwner,
        { value: price },
      );
    const transaction = await marketPlaceContract
      .connect(wallet)
      .createBuyOrder(mintId, contractAddress, 'erc721', 1, tokenOwner, {
        gasLimit: gas,
        value: price,
      });

    return transaction;
  } catch (error) {
    throw error;
  }
};

const approveToSellPolygon = async (nftAddress: string) => {
  try {
    const nftContract = new ethers.Contract(
      nftAddress,
      benefitNftData.abi,
      polygonProvider,
    );
    const gas = await nftContract
      .connect(wallet)
      .estimateGas.approveToSell(marketPlaceAddress);
    const transaction = await nftContract
      .connect(wallet)
      .approveToSell(marketPlaceAddress, {
        gasLimit: gas,
      });
    await transaction.wait();
  } catch (error) {
    throw error;
  }
};

const polygonNftSell = async (
  nftId: number,
  contractAddress: string,
  nftType: string,
  price: number,
) => {
  try {
    const gas = await marketPlaceContract
      .connect(wallet)
      .estimateGas.createSellOrder(nftId, contractAddress, 'erc721', price, 1);
    const transaction = await marketPlaceContract
      .connect(wallet)
      .createSellOrder(nftId, contractAddress, 'erc721', price, 1, {
        gasLimit: gas,
      });
    return transaction;
  } catch (error) {
    throw error;
  }
};

const deployPolygonWrapNFT = async (
  name: string | null,
  uri: string | null,
  originNFTAddress: string | null,
) => {
  try {
    const gas = await contract
      .connect(wallet)
      .estimateGas.wrappingExternalNFT(name, '', uri, '', [], originNFTAddress);
    const transaction = await contract
      .connect(wallet)
      .wrappingExternalNFT(name, '', uri, '', [], originNFTAddress, {
        gasLimit: gas,
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

const mintPolygonWrapNFT = async (
  wrap: ethers.Contract,
  address: string,
  originalNFTAddress: string,
  originalNFTId: number,
) => {
  const transaction = await wrap
    .connect(wallet)
    .mint(address, originalNFTAddress, originalNFTId);
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
  deployPolygonNFT,
  mintPolygonNFT,
  polygonProvider,
  setPolygonBenefitURI,
  transferPolygonNFT,
  makePolygonIntegratedNFT,
  updatePolygonIntegratedNFT,
  burnPolygonIntegratedNFT,
  polygonNftBuy,
  approveToSellPolygon,
  polygonNftSell,
  deployPolygonWrapNFT,
  mintPolygonWrapNFT,
};
