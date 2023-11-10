import { Request, Response, NextFunction } from 'express';
import { responseMessage, statusCode } from '../modules/constants';
import { success } from '../modules/constants/util';
import { marketService, nftService, userService } from '../services';
import errorGenerator from '../middlewares/error/errorGenerator';

/**
 * @desc [GET] NFT 상세 페이지 조회
 * @url /api/market/detail/dashboardId={}
 */
const getMarketNftDetail = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let userId = req.body.id || null;
    const { dashboardId } = req.query;

    const dashboard = await marketService.getDashBoardData(
      +(dashboardId as string),
    );
    let likeData = false;
    if (userId) {
      likeData = await marketService.isLikeExist(userId, +dashboardId!);
    }

    const ownerId = dashboard?.seller;
    const nftId = dashboard?.nftId;

    const userInfo = await userService.getUserInfo(+ownerId!);
    const nftAndReward = await nftService.getNftInfoWithReward(nftId!);
    const userOtherNfts = await marketService.getUserOtherNfts(
      +ownerId!,
      +dashboardId!,
    );
    const user = { userId: userInfo.id, name: userInfo.name };

    const data = { user, likeData, nftAndReward, dashboard, userOtherNfts };
    return res
      .status(statusCode.OK)
      .send(
        success(
          statusCode.OK,
          responseMessage.READ_MARKET_NFT_DETAIL_SUCCESS,
          data,
        ),
      );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [GET] 마켓플레이스 NFT 리스팅 조회
 * @url /api/market?type={}&&sort={}&&size={}&&page={}
 */
const getMarketNftList = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { type, sort, size, page } = req.query;
    const data = await marketService.getMarketNftList(
      type as string,
      sort as string,
      +(size as string),
      +(page as string),
    );
    return res
      .status(statusCode.OK)
      .send(
        success(
          statusCode.OK,
          responseMessage.READ_MARKET_DASHBOARD_SUCCESS,
          data,
        ),
      );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [POST] 좋아요 추가
 * @url /api/market/like
 */
const addLike = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, dashboardId } = req.body;
    const isLikeExist = await marketService.isLikeExist(
      +(userId as string),
      +(dashboardId as string),
    );
    if (isLikeExist) {
      throw errorGenerator({
        msg: responseMessage.IS_LIKED_DASHBOARD,
        statusCode: statusCode.BAD_REQUEST,
      });
    }
    await marketService.addLike(+(userId as string), +(dashboardId as string));
    return res
      .status(statusCode.OK)
      .send(success(statusCode.OK, responseMessage.ADD_LIKE_SUCCESS));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [PATCH] NFT 구매
 * @url /api/market/buy
 */
const buyNft = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.body.id;
    const { dashboardId, price } = req.body;
    const data = await marketService.buyNft(+userId, dashboardId, price);
    if (data!.status) {
      return res
        .status(statusCode.OK)
        .send(success(statusCode.OK, responseMessage.BUY_NFT_SUCCESS, data));
    }
    return res
      .status(statusCode.OK)
      .send(success(statusCode.OK, responseMessage.BUY_NFT_FAIL, data));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [DELETE] 좋아요 취소
 * @url /api/market/like
 */
const subLike = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, dashboardId } = req.body;
    const isLikeExist = await marketService.isLikeExist(
      +(userId as string),
      +(dashboardId as string),
    );
    if (!isLikeExist) {
      throw errorGenerator({
        msg: responseMessage.NO_LIKED_DASHBOARD,
        statusCode: statusCode.BAD_REQUEST,
      });
    }
    await marketService.subLike(+(userId as string), +(dashboardId as string));
    return res
      .status(statusCode.OK)
      .send(success(statusCode.OK, responseMessage.SUB_LIKE_SUCCESS));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [POST] NFT 판매
 * @url /api/market/sell
 */
const sellNft = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.body.id;
    const { nftId, nftAddress, tokenType, price } = req.body;
    const data = await marketService.sellNft(
      +userId,
      nftId,
      nftAddress,
      tokenType,
      price,
    );
    return res
      .status(statusCode.OK)
      .send(success(statusCode.OK, responseMessage.SELL_NFT_SUCCESS, data));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [GET] 마이페이지 조회
 * @url /api/market/myPage?options={}
 */
const getMyPage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.body.id;
    const { options } = req.query;
    const data = await userService.getMyPage(+userId, options as string);
    return res
      .status(statusCode.OK)
      .send(success(statusCode.OK, responseMessage.GET_MYPAGE_SUCCESS, data));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [GET] 남이 보는 마이페이지 조회
 * @url /api/market/user/id={}&&options={}
 */
const getMyPageForBuyer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id, options } = req.query;
    const data = await userService.getMyPageForBuyer(
      +(id as string),
      options as string,
    );
    return res
      .status(statusCode.OK)
      .send(success(statusCode.OK, responseMessage.GET_MYPAGE_SUCCESS, data));
  } catch (error) {
    next(error);
  }
};

export default {
  getMarketNftDetail,
  getMarketNftList,
  buyNft,
  addLike,
  subLike,
  sellNft,
  getMyPage,
  getMyPageForBuyer,
};
