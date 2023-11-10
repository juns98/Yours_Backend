import { PrismaClient } from '@prisma/client';
import errorGenerator from '../middlewares/error/errorGenerator';
import { responseMessage, statusCode } from '../modules/constants';
const prisma = new PrismaClient();

const getSearchByName = async (
  userId: number,
  type: string,
  keyword: string,
) => {
  try {
    switch (type) {
      case 'own': {
        const nftsInfo = await prisma.user_has_nfts.findMany({
          where: {
            userId: userId,
            nfts: {
              nftName: {
                contains: keyword,
              },
            },
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
          },
        });
        const data = await Promise.all(
          nftsInfo.map((nftInfo: any) => {
            const result = {
              id: nftInfo.nftId,
              nftName: nftInfo.nfts.nftName,
              image: nftInfo.nfts.image,
              rewards: nftInfo.nfts.reward.length,
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
            OR: [
              {
                nfts: {
                  nftName: {
                    contains: keyword,
                  },
                },
              },
              // {
              //   rewardName: {
              //     contains: keyword,
              //   },
              // },
            ],
          },
          select: {
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
              nftId: nftsRewardInfo[i].nfts.id,
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
            nftName: {
              contains: keyword,
            },
          },
          select: {
            id: true,
            nftName: true,
            image: true,
            reward: true,
          },
        });
        const data = await Promise.all(
          ownNftsInfo.map((ownNftInfo: any) => {
            const result = {
              id: ownNftInfo.id,
              nftName: ownNftInfo.nftName,
              image: ownNftInfo.image,
              rewards: ownNftInfo.reward.length,
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
export default { getSearchByName };
