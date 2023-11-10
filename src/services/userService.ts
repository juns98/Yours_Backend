import { chargeYrpDto } from './../interfaces/user/DTO';
import { userCreateDto } from '../interfaces/user/DTO';
import auth from '../config/auth';
import { PrismaClient } from '@prisma/client';
import errorGenerator from '../middlewares/error/errorGenerator';
import { responseMessage, statusCode } from '../modules/constants';
const prisma = new PrismaClient();

export type SocialPlatform = 'KAKAO' | 'GOOGLE';

//* 소셜 유저 정보 가져오기
const getSocialUser = async (accesstoken: string, social: SocialPlatform) => {
  try {
    switch (social) {
      case 'KAKAO': {
        const user = await auth.kakaoAuth(accesstoken);
        return user;
      }
      case 'GOOGLE': {
        const user = await auth.googleAuth(accesstoken);
        return user;
      }
    }
  } catch (error) {
    throw error;
  }
};

//* 소셜 로그인 유저 조회
const findUserById = async (userId: string) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        snsId: userId,
      },
    });
    return user;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

//* 유저 회원가입
const signUpUser = async (
  userCreateDto: userCreateDto,
  refreshToken: string,
) => {
  try {
    const user = await prisma.user.create({
      data: {
        snsId: userCreateDto.snsId,
        name: userCreateDto.nickname,
        profileImage: userCreateDto.profileImage,
        email: userCreateDto.email,
        phone: userCreateDto.phone,
        social: userCreateDto.social,
        refreshToken: refreshToken,
        isMarketing: userCreateDto.isMarketing,
        secret: userCreateDto.secret,
        language: userCreateDto.language,
      },
    });

    for (let i = 0; i < userCreateDto.walletAddress.length; i++) {
      await prisma.user_wallet.create({
        data: {
          userId: user.id,
          chainType: userCreateDto.walletAddress[i].chainType,
          walletAddress: userCreateDto.walletAddress[i].address,
        },
      });
    }
    return user;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

//* refreshToken 수정
const updateRefreshToken = async (id: number, refreshToken: string) => {
  try {
    await prisma.user.update({
      where: {
        id,
      },
      data: {
        refreshToken,
      },
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};

//* 유효한 refreshToken을 가지고 있는 유저 찾기
const findUserByRfToken = async (refreshToken: string) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        refreshToken,
      },
    });
    return user;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const getUserInfo = async (userId: number) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw errorGenerator({
        msg: responseMessage.NOT_FOUND,
        statusCode: statusCode.NOT_FOUND,
      });
    }
    const data = {
      id: userId,
      name: user.name,
      email: user.email,
      image: user.profileImage,
      phoneNumber: user.phone,
      secret: user.secret,
      language: user.language,
    };
    return data;
  } catch (error) {
    throw error;
  }
};

const updateProfilePhoto = async (userId: number, location: string) => {
  try {
    const data = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        profileImage: location,
      },
    });
    const result = {
      profileImage: data.profileImage,
    };
    return result;
  } catch (error) {
    throw error;
  }
};

const updateUserPhoneNumber = async (userId: number, phoneNumber: string) => {
  try {
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        phone: phoneNumber,
      },
    });
  } catch (error) {
    throw error;
  }
};

const updateUserEmail = async (userId: number, email: string) => {
  try {
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        email,
      },
    });
  } catch (error) {
    throw error;
  }
};

const updateNickName = async (userId: number, nickname: string) => {
  try {
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name: nickname,
      },
    });
  } catch (error) {
    throw error;
  }
};

const getQuestInfo = async (userId: number) => {
  try {
    const data = await prisma.user.findFirst({
      where: {
        id: userId,
      },
      select: {
        isQuest: true,
      },
    });
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

const updateQuestInfo = async (userId: number) => {
  try {
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isQuest: true,
      },
    });
  } catch (error) {
    throw error;
  }
};

const getWalletInfo = async (userId: number) => {
  try {
    const data = await prisma.user_wallet.findMany({
      where: {
        userId: userId,
      },
      select: {
        chainType: true,
        walletAddress: true,
      },
    });
    return data;
  } catch (error) {
    throw error;
  }
};

const updateSecret = async (userId: number, secret: string) => {
  try {
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        secret,
      },
    });
  } catch (error) {
    throw error;
  }
};

const checkYoursWallet = async (address: string) => {
  try {
    const checkYoursWallet = await prisma.user_wallet.findFirst({
      where: {
        walletAddress: address,
      },
    });

    if (checkYoursWallet) {
      return true;
    }

    return false;
  } catch (error) {
    throw error;
  }
};

const saveContractWalletAddress = async (
  userId: number,
  walletAddress: string,
) => {
  try {
    const data = await prisma.user_contractWallet.create({
      data: {
        userId,
        chainType: 'Ethereum',
        walletAddress,
      },
    });
    return data;
  } catch (error) {
    throw error;
  }
};

const updateLanguage = async (userId: number, language: string) => {
  try {
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        language,
      },
    });
  } catch (error) {
    throw error;
  }
};

const findRfTokenById = async (userId: number) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
      select: {
        refreshToken: true,
      },
    });
    return user;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const chargeYrp = async (userId: number, chargeYrpDto: chargeYrpDto) => {
  try {
    const {
      type,
      isCompleted,
      chargedAt,
      transactionHash,
      walletAddress,
      stableChain,
      stableAmount,
      yrpAmount,
      feeAmount,
    } = chargeYrpDto;
    await prisma.point.create({
      data: {
        userId,
        type,
        isCompleted,
        chargedAt,
        transactionHash,
        walletAddress,
        stableChain,
        stableAmount,
        yrpAmount,
        feeAmount,
      },
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const getUserYrp = async (userId: number) => {
  try {
    const initial = await prisma.point.findFirst({
      where: {
        userId,
      },
    });
    if (!initial) return 0;
    const sellerPoint = await prisma.point.groupBy({
      by: ['userId'],
      where: {
        userId,
      },
      _sum: {
        yrpAmount: true,
      },
    });
    return sellerPoint[0]._sum.yrpAmount?.toFixed(6);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const getUserYrpDetail = async (userId: number) => {
  try {
    const data = await prisma.point.findMany({
      where: {
        userId,
      },
    });
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const getMyPage = async (userId: number, options: string) => {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
    select: {
      name: true,
      profileImage: true,
    },
  });
  if (!user) {
    throw errorGenerator({
      msg: responseMessage.NOT_FOUND,
      statusCode: statusCode.NOT_FOUND,
    });
  }
  switch (options) {
    case 'own': {
      const nftsInfo = await prisma.user_has_nfts.findMany({
        where: {
          userId,
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
      const soldNftsInfo = await prisma.dashboard.findMany({
        where: {
          seller: userId,
          buyer: null,
        },
        select: {
          id: true,
          price: true,
          nfts: {
            select: {
              user: {
                select: {
                  name: true,
                  profileImage: true,
                },
              },
              id: true,
              nftName: true,
              image: true,
            },
          },
        },
      });
      const data = await Promise.all(
        nftsInfo.map((nftInfo: any) => {
          for (let i = 0; i < soldNftsInfo.length; i++) {
            if (nftInfo.nfts.id === soldNftsInfo[i].nfts.id) {
              const result = {
                dashboardId: soldNftsInfo[i].id,
                nftId: nftInfo.nfts.id,
                nftName: nftInfo.nfts.nftName,
                image: nftInfo.nfts.image,
                price: soldNftsInfo[i].price,
                selling: true,
              };
              return result;
            }
          }
          const result = {
            dashboardId: null,
            nftId: nftInfo.nfts.id,
            nftName: nftInfo.nfts.nftName,
            image: nftInfo.nfts.image,
            numberOfRewards: nftInfo.nfts.reward.length,
            selling: false,
          };
          return result;
        }),
      );
      return data;
    }
    case 'sold': {
      const soldNftsInfo = await prisma.dashboard.findMany({
        where: {
          seller: userId,
          NOT: {
            buyer: null,
          },
        },
        select: {
          id: true,
          price: true,
          nfts: {
            select: {
              user: {
                select: {
                  name: true,
                  profileImage: true,
                },
              },
              id: true,
              nftName: true,
              image: true,
            },
          },
        },
      });

      const soldNfts = await Promise.all(
        soldNftsInfo.map((soldNft: any) => {
          const result = {
            dashboardId: soldNft.id,
            nftId: soldNft.nfts.id,
            nftName: soldNft.nfts.nftName,
            image: soldNft.nfts.image,
            price: soldNft.price,
          };
          return result;
        }),
      );
      const data = {
        user: {
          name: user.name,
          image: user.profileImage,
        },
        nfts: soldNfts,
      };
      return data;
    }
    case 'bookmark': {
      const bookmarkNftInfo = await prisma.like_nfts.findMany({
        where: {
          userId,
        },
        select: {
          dashboard: {
            select: {
              id: true,
              nfts: {
                select: {
                  user: {
                    select: {
                      name: true,
                      profileImage: true,
                    },
                  },
                  nftName: true,
                  image: true,
                  id: true,
                },
              },
              price: true,
            },
          },
        },
      });
      const bookmarkNfts = await Promise.all(
        bookmarkNftInfo.map((bookmarkNft: any) => {
          const result = {
            dashboardId: bookmarkNft.dashboard.id,
            nftId: bookmarkNft.dashboard.nfts.id,
            nftName: bookmarkNft.dashboard.nfts.nftName,
            image: bookmarkNft.dashboard.nfts.image,
            price: bookmarkNft.dashboard.price,
          };
          return result;
        }),
      );
      const data = {
        user: {
          name: user.name,
          image: user.profileImage,
        },
        nfts: bookmarkNfts,
      };
      return data;
    }
    default:
      throw errorGenerator({
        msg: responseMessage.NOT_FOUND,
        statusCode: statusCode.NOT_FOUND,
      });
  }
};

const getMyPageForBuyer = async (userId: number, options: string) => {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
    select: {
      name: true,
      profileImage: true,
    },
  });
  if (!user) {
    throw errorGenerator({
      msg: responseMessage.NOT_FOUND,
      statusCode: statusCode.NOT_FOUND,
    });
  }
  switch (options) {
    case 'sell': {
      const sellNftsInfo = await prisma.dashboard.findMany({
        where: {
          seller: userId,
          buyer: null,
        },
        select: {
          id: true,
          price: true,
          nfts: {
            select: {
              user: {
                select: {
                  name: true,
                  profileImage: true,
                },
              },
              id: true,
              nftName: true,
              image: true,
            },
          },
        },
      });
      const sellNfts = await Promise.all(
        sellNftsInfo.map((sellNft: any) => {
          const result = {
            dashboardId: sellNft.id,
            nftId: sellNft.nfts.id,
            nftName: sellNft.nfts.nftName,
            image: sellNft.nfts.image,
            price: sellNft.price,
          };
          return result;
        }),
      );
      const data = {
        user: {
          name: user.name,
          image: user.profileImage,
        },
        nfts: sellNfts,
      };
      return data;
    }
    case 'sold': {
      const soldNftsInfo = await prisma.dashboard.findMany({
        where: {
          seller: userId,
          NOT: {
            buyer: null,
          },
        },
        select: {
          id: true,
          price: true,
          nfts: {
            select: {
              user: {
                select: {
                  name: true,
                  profileImage: true,
                },
              },
              id: true,
              nftName: true,
              image: true,
            },
          },
        },
      });
      const soldNfts = await Promise.all(
        soldNftsInfo.map((soldNft: any) => {
          const result = {
            dashboardId: soldNft.id,
            nftId: soldNft.nfts.id,
            nftName: soldNft.nfts.nftName,
            image: soldNft.nfts.image,
            price: soldNft.price,
          };
          return result;
        }),
      );
      const data = {
        user: {
          name: user.name,
          image: user.profileImage,
        },
        nfts: soldNfts,
      };
      return data;
    }
    default:
      throw errorGenerator({
        msg: responseMessage.NOT_FOUND,
        statusCode: statusCode.NOT_FOUND,
      });
  }
};
export default {
  getSocialUser,
  findUserById,
  signUpUser,
  updateRefreshToken,
  findUserByRfToken,
  getUserInfo,
  updateProfilePhoto,
  updateUserPhoneNumber,
  updateUserEmail,
  updateNickName,
  getQuestInfo,
  updateQuestInfo,
  getWalletInfo,
  updateSecret,
  checkYoursWallet,
  saveContractWalletAddress,
  updateLanguage,
  findRfTokenById,
  chargeYrp,
  getUserYrp,
  getUserYrpDetail,
  getMyPage,
  getMyPageForBuyer,
};
