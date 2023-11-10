import { PrismaClient } from '@prisma/client';
import errorGenerator from '../middlewares/error/errorGenerator';
import { responseMessage, statusCode } from '../modules/constants';
const prisma = new PrismaClient();

const getRequestUser = async (userId: number, nftId: number) => {
  const users = await prisma.admin.findMany({
    where: {
      nfts: {
        ownerId: userId,
      },
      nftId: nftId,
      deletedAt: null,
    },
    select: {
      id: true,
      user: {
        select: {
          id: true,
          name: true,
          profileImage: true,
        },
      },
      image: true,
    },
  });
  const data = await Promise.all(
    users.map((user: any) => {
      const result = {
        id: user.id,
        userId: user.user.id,
        name: user.user.name,
        profileImage: user.user.profileImage,
        image: user.image,
      };

      return result;
    }),
  );
  return data;
};

const getApproveInfo = async (id: number) => {
  try {
    const findUserIdAndNftId = await prisma.admin.findFirst({
      where: {
        id,
      },
      select: {
        userId: true,
        nftId: true,
      },
    });
    if (!findUserIdAndNftId) {
      throw errorGenerator({
        msg: responseMessage.BAD_REQUEST,
        statusCode: statusCode.BAD_REQUEST,
      });
    }
    return findUserIdAndNftId;
  } catch (error) {
    throw error;
  }
};

const approveNft = async (tableId: number, userId: number, nftId: number) => {
  try {
    const userGetNft = await prisma.user_has_nfts.create({
      data: {
        userId,
        nftId,
      },
    });
    await prisma.admin.update({
      where: { id: tableId },
      data: {
        deletedAt: new Date(),
      },
    });
    return userGetNft;
  } catch (error) {
    throw error;
  }
};

const rejectNft = async (id: number, reason: string) => {
  try {
    const findUserIdAndNftId = await prisma.admin.findFirst({
      where: {
        id,
      },
      select: {
        userId: true,
        nftId: true,
      },
    });
    if (!findUserIdAndNftId) {
      throw errorGenerator({
        msg: responseMessage.BAD_REQUEST,
        statusCode: statusCode.BAD_REQUEST,
      });
    }
    await prisma.admin.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
        rejectReason: reason,
      },
    });
    return findUserIdAndNftId;
  } catch (error) {
    throw error;
  }
};

const getAdminNftRewardList = async (nftId: number) => {
  try {
    const rewards = await prisma.admin_reward.findMany({
      where: {
        nftId: nftId,
      },
      select: {
        id: true,
        nftId: true,
        rewardName: true,
        description: true,
      },
    });
    return rewards;
  } catch (error) {
    throw error;
  }
};

const getAdminNftRewardDetail = async (rewardId: number) => {
  try {
    const rewardDetail = await prisma.admin_reward.findFirst({
      where: {
        id: rewardId,
      },
      select: {
        id: true,
        rewardName: true,
        description: true,
        category: true,
        option: true,
      },
    });
    return rewardDetail;
  } catch (error) {
    throw error;
  }
};
export default {
  getRequestUser,
  getApproveInfo,
  rejectNft,
  getAdminNftRewardList,
  getAdminNftRewardDetail,
  approveNft,
};
