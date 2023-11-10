import { createNftDto } from './../interfaces/user/DTO';
import { PrismaClient } from '@prisma/client';
import errorGenerator from '../middlewares/error/errorGenerator';
import { statusCode, responseMessage } from '../modules/constants';
import config from '../config';
import { s3ForConvertFile } from '../config/s3Config';
import { nftNotification, recipient } from '../interfaces/user/NftNotification';
import {
  etherProvider,
  mintEtherNFT,
  deployWrapNFT,
  mintWrapNFT,
} from '../contract/Ethereum/etherContract';
import benefitData from '../contract/common/YoursBenefitNFT.json';
import {
  deployPolygonWrapNFT,
  mintPolygonNFT,
  mintPolygonWrapNFT,
  polygonProvider,
} from '../contract/Polygon/polygonContract';
import {
  mintKlaytnNFT,
  klaytnProvider,
  deployKlaytnWrapNFT,
  mintKlaytnWrapNFT,
} from '../contract/Klaytn/KlaytnContract';
import { messageSender, multipleMessageSender } from '../modules/notification';
import { mintAptosNFT } from '../contract/Aptos/aptosContract';
import {
  auroraProvider,
  deployAuroraWrapNFT,
  mintAuroraNFT,
  mintAuroraWrapNFT,
} from '../contract/Aurora/AuroraContract';
import { ethers } from 'ethers';
import wrapNFTData from '../contract/common/YoursWrappedNFT.json';
import { userInfo } from './../interfaces/user/DTO';
import { decodeByAES256, encodeByAES256 } from '../modules/crypto';
import { sendMail } from '../modules/mail';
import { saveMailAuthCode, verifyCode } from '../modules/code';
import { checkNFTOwnership } from '../contract/common/commonContract';
import {
  deployOasysWrapNFT,
  mintOasysNFT,
  mintOasysWrapNFT,
  oasysProvider,
} from '../contract/Oasys/OasysContract';
import { mintXplaNFT } from '../contract/XPLA/XPLAContract';
const prisma = new PrismaClient();

const getUserAndNftInfo = async (
  userId: number,
  nftId: number,
  templateCode: string,
) => {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
  });
  const nft = await prisma.nfts.findFirst({
    where: {
      id: nftId,
    },
  });
  if (!nft || !user) {
    throw errorGenerator({
      msg: responseMessage.NOT_FOUND,
      statusCode: statusCode.NOT_FOUND,
    });
  }
  const messageInfo: nftNotification = {
    name: user.name,
    nftName: nft.nftName,
    phone: user.phone,
    nftId: nftId,
    photoDescription: nft.options,
    templateCode: templateCode,
  };
  return messageInfo;
};

const makeRecipList = async (userId: number, nftId: number) => {
  const holder = await prisma.user_has_nfts.findMany({
    where: {
      nftId: nftId,
    },
    include: {
      user: {
        select: {
          name: true,
          phone: true,
          id: true,
        },
      },
      nfts: {
        select: {
          nftName: true,
        },
      },
    },
  });
  let recipientList = [];
  for (let i = 0; i < holder.length; i++) {
    if (holder[i].user.id === userId) continue;
    const recipient: recipient = {
      recipientNo: holder[i].user.phone,
      templateParameter: {
        nftId: nftId,
        name: holder[i].user.name,
        nftName: holder[i].nfts.nftName,
      },
    };
    recipientList.push(recipient);
  }
  return recipientList;
};

const getInfoByType = async (userId: number, type: string) => {
  try {
    switch (type) {
      case 'own': {
        const nftsInfo = await prisma.user_has_nfts.findMany({
          where: {
            userId,
          },
          select: {
            nftId: true,
            nfts: {
              select: {
                id: true,
                nftName: true,
                image: true,
                reward: true,
              },
            },
            isLocked: true,
          },
        });

        const data = await Promise.all(
          nftsInfo.map((nftInfo: any) => {
            const result = {
              id: nftInfo.nftId,
              nftName: nftInfo.nfts.nftName,
              image: nftInfo.nfts.image,
              numberOfRewards: nftInfo.nfts.reward.length,
              isLocked: nftInfo.isLocked,
            };
            return result;
          }),
        );
        return data;
      }
      case 'reward': {
        const nftsRewardInfo = await prisma.user_has_nfts.findMany({
          where: {
            userId: userId,
          },
          select: {
            nftId: true,
            nfts: {
              select: {
                id: true,
                nftName: true,
                reward: {
                  select: {
                    id: true,
                    rewardName: true,
                    category: true,
                    option: true,
                  },
                },
              },
            },
          },
        });

        let rewardArray = [];
        for (let i = 0; i < nftsRewardInfo.length; i++) {
          for (let j = 0; j < nftsRewardInfo[i].nfts!.reward.length; j++) {
            const result = {
              nftId: nftsRewardInfo[i].nftId,
              rewardId: nftsRewardInfo[i].nfts.reward[j].id,
              nftName: nftsRewardInfo[i].nfts?.nftName,
              rewardName: nftsRewardInfo[i].nfts?.reward[j].rewardName,
              category: nftsRewardInfo[i].nfts?.reward[j].category,
              option: nftsRewardInfo[i].nfts?.reward[j].option,
            };
            rewardArray.push(result);
          }
        }
        return rewardArray;
      }
      case 'create': {
        const ownNftsInfo = await prisma.nfts.findMany({
          where: {
            ownerId: userId,
          },
          select: {
            id: true,
            nftName: true,
            image: true,
            reward: true,
          },
        });
        const isLocked = await prisma.user_has_nfts.findMany({
          where: {
            nfts: {
              ownerId: userId,
            },
          },
          select: {
            nftId: true,
            isLocked: true,
          },
        });
        const data = await Promise.all(
          ownNftsInfo.map((ownNftInfo: any) => {
            for (let i = 0; i < isLocked.length; i++) {
              if (ownNftInfo.id === isLocked[i].nftId) {
                const result = {
                  id: ownNftInfo.id,
                  nftName: ownNftInfo.nftName,
                  image: ownNftInfo.image,
                  numberOfRewards: ownNftInfo.reward.length,
                  isLocked: isLocked[i].isLocked,
                };
                return result;
              }
            }
            const result = {
              id: ownNftInfo.id,
              nftName: ownNftInfo.nftName,
              image: ownNftInfo.image,
              numberOfRewards: ownNftInfo.reward.length,
              isLocked: false,
            };
            return result;
          }),
        );
        return data;
      }
      default:
        throw errorGenerator({
          msg: responseMessage.NOT_FOUND,
          statusCode: statusCode.NOT_FOUND,
        });
    }
  } catch (error) {
    throw error;
  }
};

const getNftDetailInfo = async (nftId: number) => {
  try {
    const getNftOwners = await prisma.user_has_nfts.findMany({
      where: {
        nftId,
      },
    });
    const getDetailData = await prisma.nfts.findFirst({
      where: {
        id: nftId,
      },
      include: {
        reward: {
          select: {
            id: true,
            rewardName: true,
            category: true,
            option: true,
          },
        },
      },
    });

    const data = {
      id: getDetailData?.id,
      nftName: getDetailData?.nftName,
      image: getDetailData?.image,
      numberOfOwners: getNftOwners.length,
      description: getDetailData?.description,
      chainType: getDetailData?.chainType,
      isDeployed: getDetailData?.isDeployed,
      numberOfRewards: getDetailData?.reward.length,
      rewards: getDetailData?.reward,
      authType: getDetailData?.authType,
      options: getDetailData?.options,
      nftAddress: getDetailData?.nftAddress,
      isEdited: getDetailData?.isEdited,
      isLoading: getDetailData?.isLoading,
      createdAt: getDetailData?.createdAt,
      updatedAt: getDetailData?.updatedAt,
    };

    if (!data) {
      throw errorGenerator({
        msg: responseMessage.NOT_FOUND,
        statusCode: statusCode.NOT_FOUND,
      });
    }
    return data;
  } catch (error) {
    throw error;
  }
};

const getNftOwnersInfo = async (nftId: number) => {
  try {
    const getNftOwners = await prisma.user_has_nfts.findMany({
      where: {
        nftId: nftId,
      },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });
    const data = await Promise.all(
      getNftOwners.map((getNftOwner: any) => {
        const result = {
          user: {
            id: getNftOwner.user.id,
            name: getNftOwner.user.name,
            profileImage: getNftOwner.user.profileImage,
          },
        };
        return result;
      }),
    );
    return data;
  } catch (error) {
    throw error;
  }
};

const createNft = async (createNftDto: createNftDto) => {
  try {
    const data = await prisma.nfts.create({
      data: {
        ownerId: createNftDto.ownerId,
        nftName: createNftDto.nftName,
        image: createNftDto.image,
        description: createNftDto.description,
        authType: createNftDto.authType,
        options: createNftDto.options,
        chainType: createNftDto.chainType,
      },
    });
    return data;
  } catch (error) {
    throw error;
  }
};

const sendAuthMailForNft = async (
  userId: number,
  nftId: number,
  email: string,
) => {
  try {
    const userInfo: userInfo = {
      userId,
      nftId,
      email,
    };
    const codeInfo = JSON.stringify(userInfo);
    const code = await encodeByAES256(codeInfo.toString());
    await saveMailAuthCode(email, code);
    await sendMail(code, email);
    return code;
  } catch (error) {
    throw error;
  }
};
const verifyMailForNft = async (code: string) => {
  const codeInfo = await decodeByAES256(code);
  if (!codeInfo) {
    throw errorGenerator({
      msg: responseMessage.VERIFY_EMAIL_AUTH_FAIL,
      statusCode: statusCode.BAD_REQUEST,
    });
  }
  const userInfo: userInfo = JSON.parse(codeInfo);
  try {
    const verify = await verifyCode(userInfo.email, code);
    if (verify == false) {
      throw errorGenerator({
        msg: responseMessage.VERIFY_EMAIL_AUTH_FAIL,
        statusCode: statusCode.BAD_REQUEST,
      });
    }

    const nftInfo = await getNftInfo(+userInfo.nftId);
    const messageInfo = await getUserAndNftInfo(
      +userInfo.userId,
      +nftInfo.id,
      'NFT_MINTING_SUCCESS',
    );

    switch (nftInfo?.chainType) {
      case 'Ethereum': {
        const walletAddress = await getNftWalletAddress(
          +userInfo.userId,
          nftInfo?.chainType,
        );

        const nftContract = new ethers.Contract(
          nftInfo.nftAddress as string,
          benefitData.abi,
          etherProvider,
        );

        const mintNftInfo = await mintEtherNFT(
          nftContract,
          walletAddress as string,
        );

        const verifyInfo = await giveMintIdToUser(
          userInfo.userId,
          userInfo.nftId,
          mintNftInfo.mintId,
        );

        const data = {
          userId: verifyInfo.userId,
          nftId: verifyInfo.nftId,
          transactionHash: mintNftInfo.transactionHash,
          date: mintNftInfo.date,
        };

        await messageSender(messageInfo);
        return data;
      }
      case 'Polygon': {
        const walletAddress = await getNftWalletAddress(
          +userInfo.userId,
          nftInfo?.chainType,
        );

        const nftContract = new ethers.Contract(
          nftInfo.nftAddress as string,
          benefitData.abi,
          polygonProvider,
        );

        const mintNftInfo = await mintPolygonNFT(
          nftContract,
          walletAddress as string,
        );

        const verifyInfo = await giveMintIdToUser(
          userInfo.userId,
          userInfo.nftId,
          mintNftInfo.mintId,
        );

        const data = {
          userId: verifyInfo.userId,
          nftId: verifyInfo.nftId,
          transactionHash: mintNftInfo.transactionHash,
          date: mintNftInfo.date,
        };
        await messageSender(messageInfo);
        return data;
      }
      case 'Klaytn': {
        const walletAddress = await getNftWalletAddress(
          +userInfo.userId,
          nftInfo?.chainType,
        );

        const nftContract = new ethers.Contract(
          nftInfo.nftAddress as string,
          benefitData.abi,
          klaytnProvider,
        );

        const mintNftInfo = await mintKlaytnNFT(
          nftContract,
          walletAddress as string,
        );

        const verifyInfo = await giveMintIdToUser(
          userInfo.userId,
          userInfo.nftId,
          mintNftInfo.mintId,
        );

        const data = {
          userId: verifyInfo.userId,
          nftId: verifyInfo.nftId,
          transactionHash: mintNftInfo.transactionHash,
          date: mintNftInfo.date,
        };
        await messageSender(messageInfo);
        return data;
      }
      case 'Aptos': {
        const mintNftInfo = await mintAptosNFT(
          messageInfo.nftName! + ` #${userInfo.nftId}`,
          messageInfo.name!,
        );
        const verifyInfo = await giveMintIdToUser(
          userInfo.userId,
          userInfo.nftId,
          mintNftInfo!.mintId,
        );

        const data = {
          userId: verifyInfo.userId,
          nftId: verifyInfo.nftId,
          transactionHash: mintNftInfo!.mintTxHash,
          date: mintNftInfo!.date,
        };
        await messageSender(messageInfo);
        return data;
      }
      case 'Aurora': {
        const walletAddress = await getNftWalletAddress(
          +userInfo.userId,
          nftInfo?.chainType,
        );
        const nftContract = new ethers.Contract(
          nftInfo.nftAddress as string,
          benefitData.abi,
          auroraProvider,
        );
        const mintNftInfo = await mintAuroraNFT(
          nftContract,
          walletAddress as string,
        );
        const verifyInfo = await giveMintIdToUser(
          userInfo.userId,
          userInfo.nftId,
          mintNftInfo.mintId,
        );
        const data = {
          userId: verifyInfo.userId,
          nftId: verifyInfo.nftId,
          transactionHash: mintNftInfo.transactionHash,
          date: mintNftInfo.date,
        };
        await messageSender(messageInfo);
        return data;
      }
      case 'Oasys': {
        const walletAddress = await getNftWalletAddress(
          +userInfo.userId,
          nftInfo?.chainType,
        );
        const nftContract = new ethers.Contract(
          nftInfo.nftAddress as string,
          benefitData.abi,
          oasysProvider,
        );
        const mintNftInfo = await mintOasysNFT(
          nftContract,
          walletAddress as string,
        );
        const verifyInfo = await giveMintIdToUser(
          userInfo.userId,
          userInfo.nftId,
          mintNftInfo.mintId,
        );
        const data = {
          userId: verifyInfo.userId,
          nftId: verifyInfo.nftId,
          transactionHash: mintNftInfo.transactionHash,
          date: mintNftInfo.date,
        };
        await messageSender(messageInfo);
        return data;
      }
      case 'XPLA': {
        const walletAddress = await getNftWalletAddress(
          +userInfo.userId,
          nftInfo?.chainType,
        );
        const nftContract = new ethers.Contract(
          nftInfo.nftAddress as string,
          benefitData.abi,
          auroraProvider,
        );
        const mintNftInfo = await mintXplaNFT(
          nftContract,
          walletAddress as string,
        );
        const verifyInfo = await giveMintIdToUser(
          userInfo.userId,
          userInfo.nftId,
          mintNftInfo.mintId,
        );
        const data = {
          userId: verifyInfo.userId,
          nftId: verifyInfo.nftId,
          transactionHash: mintNftInfo.transactionHash,
          date: mintNftInfo.date,
        };
        await messageSender(messageInfo);
        return data;
      }
    }
  } catch (error) {
    await finishLoading(+userInfo.nftId);
    throw error;
  }
};
const giveMintIdToUser = async (
  userId: number,
  nftId: number,
  mintId: number,
) => {
  try {
    const data = await prisma.user_has_nfts.create({
      data: {
        userId,
        nftId,
        mintId,
      },
    });
    return data;
  } catch (error) {
    throw error;
  }
};

const getOwnNftList = async (userId: number) => {
  try {
    const nftsList = await prisma.user_has_nfts.findMany({
      where: {
        userId: userId,
      },
      select: {
        nftId: true,
      },
    });
    const data = await Promise.all(
      nftsList.map((nftList: any) => nftList.nftId),
    );
    return data;
  } catch (error) {
    throw error;
  }
};
const getCreateNftList = async (userId: number) => {
  try {
    const nftsList = await prisma.nfts.findMany({
      where: {
        ownerId: userId,
      },
      select: {
        id: true,
      },
    });
    const data = await Promise.all(nftsList.map((nftList: any) => nftList.id));
    return data;
  } catch (error) {
    throw error;
  }
};

const verifyPhotoForNft = async (
  userId: number,
  nftId: number,
  location: string,
) => {
  try {
    const duplicate = await prisma.admin.findFirst({
      where: {
        userId,
        nftId,
        deletedAt: null,
      },
    });
    if (duplicate) {
      throw errorGenerator({
        msg: responseMessage.DUPLICATE_REQUEST,
        statusCode: statusCode.BAD_REQUEST,
      });
    }
    const data = await prisma.admin.create({
      data: {
        userId: userId,
        nftId: nftId,
        image: location,
      },
    });
    return data;
  } catch (error) {
    throw error;
  }
};

const getRequestAuthPhoto = async (userId: number, nftId: number) => {
  try {
    const data = await prisma.admin.findFirst({
      where: {
        userId,
        nftId,
        deletedAt: null,
      },
    });
    if (!data) {
      return false;
    }
    return true;
  } catch (error) {
    throw error;
  }
};

const createReward = async (
  userId: number,
  nftId: number,
  rewardName: string,
  description: string,
  category: string,
  option: string,
) => {
  try {
    const findCreaterNft = await prisma.nfts.findFirst({
      where: {
        id: nftId,
        ownerId: userId,
      },
    });
    if (!findCreaterNft) {
      throw errorGenerator({
        msg: responseMessage.NOT_NFT_CREATER,
        statusCode: statusCode.BAD_REQUEST,
      });
    }
    const data = await prisma.admin_reward.create({
      data: {
        nftId,
        rewardName,
        description,
        category,
        option,
      },
    });

    await prisma.nfts.update({
      where: {
        id: nftId,
      },
      data: {
        isEdited: true,
      },
    });
    return data;
  } catch (error) {
    throw error;
  }
};

const updateRewardInfo = async (
  userId: number,
  nftId: number,
  rewardId: number,
  rewardName: string,
  description: string,
  category: string,
  option: string,
) => {
  try {
    const findCreaterNft = await prisma.nfts.findFirst({
      where: {
        id: nftId,
        ownerId: userId,
      },
    });
    if (!findCreaterNft) {
      throw errorGenerator({
        msg: responseMessage.NOT_NFT_CREATER,
        statusCode: statusCode.BAD_REQUEST,
      });
    }
    await prisma.admin_reward.update({
      where: {
        id: rewardId,
      },
      data: {
        rewardName,
        description,
        category,
        option,
      },
    });
    await prisma.nfts.update({
      where: {
        id: nftId,
      },
      data: {
        isEdited: true,
      },
    });
  } catch (error) {
    throw error;
  }
};
const getNftRewardDetailInfo = async (rewardId: number) => {
  try {
    const getRewardDetailInfo = await prisma.reward.findFirst({
      where: {
        id: rewardId,
      },
    });
    if (!getRewardDetailInfo) {
      return null;
    }
    const data = {
      rewardName: getRewardDetailInfo.rewardName,
      description: getRewardDetailInfo.description,
      category: getRewardDetailInfo.category,
      option: getRewardDetailInfo.option,
    };
    return data;
  } catch (error) {
    throw error;
  }
};
const getNftWalletAddress = async (userId: number, chainType: string) => {
  try {
    const findNft = await prisma.user_wallet.findFirst({
      where: {
        userId,
        chainType,
      },
    });
    if (!findNft) {
      throw errorGenerator({
        msg: responseMessage.READ_NFT_FAIL,
        statusCode: statusCode.BAD_REQUEST,
      });
    }
    return findNft.walletAddress;
  } catch (error) {
    throw error;
  }
};

const saveNftAddress = async (nftId: number, deployedNft: string) => {
  try {
    await prisma.nfts.update({
      where: {
        id: nftId,
      },
      data: {
        nftAddress: deployedNft,
      },
    });
  } catch (error) {
    throw error;
  }
};

const convertURLtoFile = async (nftId: number) => {
  try {
    const data = await prisma.nfts.findFirst({
      where: {
        id: nftId,
      },
    });
    if (!data) {
      throw errorGenerator({
        msg: responseMessage.BAD_REQUEST,
        statusCode: statusCode.BAD_REQUEST,
      });
    }
    const imageURL = data?.image;
    if (!imageURL) {
      throw errorGenerator({
        msg: responseMessage.NO_IMAGE,
        statusCode: statusCode.BAD_REQUEST,
      });
    }

    //* 파일 데이터 가공
    const fileKey = imageURL?.split('/').pop();
    if (!fileKey) {
      throw errorGenerator({
        msg: responseMessage.BAD_REQUEST,
        statusCode: statusCode.BAD_REQUEST,
      });
    }
    const params = {
      Bucket: config.bucketName,
      Key: fileKey,
    };

    s3ForConvertFile.getObject(params, (error, data) => {
      if (error) {
        throw error;
      }
      // console.log(data);
      // const blob = new Blob([JSON.stringify(data.Body)], {
      //   type: data.ContentType,
      // });
      // // const file = new File([blob], fileKey);
      // // console.log(file);
    });
  } catch (error) {
    throw error;
  }
};

const deleteNftReward = async (
  userId: number,
  nftId: number,
  rewardId: number,
) => {
  try {
    const findCreaterNft = await prisma.nfts.findFirst({
      where: {
        id: nftId,
        ownerId: userId,
      },
    });
    if (!findCreaterNft) {
      throw errorGenerator({
        msg: responseMessage.NOT_NFT_CREATER,
        statusCode: statusCode.BAD_REQUEST,
      });
    }
    await prisma.admin_reward.delete({
      where: {
        id: rewardId,
      },
    });
    await prisma.nfts.update({
      where: {
        id: nftId,
      },
      data: {
        isEdited: true,
      },
    });
  } catch (error) {
    throw error;
  }
};

const getNftInfo = async (nftId: number) => {
  const data = await prisma.nfts.findFirst({
    where: {
      id: nftId,
    },
  });
  if (!data) {
    throw errorGenerator({
      msg: responseMessage.BAD_REQUEST,
      statusCode: statusCode.BAD_REQUEST,
    });
  }
  return data;
};

const getToBeIntegratedNfts = async (userId: number, chainType: string) => {
  try {
    //* 유저가 가지고 있고, 해당 체인, transfer 되지 않은
    const findChainTypeNfts = await prisma.user_has_nfts.findMany({
      where: {
        userId,
        nfts: {
          chainType,
        },
      },
      select: {
        nfts: {
          select: {
            id: true,
            nftName: true,
            image: true,
            reward: true,
          },
        },
      },
    });

    //* 통합 NFT에 들어가있는 nftId 배열 만들기
    //* 리팩토링 고려

    const findIntegratedNftList = await prisma.integrated_has_nfts.findMany({
      where: {
        integrated_nfts: {
          creatorId: userId,
        },
      },
      select: {
        nftId: true,
      },
    });

    const IntegratedNftIdList = await Promise.all(
      findIntegratedNftList.map(
        (integreatedNftValue: any) => integreatedNftValue.nftId,
      ),
    );

    //* 통합 NFT에 포함되지 않은
    const isNotIntegratedNfts = await Promise.all(
      findChainTypeNfts.filter(
        (findChainTypeNft: any) =>
          !IntegratedNftIdList.includes(findChainTypeNft.nfts.id),
      ),
    );

    //* 반환 데이터 가공
    const data = await Promise.all(
      isNotIntegratedNfts.map(async (isNotIntegratedNft: any) => {
        const result = {
          id: isNotIntegratedNft.nfts.id,
          nftName: isNotIntegratedNft.nfts.nftName,
          image: isNotIntegratedNft.nfts.image,
          numberOfRewards: isNotIntegratedNft.nfts.reward.length,
        };
        return result;
      }),
    );
    return data;
  } catch (error) {
    throw error;
  }
};

const checkNftCreator = async (userId: number, nftId: number) => {
  try {
    const data = await prisma.nfts.findFirst({
      where: {
        id: nftId,
        ownerId: userId,
      },
    });
    if (!data) {
      throw errorGenerator({
        msg: responseMessage.NOT_NFT_CREATER,
        statusCode: statusCode.BAD_REQUEST,
      });
    }
    return true;
  } catch (error) {
    throw error;
  }
};

const getNftInfoWithReward = async (nftId: number) => {
  const getData = await prisma.nfts.findFirst({
    where: {
      id: nftId,
    },
    include: {
      admin_reward: true,
    },
  });
  if (!getData) {
    throw errorGenerator({
      msg: responseMessage.BAD_REQUEST,
      statusCode: statusCode.BAD_REQUEST,
    });
  }
  const benefit = await Promise.all(
    getData.admin_reward.map((benefit: any) => {
      const result = {
        name: benefit.rewardName,
        description: benefit.description,
      };
      return result;
    }),
  );
  const data = {
    nftName: getData.nftName,
    description: getData.description,
    image: getData.image,
    chainType: getData.chainType,
    nftAddress: getData.nftAddress,
    benefit: benefit,
  };
  return data;
};

const updateNftInfo = async (
  nftId: number,
  nftAddress: string,
  transactionDate: Date,
) => {
  try {
    await prisma.nfts.update({
      where: {
        id: nftId,
      },
      data: {
        nftAddress,
        transactionDate,
        isDeployed: true,
      },
    });
  } catch (error) {
    throw error;
  }
};

const updateAtNft = async (nftId: number, date: Date) => {
  await prisma.nfts.update({
    where: {
      id: nftId,
    },
    data: {
      updatedAt: date,
    },
  });
};

const createIntegratedNft = async (
  userId: number,
  nftIdArray: number[],
  chainType: string,
  tokenId?: number,
) => {
  try {
    for (let i = 0; i < nftIdArray.length; i++) {
      await prisma.user_has_nfts.updateMany({
        where: {
          userId,
          nftId: nftIdArray[i],
        },
        data: {
          isLocked: true,
        },
      });
    }
    const integratedNft = await prisma.integrated_nfts.create({
      data: {
        chainType,
        creatorId: userId,
        tokenId,
      },
    });
    await prisma.user_has_integrated_nfts.create({
      data: {
        integratedNftId: integratedNft.id,
        userId,
      },
    });
    for (let i = 0; i < nftIdArray.length; i++) {
      await prisma.integrated_has_nfts.create({
        data: {
          integratedNftId: integratedNft.id,
          nftId: nftIdArray[i],
        },
      });
    }
    return integratedNft;
  } catch (error) {
    throw error;
  }
};

const updateIntegratedNft = async (
  userId: number,
  integratedNftId: number,
  nftIdArray: number[],
) => {
  try {
    const checkUserNft = await prisma.user_has_integrated_nfts.findFirst({
      where: {
        integratedNftId,
        userId,
      },
    });
    if (!checkUserNft) {
      throw errorGenerator({
        msg: responseMessage.READ_INTEGRATED_NFT_FAIL,
        statusCode: statusCode.BAD_REQUEST,
      });
    }
    for (let i = 0; i < nftIdArray.length; i++) {
      await prisma.integrated_has_nfts.create({
        data: {
          integratedNftId: integratedNftId,
          nftId: nftIdArray[i],
        },
      });
      await prisma.user_has_nfts.updateMany({
        where: {
          userId,
          nftId: nftIdArray[i],
        },
        data: {
          isLocked: true,
        },
      });
    }
  } catch (error) {
    throw error;
  }
};
const getIntegratedNftInfo = async (id: number) => {
  try {
    const integratedInfo = await prisma.integrated_nfts.findFirst({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });
    if (!integratedInfo) {
      throw errorGenerator({
        msg: responseMessage.READ_INTEGRATED_NFT_FAIL,
        statusCode: statusCode.BAD_REQUEST,
      });
    }
    const getNftArrayInfo = await prisma.integrated_has_nfts.findMany({
      where: {
        integratedNftId: id,
      },
      include: {
        nfts: {
          include: {
            reward: true,
          },
        },
      },
    });
    const nftArray = await Promise.all(
      getNftArrayInfo.map((nftInfo: any) => {
        const result = {
          nftId: nftInfo.nfts.id,
          nftName: nftInfo.nfts.nftName,
          nftImage: nftInfo.nfts.image,
        };
        return result;
      }),
    );
    let rewardArray = [];
    for (let i = 0; i < getNftArrayInfo.length; i++) {
      for (let j = 0; j < getNftArrayInfo[i].nfts!.reward.length; j++) {
        const result = {
          nftId: getNftArrayInfo[i].nftId,
          nftName: getNftArrayInfo[i].nfts?.nftName,
          rewardName: getNftArrayInfo[i].nfts?.reward[j].rewardName,
          category: getNftArrayInfo[i].nfts?.reward[j].category,
          option: getNftArrayInfo[i].nfts?.reward[j].option,
        };
        rewardArray.push(result);
      }
    }
    const data = {
      id: integratedInfo?.id,
      userName: integratedInfo?.user?.name,
      chainType: integratedInfo?.chainType,
      createdAt: integratedInfo?.createdAt,
      contractId: integratedInfo?.tokenId,
      nftArray: nftArray,
      rewardArray: rewardArray,
    };
    return data;
  } catch (error) {
    throw error;
  }
};

const getIntegratedNftList = async (userId: number) => {
  try {
    const IntegratedNftList = await prisma.user_has_integrated_nfts.findMany({
      where: {
        userId,
      },
      include: {
        integrated_nfts: {
          select: {
            chainType: true,
          },
        },
      },
    });
    const data = await Promise.all(
      IntegratedNftList.map((integratedNft: any) => {
        const result = {
          chainType: integratedNft.integrated_nfts.chainType,
          integratedNftId: integratedNft.integratedNftId,
        };
        return result;
      }),
    );
    return data;
  } catch (error) {
    throw error;
  }
};

const deleteIntegratedNft = async (userId: number, id: number) => {
  try {
    const nfts = await prisma.integrated_has_nfts.findMany({
      where: {
        integratedNftId: id,
      },
      select: {
        nftId: true,
      },
    });
    await prisma.integrated_has_nfts.deleteMany({
      where: {
        integratedNftId: id,
      },
    });
    await prisma.user_has_integrated_nfts.deleteMany({
      where: {
        integratedNftId: id,
        userId,
      },
    });
    await prisma.integrated_nfts.delete({
      where: {
        id,
      },
    });
    await Promise.all(
      nfts.map(async (nft: any) => {
        await prisma.user_has_nfts.updateMany({
          where: { userId, nftId: nft.nftId },
          data: { isLocked: false },
        });
      }),
    );
  } catch (error) {
    throw error;
  }
};

const equalRewardInfo = async (nftId: number) => {
  try {
    const web3RewardInfo = await prisma.admin_reward.findMany({
      where: {
        nftId,
      },
    });

    // reward 정보 삭제
    await prisma.reward.deleteMany({
      where: {
        nftId,
      },
    });

    // admin_reward 정보를 reward 정보로 업데이트
    await Promise.all(
      web3RewardInfo.map(async (web3Reward: any) => {
        await prisma.reward.create({
          data: {
            nftId,
            rewardName: web3Reward.rewardName,
            description: web3Reward.description,
            category: web3Reward.category,
            option: web3Reward.option,
          },
        });
      }),
    );

    await prisma.nfts.update({
      where: {
        id: nftId,
      },
      data: {
        isEdited: false,
      },
    });
  } catch (error) {
    throw error;
  }
};

const equalReward = async (nftId: number) => {
  try {
    const web3RewardInfo = await prisma.admin_reward.findMany({
      where: {
        nftId,
      },
    });

    // admin_reward 정보를 reward 정보로 업데이트
    await Promise.all(
      web3RewardInfo.map(async (web3Reward: any) => {
        await prisma.reward.create({
          data: {
            nftId,
            rewardName: web3Reward.rewardName,
            description: web3Reward.description,
            category: web3Reward.category,
            option: web3Reward.option,
          },
        });
      }),
    );

    await prisma.nfts.update({
      where: {
        id: nftId,
      },
      data: {
        isEdited: false,
      },
    });
  } catch (error) {
    throw error;
  }
};

const saveMintId = async (userId: number, nftId: number, mintId: number) => {
  try {
    await prisma.user_has_nfts.updateMany({
      where: {
        userId,
        nftId,
      },
      data: {
        mintId,
      },
    });
  } catch (error) {
    throw error;
  }
};

const getMintId = async (userId: number, nftId: number) => {
  try {
    const data = await prisma.user_has_nfts.findFirst({
      where: {
        userId,
        nftId,
      },
      select: {
        mintId: true,
      },
    });

    if (!data) {
      throw errorGenerator({
        statusCode: statusCode.DB_ERROR,
        msg: responseMessage.DB_ERROR,
      });
    }
    return data.mintId;
  } catch (error) {
    throw error;
  }
};

const deleteNftInMyPage = async (userId: number, nftId: number) => {
  try {
    await prisma.user_has_nfts.deleteMany({
      where: {
        userId,
        nftId,
      },
    });
  } catch (error) {
    throw error;
  }
};

const startLoading = async (nftId: number) => {
  try {
    await prisma.nfts.update({
      where: {
        id: nftId,
      },
      data: {
        isLoading: true,
      },
    });
  } catch (error) {
    throw error;
  }
};

const finishLoading = async (nftId: number) => {
  try {
    await prisma.nfts.update({
      where: {
        id: nftId,
      },
      data: {
        isLoading: false,
      },
    });
  } catch (error) {
    throw error;
  }
};

const checkDeployedState = async (nftId: number) => {
  try {
    const data = await prisma.nfts.findFirst({
      where: {
        id: nftId,
      },
    });
    if (data?.isLoading) {
      throw errorGenerator({
        msg: responseMessage.IS_LOADING_NFT,
        statusCode: statusCode.BAD_REQUEST,
      });
    }
    if (data?.isDeployed) {
      throw errorGenerator({
        msg: responseMessage.IS_DEPLOYED_NFT,
        statusCode: statusCode.BAD_REQUEST,
      });
    }
  } catch (error) {
    throw error;
  }
};
const checkEditedState = async (nftId: number) => {
  try {
    const data = await prisma.nfts.findFirst({
      where: {
        id: nftId,
      },
    });
    if (data?.isLoading) {
      throw errorGenerator({
        msg: responseMessage.IS_LOADING_NFT,
        statusCode: statusCode.BAD_REQUEST,
      });
    }
    if (!data?.isEdited) {
      throw errorGenerator({
        msg: responseMessage.IS_DEPLOYED_NFT,
        statusCode: statusCode.BAD_REQUEST,
      });
    }
  } catch (error) {
    throw error;
  }
};

const findNftByName = async (nftName: string) => {
  try {
    const nftData = await prisma.nfts.findMany({ where: { nftName } });

    return nftData;
  } catch (error) {
    throw errorGenerator({
      msg: responseMessage.BAD_REQUEST,
      statusCode: statusCode.BAD_REQUEST,
    });
  }
};

const checkNftOwner = async (userId: number, nftId: number) => {
  try {
    const check = await prisma.user_has_nfts.findFirst({
      where: {
        userId,
        nftId,
      },
    });
    if (!check) {
      return false;
    }
    return true;
  } catch (error) {
    throw error;
  }
};

const getNftAddressList = async (nftIdArray: number[]) => {
  try {
    const nftAddressList = await Promise.all(
      nftIdArray.map(async (id) => {
        const nft = await prisma.nfts.findFirst({
          where: {
            id,
          },
          select: {
            nftAddress: true,
          },
        });
        return nft?.nftAddress;
      }),
    );
    return nftAddressList;
  } catch (error) {
    throw error;
  }
};

const getMintIdList = async (userId: number, nftIdArray: number[]) => {
  try {
    const mintIdList = await Promise.all(
      nftIdArray.map(async (nftId) => {
        const mintNft = await prisma.user_has_nfts.findFirst({
          where: {
            userId,
            nftId,
          },
          select: {
            mintId: true,
          },
        });
        return mintNft?.mintId!;
      }),
    );
    return mintIdList;
  } catch (error) {
    throw error;
  }
};

const getNftNameList = async (nftIdArray: number[]) => {
  try {
    const nftNameList: string[] = await Promise.all(
      nftIdArray.map(async (id) => {
        const nft = await prisma.nfts.findFirst({
          where: {
            id,
          },
          select: {
            nftName: true,
          },
        });
        return nft?.nftName!;
      }),
    );
    return nftNameList;
  } catch (error) {
    throw error;
  }
};

const getMintIdWithNftAddress = async (userId: number, nftId: number) => {
  try {
    const data = await prisma.user_has_nfts.findFirst({
      where: {
        userId,
        nftId,
        isLocked: false,
      },
      select: {
        mintId: true,
        nfts: {
          select: {
            nftAddress: true,
            chainType: true,
            nftName: true,
          },
        },
      },
    });
    if (!data?.mintId || !data.nfts.nftAddress) {
      throw errorGenerator({
        msg: responseMessage.BAD_REQUEST,
        statusCode: statusCode.BAD_REQUEST,
      });
    }
    return data;
  } catch (error) {
    throw error;
  }
};

const getLastIntegratedNft = async () => {
  const lastIntegratedNft = await prisma.integrated_nfts.findMany({
    orderBy: { createdAt: 'desc' },
    take: 1,
  });
  if (!lastIntegratedNft) {
    throw errorGenerator({
      msg: responseMessage.READ_NFT_FAIL,
      statusCode: statusCode.BAD_REQUEST,
    });
  }
  return lastIntegratedNft[0];
};

const checkChainType = async (id: number) => {
  const data = await prisma.integrated_nfts.findFirst({
    where: {
      id,
    },
    select: {
      chainType: true,
    },
  });
  return data;
};

const takeExternalNft = async (
  userId: number,
  nftName: string,
  image: string,
  chainType: string,
  nftAddress: string,
) => {
  const check = await prisma.nfts.findFirst({
    where: {
      OR: [
        {
          nftAddress,
        },
        {
          originAddress: nftAddress,
        },
      ],
    },
    select: {
      id: true,
      nftAddress: true,
      originAddress: true,
      isExternal: true,
    },
  });
  if (check?.isExternal === false)
    return { address: config.walletAddress, isExternal: false };
  if (check) {
    return {
      address: check.nftAddress,
      isExternal: true,
    };
  }
  switch (chainType) {
    case 'Ethereum': {
      const wrapNFT = await deployWrapNFT(nftName, image, nftAddress);
      await prisma.nfts.create({
        data: {
          ownerId: userId,
          nftName,
          image,
          chainType,
          nftAddress: wrapNFT.nftAddress,
          originAddress: nftAddress,
          isDeployed: true,
          isExternal: true,
        },
      });
      return {
        address: wrapNFT.nftAddress,
        isExternal: true,
      };
    }
    case 'Polygon': {
      const wrapNFT = await deployPolygonWrapNFT(nftName, image, nftAddress);
      await prisma.nfts.create({
        data: {
          ownerId: userId,
          nftName,
          image,
          chainType,
          nftAddress: wrapNFT.nftAddress,
          originAddress: nftAddress,
          isDeployed: true,
          isExternal: true,
        },
      });
      return {
        address: wrapNFT.nftAddress,
        isExternal: true,
      };
    }
    case 'Klaytn': {
      const wrapNFT = await deployKlaytnWrapNFT(nftName, image, nftAddress);
      await prisma.nfts.create({
        data: {
          ownerId: userId,
          nftName,
          image,
          chainType,
          nftAddress: wrapNFT.nftAddress,
          originAddress: nftAddress,
          isDeployed: true,
          isExternal: true,
        },
      });
      return {
        address: wrapNFT.nftAddress,
        isExternal: true,
      };
    }
    case 'Aurora': {
      const wrapNFT = await deployAuroraWrapNFT(nftName, image, nftAddress);
      await prisma.nfts.create({
        data: {
          ownerId: userId,
          nftName,
          image,
          chainType,
          nftAddress: wrapNFT.nftAddress,
          originAddress: nftAddress,
          isDeployed: true,
          isExternal: true,
        },
      });
      return {
        address: wrapNFT.nftAddress,
        isExternal: true,
      };
    }
    case 'Oasys': {
      const wrapNFT = await deployOasysWrapNFT(nftName, image, nftAddress);
      await prisma.nfts.create({
        data: {
          ownerId: userId,
          nftName,
          image,
          chainType,
          nftAddress: wrapNFT.nftAddress,
          originAddress: nftAddress,
          isDeployed: true,
          isExternal: true,
        },
      });
      return {
        address: wrapNFT.nftAddress,
        isExternal: true,
      };
    }
  }
};

const mintExternalNft = async (
  userId: number,
  chainType: string,
  nftAddress: string,
  isExternal: boolean,
  tokenId: number,
) => {
  if (isExternal === false) {
    const nft = await prisma.nfts.findFirst({
      where: {
        nftAddress,
      },
      select: {
        id: true,
      },
    });
    if (!nft) {
      throw errorGenerator({
        msg: responseMessage.BAD_REQUEST,
        statusCode: statusCode.BAD_REQUEST,
      });
    }
    await prisma.user_has_nfts.create({
      data: {
        userId,
        nftId: nft?.id as number,
        mintId: tokenId,
      },
    });
  }
  if (isExternal === true) {
    switch (chainType) {
      case 'Ethereum': {
        const nft = await prisma.nfts.findFirst({
          where: {
            originAddress: nftAddress,
          },
          select: {
            id: true,
            nftAddress: true,
            originAddress: true,
          },
        });
        if (!nft) {
          throw errorGenerator({
            msg: responseMessage.BAD_REQUEST,
            statusCode: statusCode.BAD_REQUEST,
          });
        }
        const wrapNFTContract = new ethers.Contract(
          nft.nftAddress as string,
          wrapNFTData.abi,
          etherProvider,
        );
        const ownerShip = await checkNFTOwnership(
          wrapNFTContract,
          tokenId.toString(),
        );
        if (ownerShip) {
          const mint = await mintWrapNFT(
            wrapNFTContract,
            config.walletAddress,
            nft.originAddress as string,
            tokenId,
          );
          await prisma.user_has_nfts.create({
            data: {
              userId,
              nftId: nft?.id as number,
              mintId: mint.mintId,
            },
          });
        }
        break;
      }
      case 'Polygon': {
        const nft = await prisma.nfts.findFirst({
          where: {
            originAddress: nftAddress,
          },
          select: {
            id: true,
            nftAddress: true,
            originAddress: true,
          },
        });
        if (!nft) {
          throw errorGenerator({
            msg: responseMessage.BAD_REQUEST,
            statusCode: statusCode.BAD_REQUEST,
          });
        }
        const wrapNFTContract = new ethers.Contract(
          nft.nftAddress as string,
          wrapNFTData.abi,
          etherProvider,
        );
        const ownerShip = await checkNFTOwnership(
          wrapNFTContract,
          tokenId.toString(),
        );
        if (ownerShip) {
          const mint = await mintPolygonWrapNFT(
            wrapNFTContract,
            config.walletAddress,
            nft.originAddress as string,
            tokenId,
          );
          await prisma.user_has_nfts.create({
            data: {
              userId,
              nftId: nft?.id as number,
              mintId: mint.mintId,
            },
          });
        }
        break;
      }
      case 'Klaytn': {
        const nft = await prisma.nfts.findFirst({
          where: {
            originAddress: nftAddress,
          },
          select: {
            id: true,
            nftAddress: true,
            originAddress: true,
          },
        });
        if (!nft) {
          throw errorGenerator({
            msg: responseMessage.BAD_REQUEST,
            statusCode: statusCode.BAD_REQUEST,
          });
        }
        const wrapNFTContract = new ethers.Contract(
          nft.nftAddress as string,
          wrapNFTData.abi,
          etherProvider,
        );
        const ownerShip = await checkNFTOwnership(
          wrapNFTContract,
          tokenId.toString(),
        );
        if (ownerShip) {
          const mint = await mintKlaytnWrapNFT(
            wrapNFTContract,
            config.walletAddress,
            nft.originAddress as string,
            tokenId,
          );
          await prisma.user_has_nfts.create({
            data: {
              userId,
              nftId: nft?.id as number,
              mintId: mint.mintId,
            },
          });
        }
        break;
      }
      case 'Aurora': {
        const nft = await prisma.nfts.findFirst({
          where: {
            originAddress: nftAddress,
          },
          select: {
            id: true,
            nftAddress: true,
            originAddress: true,
          },
        });
        if (!nft) {
          throw errorGenerator({
            msg: responseMessage.BAD_REQUEST,
            statusCode: statusCode.BAD_REQUEST,
          });
        }
        const wrapNFTContract = new ethers.Contract(
          nft.nftAddress as string,
          wrapNFTData.abi,
          etherProvider,
        );
        const ownerShip = await checkNFTOwnership(
          wrapNFTContract,
          tokenId.toString(),
        );
        if (ownerShip) {
          const mint = await mintAuroraWrapNFT(
            wrapNFTContract,
            config.walletAddress,
            nft.originAddress as string,
            tokenId,
          );
          await prisma.user_has_nfts.create({
            data: {
              userId,
              nftId: nft?.id as number,
              mintId: mint.mintId,
            },
          });
        }
        break;
      }
      case 'Oasys': {
        const nft = await prisma.nfts.findFirst({
          where: {
            originAddress: nftAddress,
          },
          select: {
            id: true,
            nftAddress: true,
            originAddress: true,
          },
        });
        if (!nft) {
          throw errorGenerator({
            msg: responseMessage.BAD_REQUEST,
            statusCode: statusCode.BAD_REQUEST,
          });
        }
        const wrapNFTContract = new ethers.Contract(
          nft.nftAddress as string,
          wrapNFTData.abi,
          etherProvider,
        );
        const ownerShip = await checkNFTOwnership(
          wrapNFTContract,
          tokenId.toString(),
        );
        if (ownerShip) {
          const mint = await mintOasysWrapNFT(
            wrapNFTContract,
            config.walletAddress,
            nft.originAddress as string,
            tokenId,
          );
          await prisma.user_has_nfts.create({
            data: {
              userId,
              nftId: nft?.id as number,
              mintId: mint.mintId,
            },
          });
        }
        break;
      }
    }
  }
};

export default {
  getInfoByType,
  getNftDetailInfo,
  getNftOwnersInfo,
  createNft,
  sendAuthMailForNft,
  verifyMailForNft,
  giveMintIdToUser,
  getOwnNftList,
  getCreateNftList,
  verifyPhotoForNft,
  getRequestAuthPhoto,
  createReward,
  updateRewardInfo,
  getNftRewardDetailInfo,
  getNftWalletAddress,
  saveNftAddress,
  convertURLtoFile,
  deleteNftReward,
  //updateNftFlag,
  getNftInfo,
  //getNftMoveFlagList,
  getToBeIntegratedNfts,
  checkNftCreator,
  getNftInfoWithReward,
  updateNftInfo,
  updateAtNft,
  createIntegratedNft,
  updateIntegratedNft,
  getIntegratedNftInfo,
  getIntegratedNftList,
  deleteIntegratedNft,
  equalRewardInfo,
  getUserAndNftInfo,
  makeRecipList,
  equalReward,
  saveMintId,
  getMintId,
  deleteNftInMyPage,
  startLoading,
  finishLoading,
  checkDeployedState,
  checkEditedState,
  findNftByName,
  checkNftOwner,
  getNftAddressList,
  getMintIdList,
  getNftNameList,
  getMintIdWithNftAddress,
  getLastIntegratedNft,
  checkChainType,
  takeExternalNft,
  mintExternalNft,
};
