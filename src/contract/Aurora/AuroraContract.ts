import { ethers } from 'ethers';
import config from '../../config';
import deployed from './aurora-deployed-address.json';
import factoryData from '../common/YoursFactory.json';
import benefitNftData from '../common/YoursBenefitNFT.json';
import marketPlaceData from '../common/BenefitNFTTrade.json';
import { getDeployedAddress } from '../common/commonContract';

const factoryAddress = deployed.YoursFactory;
const marketPlaceAddress = deployed.BenefitNFTTrade;
const auroraProvider = new ethers.providers.FallbackProvider([
  new ethers.providers.JsonRpcProvider(config.auroraRPC),
]);
const walletObj = new ethers.Wallet(config.WalletSecretKey);
const wallet = walletObj.connect(auroraProvider);
const contract = new ethers.Contract(
  factoryAddress,
  factoryData.abi,
  auroraProvider,
);

const marketPlaceContract = new ethers.Contract(
  marketPlaceAddress,
  marketPlaceData.abi,
  auroraProvider,
);
const deployAuroraNFT = async (
  name: string | null,
  uri: string | null,
  benefitUri: string | null,
) => {
  try {
    let transaction;
    const gas = await contract
      .connect(wallet)
      .estimateGas.deployNFT(name, '', uri, benefitUri, []);
    transaction = await contract
      .connect(wallet)
      .deployNFT(name, '', uri, benefitUri, [], {
        gasLimit: gas,
      });
    const deployedInfo = await getDeployedAddress(transaction);
    while (typeof deployedInfo.contractAddress == 'string') {
      const deployedInfo = await getDeployedAddress(transaction);
      return deployedInfo;
    }

    const data = {
      contractAddress: deployedInfo.contractAddress,
      transactionHash: deployedInfo.transactionHash,
      date: deployedInfo.date,
    };
    return data;
  } catch (error) {
    throw error;
  }
};

const mintAuroraNFT = async (nft: ethers.Contract, address: string) => {
  //const transaction = await nft.connect(wallet).mint(address);
  const transaction = await nft.connect(wallet).mint(config.walletAddress);
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

const setAuroraBenefitURI = async (nft: ethers.Contract, uri: string) => {
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

const transferAuroraNFT = async (
  nft: ethers.Contract,
  id: number,
  from: string,
  to: string,
) => {
  const transaction = await nft.connect(wallet).transferFrom(from, to, id);
  return transaction;
};

const makeAuroraIntegratedNFT = async (
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

const updateAuroraIntegratedNFT = async (
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

const burnAuroraIntegratedNFT = async (
  owner: string | null,
  id: number | null,
) => {
  try {
    let transaction;
    const gasFeeData = await auroraProvider.getFeeData();
    transaction = await contract.connect(wallet).burnIntegratedNFT(owner, id, {
      gasPrice: gasFeeData.gasPrice,
    });
    return transaction;
  } catch (error) {
    throw error;
  }
};

const auroraNftBuy = async (
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

const approveToSellAurora = async (nftAddress: string) => {
  try {
    const nftContract = new ethers.Contract(
      nftAddress,
      benefitNftData.abi,
      auroraProvider,
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

const auroraNftSell = async (
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

const deployAuroraWrapNFT = async (
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

const mintAuroraWrapNFT = async (
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
  deployAuroraNFT,
  mintAuroraNFT,
  auroraProvider,
  setAuroraBenefitURI,
  transferAuroraNFT,
  makeAuroraIntegratedNFT,
  updateAuroraIntegratedNFT,
  burnAuroraIntegratedNFT,
  auroraNftBuy,
  approveToSellAurora,
  auroraNftSell,
  deployAuroraWrapNFT,
  mintAuroraWrapNFT,
};
