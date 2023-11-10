import { PrismaClient } from '@prisma/client';
import errorGenerator from '../middlewares/error/errorGenerator';
import { responseMessage, statusCode } from '../modules/constants';
import {
  approveToSell,
  nftBuy,
  nftSell,
} from '../contract/Ethereum/etherContract';
import config from '../config';
import nftService from './nftService';
import {
  approveToSellPolygon,
  polygonNftBuy,
  polygonNftSell,
} from '../contract/Polygon/polygonContract';
import {
  approveToSellKlaytn,
  klaytnNftBuy,
  klaytnNftSell,
} from '../contract/Klaytn/KlaytnContract';
import {
  approveToSellAurora,
  auroraNftBuy,
  auroraNftSell,
} from '../contract/Aurora/AuroraContract';
import {
  approveToSellOasys,
  oasysNftBuy,
  oasysNftSell,
} from '../contract/Oasys/OasysContract';
const prisma = new PrismaClient();

const getDashBoardData = async (dashboardId: number) => {
  return await prisma.dashboard.findFirst({ where: { id: dashboardId } });
};

const getMarketNftList = async (
  category: string,
  sort: string,
  take: number,
  page: number,
) => {
  let nfts: any;
  if (sort === 'lastest') {
    if (category === 'all') {
      nfts = await getAllNftList(take, page);
    } else {
      nfts = await orderStandardLastest(category, take, page);
    }
  }
  if (sort === 'hottest') {
    if (category === 'all') {
      nfts = await getAllNftList(take, page);
    } else {
      nfts = await orderStandardHottest(category, take, page);
    }
  }
  const data = nfts!.map((info: any) => {
    const result = {
      dashboardId: info.id,
      nftId: info.nfts.id,
      nftName: info.nfts.nftName,
      nftImage: info.nfts.image,
      nftOwner: info.user_dashboard_sellerTouser.name,
      nftPrice: info.price,
    };
    return result;
  });
  return data;
};

const orderStandardLastest = async (
  category: string,
  take: number,
  page: number,
) => {
  const data = await prisma.dashboard.findMany({
    where: {
      nfts: {
        category,
      },
      buyer: null,
    },
    skip: (page - 1) * take,
    take,
    select: {
      nfts: {
        select: {
          id: true,
          nftName: true,
          image: true,
        },
      },
      user_dashboard_sellerTouser: {
        select: {
          name: true,
        },
      },
      id: true,
      price: true,
    },
    orderBy: {
      nfts: {
        createdAt: 'desc',
      },
    },
  });
  return data;
};

const orderStandardHottest = async (
  category: string,
  take: number,
  page: number,
) => {
  const data = await prisma.dashboard.findMany({
    where: {
      nfts: {
        category,
      },
      buyer: null,
    },
    skip: (page - 1) * take,
    take,
    select: {
      nfts: {
        select: {
          id: true,
          nftName: true,
          image: true,
        },
      },
      user_dashboard_sellerTouser: {
        select: {
          name: true,
        },
      },
      id: true,
      price: true,
    },
    orderBy: {
      like: 'desc',
    },
  });
  return data;
};

const getAllNftList = async (take: number, page: number) => {
  const data = await prisma.dashboard.findMany({
    where: {
      buyer: null,
    },
    skip: (page - 1) * take,
    take,
    select: {
      nfts: {
        select: {
          id: true,
          nftName: true,
          image: true,
        },
      },
      user_dashboard_sellerTouser: {
        select: {
          name: true,
        },
      },
      id: true,
      price: true,
    },
    orderBy: {
      like: 'desc',
    },
  });
  return data;
};

const isLikeExist = async (userId: number, dashboardId: number) => {
  return !!(await prisma.like_nfts.findFirst({
    where: { userId, dashboardId },
  }));
};

const addLike = async (userId: number, dashboardId: number) => {
  await prisma.$transaction(async (tx) => {
    const currentLike = await tx.dashboard.findFirst({
      where: { id: dashboardId },
      select: { like: true },
    });
    await tx.like_nfts.create({ data: { userId, dashboardId } });
    await tx.dashboard.update({
      where: { id: dashboardId },
      data: { like: currentLike?.like! + 1 },
    });
  });
};

const subLike = async (userId: number, dashboardId: number) => {
  await prisma.$transaction(async (tx) => {
    const currentLike = await tx.dashboard.findFirst({
      where: { id: dashboardId },
      select: { like: true },
    });
    const userLike = await tx.like_nfts.findFirstOrThrow({
      where: { userId, dashboardId },
    });
    await tx.like_nfts.delete({ where: { id: userLike.id } });
    await tx.dashboard.update({
      where: { id: dashboardId },
      data: { like: currentLike?.like! - 1 },
    });
  });
};

const buyNft = async (userId: number, id: number, price: number) => {
  let buyerPoint, currentBuyerYrp;
  const nft = await prisma.dashboard.findFirst({
    where: {
      id,
    },
    select: {
      nftId: true,
      nfts: {
        select: {
          chainType: true,
        },
      },
      seller: true,
      nftAddress: true,
      mintId: true,
      price: true,
    },
  });
  if (!nft) {
    throw errorGenerator({
      msg: responseMessage.NO_NFT,
      statusCode: statusCode.BAD_REQUEST,
    });
  }
  if (nft?.price != price) {
    throw errorGenerator({
      msg: responseMessage.NOT_EQUAL_PRICE,
      statusCode: statusCode.BAD_REQUEST,
    });
  }

  buyerPoint = await prisma.point.findFirst({
    where: {
      userId,
    },
  });
  if (!buyerPoint) {
    currentBuyerYrp = 0;
  } else {
    buyerPoint = await prisma.point.groupBy({
      by: ['userId'],
      where: {
        userId,
      },
      _sum: {
        yrpAmount: true,
      },
    });
    currentBuyerYrp = buyerPoint[0]._sum.yrpAmount!;
  }

  if (currentBuyerYrp < 0) {
    throw errorGenerator({
      msg: responseMessage.BALANCE_ERROR,
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
    });
  }
  const buyerYrp = currentBuyerYrp - nft.price;
  if (buyerYrp < 0) {
    throw errorGenerator({
      msg: responseMessage.INSUFFICIENT_BALANCE,
      statusCode: statusCode.FORBIDDEN,
    });
  }

  await startLoading(id);
  switch (nft.nfts.chainType) {
    case 'Ethereum': {
      const transaction = await nftBuy(
        nft.mintId,
        nft.nftAddress,
        1,
        config.walletAddress,
      );
      const transactionHash = transaction.hash;
      try {
        transaction.wait().then(async () => {
          await prisma.$transaction(async (tx) => {
            await tx.dashboard.updateMany({
              where: {
                id,
              },
              data: {
                buyer: userId,
                transactionHash,
                status: true,
              },
            });
            await tx.point.create({
              data: {
                userId,
                type: 'BUY',
                isCompleted: true,
                transactionHash,
                yrpAmount: -nft.price,
              },
            });
            await tx.point.create({
              data: {
                userId: nft.seller,
                type: 'SELL',
                isCompleted: true,
                transactionHash,
                yrpAmount: nft.price,
              },
            });
            await tx.user_has_nfts.create({
              data: {
                userId,
                nftId: nft.nftId,
                mintId: nft.mintId,
              },
            });
            await tx.user_has_nfts.deleteMany({
              where: {
                userId: nft.seller,
                nftId: nft.nftId,
                mintId: nft.mintId,
              },
            });
          });
          await finishLoading(id);
        });
        return {
          status: true,
          transactionHash: transaction.hash,
        };
      } catch (error) {
        await finishLoading(id);
        await updateTransactionHash(id, transactionHash);
        return {
          status: false,
          transactionHash: transaction.hash,
        };
      }
    }
    case 'Polygon': {
      const transaction = await polygonNftBuy(
        nft.mintId,
        nft.nftAddress,
        1,
        config.walletAddress,
      );
      const transactionHash = transaction.hash;
      try {
        transaction.wait().then(async () => {
          await prisma.$transaction(async (tx) => {
            await tx.dashboard.updateMany({
              where: {
                id,
              },
              data: {
                buyer: userId,
                transactionHash,
                status: true,
              },
            });
            await tx.point.create({
              data: {
                userId,
                type: 'BUY',
                isCompleted: true,
                transactionHash,
                yrpAmount: -nft.price,
              },
            });
            await tx.point.create({
              data: {
                userId: nft.seller,
                type: 'SELL',
                isCompleted: true,
                transactionHash,
                yrpAmount: nft.price,
              },
            });
            await tx.user_has_nfts.create({
              data: {
                userId,
                nftId: nft.nftId,
                mintId: nft.mintId,
              },
            });
            await tx.user_has_nfts.deleteMany({
              where: {
                userId: nft.seller,
                nftId: nft.nftId,
                mintId: nft.mintId,
              },
            });
          });
          await finishLoading(id);
        });
        return {
          status: true,
          transactionHash: transaction.hash,
        };
      } catch (error) {
        await finishLoading(id);
        await updateTransactionHash(id, transactionHash);
        return {
          status: false,
          transactionHash: transaction.hash,
        };
      }
    }
    case 'Klaytn': {
      const transaction = await klaytnNftBuy(
        nft.mintId,
        nft.nftAddress,
        1,
        config.walletAddress,
      );
      const transactionHash = transaction.hash;
      try {
        transaction.wait().then(async () => {
          await prisma.$transaction(async (tx) => {
            await tx.dashboard.updateMany({
              where: {
                id,
              },
              data: {
                buyer: userId,
                transactionHash,
                status: true,
              },
            });
            await tx.point.create({
              data: {
                userId,
                type: 'BUY',
                isCompleted: true,
                transactionHash,
                yrpAmount: -nft.price,
              },
            });
            await tx.point.create({
              data: {
                userId: nft.seller,
                type: 'SELL',
                isCompleted: true,
                transactionHash,
                yrpAmount: nft.price,
              },
            });
            await tx.user_has_nfts.create({
              data: {
                userId,
                nftId: nft.nftId,
                mintId: nft.mintId,
              },
            });
            await tx.user_has_nfts.deleteMany({
              where: {
                userId: nft.seller,
                nftId: nft.nftId,
                mintId: nft.mintId,
              },
            });
          });
          await finishLoading(id);
        });
        return {
          status: true,
          transactionHash: transaction.hash,
        };
      } catch (error) {
        await finishLoading(id);
        await updateTransactionHash(id, transactionHash);
        return {
          status: false,
          transactionHash: transaction.hash,
        };
      }
    }
    case 'Aurora': {
      const transaction = await auroraNftBuy(
        nft.mintId,
        nft.nftAddress,
        1,
        config.walletAddress,
      );
      const transactionHash = transaction.hash;
      try {
        transaction.wait().then(async () => {
          await prisma.$transaction(async (tx) => {
            await tx.dashboard.updateMany({
              where: {
                id,
              },
              data: {
                buyer: userId,
                transactionHash,
                status: true,
              },
            });
            await tx.point.create({
              data: {
                userId,
                type: 'BUY',
                isCompleted: true,
                transactionHash,
                yrpAmount: -nft.price,
              },
            });
            await tx.point.create({
              data: {
                userId: nft.seller,
                type: 'SELL',
                isCompleted: true,
                transactionHash,
                yrpAmount: nft.price,
              },
            });
            await tx.user_has_nfts.create({
              data: {
                userId,
                nftId: nft.nftId,
                mintId: nft.mintId,
              },
            });
            await tx.user_has_nfts.deleteMany({
              where: {
                userId: nft.seller,
                nftId: nft.nftId,
                mintId: nft.mintId,
              },
            });
          });
          await finishLoading(id);
        });
        return {
          status: true,
          transactionHash: transaction.hash,
        };
      } catch (error) {
        await finishLoading(id);
        await updateTransactionHash(id, transactionHash);
        return {
          status: false,
          transactionHash: transaction.hash,
        };
      }
    }
    case 'Oasys': {
      const transaction = await oasysNftBuy(
        nft.mintId,
        nft.nftAddress,
        1,
        config.walletAddress,
      );
      const transactionHash = transaction.hash;
      try {
        transaction.wait().then(async () => {
          await prisma.$transaction(async (tx) => {
            await tx.dashboard.updateMany({
              where: {
                id,
              },
              data: {
                buyer: userId,
                transactionHash,
                status: true,
              },
            });
            await tx.point.create({
              data: {
                userId,
                type: 'BUY',
                isCompleted: true,
                transactionHash,
                yrpAmount: -nft.price,
              },
            });
            await tx.point.create({
              data: {
                userId: nft.seller,
                type: 'SELL',
                isCompleted: true,
                transactionHash,
                yrpAmount: nft.price,
              },
            });
            await tx.user_has_nfts.create({
              data: {
                userId,
                nftId: nft.nftId,
                mintId: nft.mintId,
              },
            });
            await tx.user_has_nfts.deleteMany({
              where: {
                userId: nft.seller,
                nftId: nft.nftId,
                mintId: nft.mintId,
              },
            });
          });
          await finishLoading(id);
        });
        return {
          status: true,
          transactionHash: transaction.hash,
        };
      } catch (error) {
        await finishLoading(id);
        await updateTransactionHash(id, transactionHash);
        return {
          status: false,
          transactionHash: transaction.hash,
        };
      }
    }
    case 'Aptos': {
      await prisma.$transaction(async (tx) => {
        await tx.dashboard.updateMany({
          where: {
            id,
          },
          data: {
            buyer: userId,
            status: true,
          },
        });
        await tx.point.create({
          data: {
            userId,
            type: 'BUY',
            isCompleted: true,
            yrpAmount: -nft.price,
          },
        });
        await tx.point.create({
          data: {
            userId: nft.seller,
            type: 'SELL',
            isCompleted: true,
            yrpAmount: nft.price,
          },
        });
        await tx.user_has_nfts.create({
          data: {
            userId,
            nftId: nft.nftId,
            mintId: nft.mintId,
          },
        });
        await tx.user_has_nfts.deleteMany({
          where: {
            userId: nft.seller,
            nftId: nft.nftId,
            mintId: nft.mintId,
          },
        });
      });
      await finishLoading(id);
      return {
        status: true,
        transactionHash: null,
      };
    }
  }
};

const startLoading = async (id: number) => {
  await prisma.dashboard.update({
    where: {
      id,
    },
    data: {
      isLoading: true,
    },
  });
};

const finishLoading = async (id: number) => {
  await prisma.dashboard.update({
    where: {
      id,
    },
    data: {
      isLoading: false,
    },
  });
};

const updateTransactionHash = async (id: number, transactionHash: string) => {
  await prisma.dashboard.update({
    where: {
      id,
    },
    data: {
      transactionHash,
    },
  });
};

const getUserOtherNfts = async (ownerId: number, dashBoardId: number) => {
  const userOtherNfts = await prisma.dashboard.findMany({
    where: { seller: ownerId, NOT: { id: dashBoardId } },
  });
  let data = await Promise.all(
    userOtherNfts.map(async (nft) => {
      const nftData = await nftService.getNftInfo(nft.nftId);

      const result = {
        dashBoardId: nft.id,
        image: nftData.image,
        name: nftData.nftName,
        price: nft.price,
      };
      return result;
    }),
  );
  return data;
};

const sellNft = async (
  userId: number,
  nftId: number,
  nftAddress: string,
  tokenType: string,
  price: number,
) => {
  const nft = await prisma.user_has_nfts.findFirst({
    where: {
      userId,
      nftId,
    },
    select: {
      mintId: true,
    },
  });
  if (!nft?.mintId) {
    throw errorGenerator({
      msg: responseMessage.NO_NFT,
      statusCode: statusCode.BAD_REQUEST,
    });
  }
  let transaction;
  let data;
  switch (tokenType) {
    case 'Ethereum': {
      const initial = await prisma.dashboard.findFirst({
        where: {
          nftAddress,
        },
      });
      if (!initial) {
        await approveToSell(nftAddress);
      }
      transaction = await nftSell(nft.mintId, nftAddress, tokenType, 1);
      transaction.wait().then(async () => {
        await prisma.dashboard.create({
          data: {
            nftId,
            nftAddress,
            mintId: nft.mintId as number,
            price,
            seller: userId,
          },
        });
      });
      data = {
        transactionHash: transaction.hash,
      };
      break;
    }
    case 'Polygon': {
      const initial = await prisma.dashboard.findFirst({
        where: {
          nftAddress,
        },
      });
      if (!initial) {
        await approveToSellPolygon(nftAddress);
      }
      transaction = await polygonNftSell(nft.mintId, nftAddress, tokenType, 1);
      transaction.wait().then(async () => {
        await prisma.dashboard.create({
          data: {
            nftId,
            nftAddress,
            mintId: nft.mintId as number,
            price,
            seller: userId,
          },
        });
      });
      data = {
        transactionHash: transaction.hash,
      };
      break;
    }
    case 'Klaytn': {
      const initial = await prisma.dashboard.findFirst({
        where: {
          nftAddress,
        },
      });
      if (!initial) {
        await approveToSellKlaytn(nftAddress);
      }
      transaction = await klaytnNftSell(nft.mintId, nftAddress, tokenType, 1);
      transaction.wait().then(async () => {
        await prisma.dashboard.create({
          data: {
            nftId,
            nftAddress,
            mintId: nft.mintId as number,
            price,
            seller: userId,
          },
        });
      });
      data = {
        transactionHash: transaction.hash,
      };
      break;
    }
    case 'Aurora': {
      const initial = await prisma.dashboard.findFirst({
        where: {
          nftAddress,
        },
      });
      if (!initial) {
        await approveToSellAurora(nftAddress);
      }
      transaction = await auroraNftSell(nft.mintId, nftAddress, tokenType, 1);
      transaction.wait().then(async () => {
        await prisma.dashboard.create({
          data: {
            nftId,
            nftAddress,
            mintId: nft.mintId as number,
            price,
            seller: userId,
          },
        });
      });
      data = {
        transactionHash: transaction.hash,
      };
      break;
    }
    case 'Aptos': {
      await prisma.dashboard.create({
        data: {
          nftId,
          nftAddress,
          mintId: nft.mintId as number,
          price,
          seller: userId,
        },
      });
      data = {
        tranactionHash: null,
      };
      break;
    }
    case 'Oasys': {
      const initial = await prisma.dashboard.findFirst({
        where: {
          nftAddress,
        },
      });
      if (!initial) {
        await approveToSellOasys(nftAddress);
      }
      transaction = await oasysNftSell(nft.mintId, nftAddress, tokenType, 1);
      transaction.wait().then(async () => {
        await prisma.dashboard.create({
          data: {
            nftId,
            nftAddress,
            mintId: nft.mintId as number,
            price,
            seller: userId,
          },
        });
      });
      data = {
        transactionHash: transaction.hash,
      };
      break;
    }
  }
  return data;
};

export default {
  getDashBoardData,
  getMarketNftList,
  orderStandardLastest,
  orderStandardHottest,
  getAllNftList,
  addLike,
  subLike,
  isLikeExist,
  buyNft,
  startLoading,
  finishLoading,
  getUserOtherNfts,
  sellNft,
};
