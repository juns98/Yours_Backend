import { ethers } from 'ethers';
import { Request, Response, NextFunction } from 'express';
import {
  etherProvider,
  mintEtherNFT,
} from '../contract/Ethereum/etherContract';
import { responseMessage, statusCode } from '../modules/constants';
import { fail, success } from '../modules/constants/util';
import { adminService, nftService, userService } from '../services';
import benefitData from '../contract/common/YoursBenefitNFT.json';
import {
  mintPolygonNFT,
  polygonProvider,
} from '../contract/Polygon/polygonContract';
import {
  klaytnProvider,
  mintKlaytnNFT,
} from '../contract/Klaytn/KlaytnContract';
import { messageSender } from '../modules/notification';
import { mintAptosNFT } from '../contract/Aptos/aptosContract';
import {
  auroraProvider,
  mintAuroraNFT,
} from '../contract/Aurora/AuroraContract';
import { mintOasysNFT, oasysProvider } from '../contract/Oasys/OasysContract';
import { mintXplaNFT, xplaProvider } from '../contract/XPLA/XPLAContract';

/**
 * @desc [GET] NFT 사진 들어온 인증 요청 조회
 * @url /api/admin/:nftId
 */
const getRequestUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.body.id;
    const { nftId } = req.params;

    const data = await adminService.getRequestUser(userId, +nftId);

    return res
      .status(statusCode.OK)
      .send(
        success(statusCode.OK, responseMessage.READ_AUTH_PEOPLE_SUCCESS, data),
      );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [PUT] NFT 승인 및 거절
 */
const approveOrRejectNft = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { tableId, type, reason } = req.body;
  try {
    if (type) {
      const approveInfo = await adminService.getApproveInfo(+tableId);
      const getNftInfo = await nftService.getNftInfo(+approveInfo.nftId);
      const messageInfo = await nftService.getUserAndNftInfo(
        approveInfo.userId,
        +getNftInfo.id,
        'NFT_APPLY_APPROVE',
      );
      switch (getNftInfo?.chainType) {
        case 'Ethereum': {
          const walletAddress = await nftService.getNftWalletAddress(
            +approveInfo.userId,
            getNftInfo?.chainType,
          );
          const nftContract = new ethers.Contract(
            getNftInfo.nftAddress as string,
            benefitData.abi,
            etherProvider,
          );
          const mint = await mintEtherNFT(nftContract, walletAddress as string);
          await adminService.approveNft(
            +tableId,
            +approveInfo.userId,
            +approveInfo.nftId,
          );
          await nftService.saveMintId(
            +approveInfo.userId,
            +approveInfo.nftId,
            mint.mintId,
          );

          await messageSender(messageInfo);
          return res
            .status(statusCode.OK)
            .send(
              success(
                statusCode.OK,
                responseMessage.APPROVE_NFT_SUCCESS,
                approveInfo,
              ),
            );
        }
        case 'Polygon': {
          const walletAddress = await nftService.getNftWalletAddress(
            +approveInfo.userId,
            getNftInfo?.chainType,
          );

          const nftContract = new ethers.Contract(
            getNftInfo.nftAddress as string,
            benefitData.abi,
            polygonProvider,
          );
          const mint = await mintPolygonNFT(
            nftContract,
            walletAddress as string,
          );
          await adminService.approveNft(
            +tableId,
            +approveInfo.userId,
            +approveInfo.nftId,
          );
          await nftService.saveMintId(
            +approveInfo.userId,
            +approveInfo.nftId,
            mint.mintId,
          );

          await messageSender(messageInfo);
          return res
            .status(statusCode.OK)
            .send(
              success(
                statusCode.OK,
                responseMessage.APPROVE_NFT_SUCCESS,
                approveInfo,
              ),
            );
        }
        case 'Klaytn': {
          const walletAddress = await nftService.getNftWalletAddress(
            +approveInfo.userId,
            getNftInfo?.chainType,
          );

          const nftContract = new ethers.Contract(
            getNftInfo.nftAddress as string,
            benefitData.abi,
            klaytnProvider,
          );

          const mint = await mintKlaytnNFT(
            nftContract,
            walletAddress as string,
          );
          await adminService.approveNft(
            +tableId,
            +approveInfo.userId,
            +approveInfo.nftId,
          );
          await nftService.saveMintId(
            +approveInfo.userId,
            +approveInfo.nftId,
            mint.mintId,
          );

          await messageSender(messageInfo);
          return res
            .status(statusCode.OK)
            .send(
              success(
                statusCode.OK,
                responseMessage.APPROVE_NFT_SUCCESS,
                approveInfo,
              ),
            );
        }
        case 'Aptos': {
          const mint = await mintAptosNFT(
            messageInfo.nftName! + ` #${approveInfo.nftId}`,
            messageInfo.name!,
          );
          await adminService.approveNft(
            +tableId,
            +approveInfo.userId,
            +approveInfo.nftId,
          );
          await nftService.saveMintId(
            +approveInfo.userId,
            +approveInfo.nftId,
            +mint!.mintId,
          );
          await messageSender(messageInfo);
          return res
            .status(statusCode.OK)
            .send(
              success(
                statusCode.OK,
                responseMessage.APPROVE_NFT_SUCCESS,
                approveInfo,
              ),
            );
        }
        case 'Aurora': {
          const walletAddress = await nftService.getNftWalletAddress(
            +approveInfo.userId,
            getNftInfo?.chainType,
          );
          const nftContract = new ethers.Contract(
            getNftInfo.nftAddress as string,
            benefitData.abi,
            auroraProvider,
          );
          const mint = await mintAuroraNFT(
            nftContract,
            walletAddress as string,
          );

          await adminService.approveNft(
            +tableId,
            +approveInfo.userId,
            +approveInfo.nftId,
          );
          await nftService.saveMintId(
            +approveInfo.userId,
            +approveInfo.nftId,
            mint.mintId,
          );
          await messageSender(messageInfo);
          return res
            .status(statusCode.OK)
            .send(
              success(
                statusCode.OK,
                responseMessage.APPROVE_NFT_SUCCESS,
                approveInfo,
              ),
            );
        }
        case 'Oasys': {
          // const walletAddress = await nftService.getNftWalletAddress(
          //   +approveInfo.userId,
          //   getNftInfo?.chainType,
          // );

          const nftContract = new ethers.Contract(
            getNftInfo.nftAddress as string,
            benefitData.abi,
            oasysProvider,
          );

          const mint = await mintOasysNFT(
            nftContract,
            'walletAddress' as string,
          );
          await adminService.approveNft(
            +tableId,
            +approveInfo.userId,
            +approveInfo.nftId,
          );
          await nftService.saveMintId(
            +approveInfo.userId,
            +approveInfo.nftId,
            mint.mintId,
          );

          await messageSender(messageInfo);
          return res
            .status(statusCode.OK)
            .send(
              success(
                statusCode.OK,
                responseMessage.APPROVE_NFT_SUCCESS,
                approveInfo,
              ),
            );
        }
        case 'XPLA': {
          // const walletAddress = await nftService.getNftWalletAddress(
          //   +approveInfo.userId,
          //   getNftInfo?.chainType,
          // );

          const nftContract = new ethers.Contract(
            getNftInfo.nftAddress as string,
            benefitData.abi,
            xplaProvider,
          );

          const mint = await mintXplaNFT(
            nftContract,
            'walletAddress' as string,
          );
          await adminService.approveNft(
            +tableId,
            +approveInfo.userId,
            +approveInfo.nftId,
          );
          await nftService.saveMintId(
            +approveInfo.userId,
            +approveInfo.nftId,
            mint.mintId,
          );

          await messageSender(messageInfo);
          return res
            .status(statusCode.OK)
            .send(
              success(
                statusCode.OK,
                responseMessage.APPROVE_NFT_SUCCESS,
                approveInfo,
              ),
            );
        }
      }
    }
    if (!type) {
      const userIdAndNftId = await adminService.rejectNft(+tableId, reason);
      //거절 메시지 전송
      const messageInfo = await nftService.getUserAndNftInfo(
        +userIdAndNftId.userId,
        +userIdAndNftId.nftId,
        'NFT_APPLY_REFUSE',
      );
      messageInfo.rejectReason = reason;

      await messageSender(messageInfo);
      return res
        .status(statusCode.OK)
        .send(success(statusCode.OK, responseMessage.APPROVE_NFT_FAIL));
    }
    return res
      .status(statusCode.NOT_FOUND)
      .send(fail(statusCode.NOT_FOUND, responseMessage.NOT_FOUND));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [GET] 관리자 혜택 정보 조회
 * @url /api/admin/:nftId/reward
 */
const getAdminNftRewardList = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { nftId } = req.params;
  try {
    const data = await adminService.getAdminNftRewardList(+nftId);
    return res
      .status(statusCode.OK)
      .send(
        success(
          statusCode.OK,
          responseMessage.READ_NFT_ADMIN_REWARD_INFO_SUCCESS,
          data,
        ),
      );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [GET] 관리자 혜택 정보 상세 조회
 * @url /api/admin/:rewardId/reward/detail
 */
const getAdminNftRewardDetail = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { rewardId } = req.params;
  try {
    const data = await adminService.getAdminNftRewardDetail(+rewardId);
    return res
      .status(statusCode.OK)
      .send(
        success(
          statusCode.OK,
          responseMessage.READ_NFT_ADMIN_REWARD_DETAIL_INFO_SUCCESS,
          data,
        ),
      );
  } catch (error) {
    next(error);
  }
};

export default {
  getRequestUser,
  approveOrRejectNft,
  getAdminNftRewardList,
  getAdminNftRewardDetail,
};
