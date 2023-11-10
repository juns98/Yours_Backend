import { create } from 'ipfs-http-client';
import responseMessage from '../../modules/constants/responseMessage';
import config from '../../config';
import { ethers } from 'ethers';

const ipfsId = config.ipfsId;
const ipfsSecret = config.ipfsSecret;
const auth =
  'Basic ' + Buffer.from(ipfsId + ':' + ipfsSecret).toString('base64');

const client = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth,
  },
});

const uploadMetaIpfs = async (
  name: string | null,
  description: string | null,
  image: string | null,
) => {
  let resultPath = '';
  try {
    const result = await client.add(
      JSON.stringify({
        name,
        description,
        image,
      }),
    );
    resultPath = `https://yours.infura-ipfs.io/ipfs/${result.path}`;
    return resultPath;
  } catch (error) {
    console.log(error);
    return responseMessage.META_ERROR;
  }
};

const uploadBenefitIpfs = async (benefits: Object[]) => {
  let resultPath = '';
  try {
    const result = await client.add(
      JSON.stringify({
        benefits,
      }),
    );
    resultPath = `https://ipfs.infura.io/ipfs/${result.path}`;
    return resultPath;
  } catch (error) {
    console.log(error);
    return responseMessage.BENEFIT_DATA_ERROR;
  }
};
const getDeployedAddress = async (transaction: ethers.Contract) => {
  const rc = await transaction.wait();
  console.log(rc);
  const event = rc.events.find((event: any) => event.event === 'DeployNFT');
  let data;
  if (event) {
    const [clone, owner] = event.args;
    const transactionHash = event.transactionHash;
    const block = await event.getBlock(); // check minting block timestamp
    const date = new Date(block.timestamp * 1000);

    data = {
      contractAddress: clone,
      transactionHash: transactionHash,
      date: date,
    };
  } else {
    data = {
      contractAddress: '',
      transactionHash: rc.transactionHash,
      date: new Date(),
    };
  }

  return data;
};

const getMethods = (data: any) => {
  data.abi.map((value: any) => {
    let methodData = value.name + '(';
    value.inputs.map((value1: any) => {
      methodData += '(' + value1.type + ' ' + value1.name + ')';
    });
    methodData += ');';
    console.log(methodData);
  });
};

const getNFTsOfContract = async (
  contract: ethers.Contract,
  targetNFTId: string,
) => {
  const originNFTIds = await contract.getOriginalNFTIds();

  let ownedNFTIds: string[] = [];

  if (Array.isArray(originNFTIds)) {
    ownedNFTIds = originNFTIds.map((id) => id.toString());
  } else {
    ownedNFTIds = [originNFTIds.toString()];
  }

  return ownedNFTIds.includes(targetNFTId);
};

async function checkNFTOwnership(
  contract: ethers.Contract,
  targetNFTId: string,
) {
  const isOwned = await getNFTsOfContract(contract, targetNFTId);
  return isOwned;
  // const intervalDuration = 5000; // 5초마다 함수를 호출, 필요에 따라 조정 가능
  // const checkInterval = setInterval(async () => {
  //   isOwned = await getNFTsOfContract(contract, targetNFTId);
  //   if (isOwned) {
  //     console.log('Target NFT is owned!');
  //     clearInterval(checkInterval);
  //     process.exit(0); // 정상적인 종료
  //   }
  // }, intervalDuration);
  // setTimeout(() => {
  //   clearInterval(checkInterval);
  //   if (!isOwned) {
  //     console.log('30 seconds passed. Target NFT is not owned.');
  //     process.exit(1); // 오류나 예상치 못한 종료
  //   }
  // }, 30000);
}

export {
  uploadMetaIpfs,
  uploadBenefitIpfs,
  getDeployedAddress,
  getMethods,
  getNFTsOfContract,
  checkNFTOwnership,
};
