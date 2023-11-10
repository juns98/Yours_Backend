import { ethers } from 'ethers';
import { createNftDto } from './../interfaces/user/DTO';
import { Request, Response, NextFunction } from 'express';
import { responseMessage, statusCode } from '../modules/constants';
import { success, fail } from '../modules/constants/util';
import nftService from '../services/nftService';
import { encodeByAES256 } from '../modules/crypto';
import {
  deployEtherNFT,
  etherProvider,
  mintEtherNFT,
  setEtherBenefitURI,
  transferEtherNFT,
  makeIntegratedNFT,
  updateIntegratedNFT,
  burnIntegratedNFT,
} from '../contract/Ethereum/etherContract';
import benefitData from '../contract/common/YoursBenefitNFT.json';
import {
  burnPolygonIntegratedNFT,
  deployPolygonNFT,
  makePolygonIntegratedNFT,
  polygonProvider,
  setPolygonBenefitURI,
  transferPolygonNFT,
  updatePolygonIntegratedNFT,
} from '../contract/Polygon/polygonContract';
import {
  burnKlaytnIntegratedNFT,
  deployKlaytnNFT,
  klaytnProvider,
  makeKlaytnIntegratedNFT,
  setKlaytnBenefitURI,
  transferKlaytnNFT,
  updateKlaytnIntegratedNFT,
} from '../contract/Klaytn/KlaytnContract';
import {
  uploadBenefitIpfs,
  uploadMetaIpfs,
} from '../contract/common/commonContract';
import { messageSender, multipleMessageSender } from '../modules/notification';
import {
  burnAptosIntegratedNft,
  deployAptosNFT,
  makeAptosIntegratedNFT,
  setAptosBenefitURI,
  transferAptosNFT,
  updateAptosIntegratedNFT,
} from '../contract/Aptos/aptosContract';
import {
  auroraProvider,
  burnAuroraIntegratedNFT,
  deployAuroraNFT,
  makeAuroraIntegratedNFT,
  setAuroraBenefitURI,
  transferAuroraNFT,
  updateAuroraIntegratedNFT,
} from '../contract/Aurora/AuroraContract';
import config from '../config';
import { userService } from '../services';
import {
  burnOasysIntegratedNFT,
  deployOasysNFT,
  makeOasysIntegratedNFT,
  setOasysBenefitURI,
  transferOasysNFT,
  updateOasysIntegratedNFT,
  oasysProvider,
} from '../contract/Oasys/OasysContract';
import {
  deployXplaNFT,
  transferXplaNFT,
  xplaProvider,
} from '../contract/XPLA/XPLAContract';

/**
 * @desc [GET] 카테고리 별 정보 조회
 * @url /api/nft?type={}
 */
const getInfoByType = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.body.id;
  const { type } = req.query;
  try {
    const data = await nftService.getInfoByType(+userId, type as string);
    return res
      .status(statusCode.OK)
      .send(
        success(
          statusCode.OK,
          responseMessage.READ_CATEGORY_INFO_SUCCESS,
          data,
        ),
      );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc[GET] NFT 상세 페이지 조회
 * @url /api/nft/:nftId/detail
 */
const getNftDetailInfo = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { nftId } = req.params;
  try {
    const data = await nftService.getNftDetailInfo(+nftId);
    if (!data) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(fail(statusCode.NOT_FOUND, responseMessage.NOT_FOUND));
    }
    return res
      .status(statusCode.OK)
      .send(
        success(
          statusCode.OK,
          responseMessage.READ_NFT_DETAIL_INFO_SUCCESS,
          data,
        ),
      );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [GET] NFT 소유자 정보 조회
 * @url /api/nft/:nftId/owners
 */
const getNftOwnersInfo = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { nftId } = req.params;
  try {
    const data = await nftService.getNftOwnersInfo(+nftId);

    return res
      .status(statusCode.OK)
      .send(
        success(
          statusCode.OK,
          responseMessage.READ_NFT_OWNERS_INFO_SUCCESS,
          data,
        ),
      );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc[POST] NFT 생성
 * @url /api/nft
 */
const createNft = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.body.id;
  const image: Express.MulterS3.File = req.file as Express.MulterS3.File;
  const { location } = image;
  if (!location) {
    res
      .status(statusCode.BAD_REQUEST)
      .send(fail(statusCode.BAD_REQUEST, responseMessage.NO_IMAGE));
  }

  const createNftDto: createNftDto = {
    ownerId: userId,
    nftName: req.body.nftName,
    image: location,
    description: req.body.description,
    authType: +req.body.authType,
    options: req.body.options,
    chainType: req.body.chainType,
  };

  try {
    const data = await nftService.createNft(createNftDto);
    return res
      .status(statusCode.OK)
      .send(success(statusCode.OK, responseMessage.CREATE_NFT_SUCCESS, data));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [POST] NFT 이메일 인증메일 발송
 * @url /api/nft/email
 */
const sendAuthMailForNft = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.body.id;
  const { nftId, email } = req.body;
  try {
    const data = await nftService.sendAuthMailForNft(userId, nftId, email);
    return res
      .status(statusCode.OK)
      .send(
        success(statusCode.OK, responseMessage.SEND_AUTH_MAIL_SUCCESS, data),
      );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [POST] NFT 메일 인증
 * @url /api/nft/email/verification
 */
const verifyMailForNft = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { code } = req.body;
  try {
    const data = await nftService.verifyMailForNft(code);
    return res
      .status(statusCode.OK)
      .send(
        success(statusCode.OK, responseMessage.VERIFY_EMAIL_AUTH_SUCCESS, data),
      );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [GET] 유저가 받은 NFT ID 리스트 조회
 * @url /api/nft/own
 */
const getOwnNftList = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.body.id;

    const data = await nftService.getOwnNftList(userId);
    return res
      .status(statusCode.OK)
      .send(
        success(statusCode.OK, responseMessage.READ_NFT_ID_LIST_SUCCESS, data),
      );
  } catch (error) {
    next(error);
  }
};

const getCreateNftList = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.body.id;
    const data = await nftService.getCreateNftList(userId);
    return res
      .status(statusCode.OK)
      .send(
        success(
          statusCode.OK,
          responseMessage.READ_CREATE_NFT_ID_LIST_SUCCESS,
          data,
        ),
      );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [POST] NFT 사진 인증
 * @url /api/nft/verification/photo
 */
const verifyPhotoForNft = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.body.id;
  const { nftId } = req.body;
  const image: Express.MulterS3.File = req.file as Express.MulterS3.File;
  const { location } = image;
  if (!location) {
    res
      .status(statusCode.BAD_REQUEST)
      .send(fail(statusCode.BAD_REQUEST, responseMessage.NO_IMAGE));
  }
  try {
    const requestMessageInfo = await nftService.getUserAndNftInfo(
      +userId,
      +nftId,
      'NFT_APPLY_WITH_PHOTO',
    );
    const nftInfo = await nftService.getNftInfo(+nftId);
    const ownerMessageInfo = await nftService.getUserAndNftInfo(
      +nftInfo.ownerId!,
      +nftId,
      'NFT_PHOTO_REQUEST',
    );
    const data = await nftService.verifyPhotoForNft(+userId, +nftId, location);
    await messageSender(requestMessageInfo);
    await messageSender(ownerMessageInfo);

    return res
      .status(statusCode.OK)
      .send(
        success(statusCode.OK, responseMessage.SEND_AUTH_PHOTO_SUCCESS, data),
      );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [GET] NFT 사진 요청 중인지 조회
 * @url /api/nft/:nftId/photo
 */
const getRequestAuthPhoto = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.body.id;
    const { nftId } = req.params;

    const data = await nftService.getRequestAuthPhoto(+userId, +nftId);

    return res
      .status(statusCode.OK)
      .send(
        success(
          statusCode.OK,
          responseMessage.READ_GET_REQUEST_PHOTO_SUCCESS,
          data,
        ),
      );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc NFT 헤택 생성
 * @url /api/nft/:nftId/reward
 */
const createReward = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.body.id;
    const { nftId } = req.params;
    const { rewardName, description, category, option } = req.body;
    const data = await nftService.createReward(
      userId,
      +nftId,
      rewardName,
      description,
      category,
      option,
    );
    return res
      .status(statusCode.CREATED)
      .send(
        success(
          statusCode.CREATED,
          responseMessage.CREATE_NFT_REWARD_SUCCESS,
          data,
        ),
      );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [PATCH]NFT 헤택 수정
 * @url /api/nft/:nftId/reward
 */
const updateRewardInfo = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.body.id;
    const { nftId } = req.params;
    const { rewardId, rewardName, description, category, option } = req.body;
    await nftService.updateRewardInfo(
      userId,
      +nftId,
      +rewardId,
      rewardName,
      description,
      category,
      option,
    );
    return res
      .status(statusCode.OK)
      .send(success(statusCode.OK, responseMessage.UPDATE_NFT_REWARD_SUCCESS));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [GET] NFT 혜택 상세보기
 * @url /api/nft/:rewardId/reward/detail
 */

const getNftRewardDetailInfo = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { rewardId } = req.params;
    const data = await nftService.getNftRewardDetailInfo(+rewardId);
    return res
      .status(statusCode.OK)
      .send(
        success(
          statusCode.OK,
          responseMessage.READ_NFT_REWARD_DETAIL_INFO_SUCCESS,
          data,
        ),
      );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [DELETE] NFT 혜택 삭제
 * @url /api/nft/:nftId/:rewardId
 */
const deleteNftReward = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.body.id;
    const { nftId, rewardId } = req.params;
    await nftService.deleteNftReward(userId, +nftId, +rewardId);

    return res
      .status(statusCode.OK)
      .send(success(statusCode.OK, responseMessage.DELETE_NFT_REWARD_SUCCESS));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [GET] 통합될 NFT 확인 정보 조회
 * @url /api/nft/integrated/check?chainType={}
 */
const getToBeIntegratedNfts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.body.id;
  const { chainType } = req.query;
  try {
    const data = await nftService.getToBeIntegratedNfts(
      +userId,
      chainType as string,
    );
    return res
      .status(statusCode.OK)
      .send(
        success(
          statusCode.OK,
          responseMessage.READ_TO_BE_INTEGRATED_NFTS_SUCCESS,
          data,
        ),
      );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [POST]] NFT 발행
 * @url /api/nft/publish
 */
const publishNFT = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.body.id;
  const { nftId } = req.body;
  try {
    //* NFT 생성자인지 확인하기
    const checkNftCreator = await nftService.checkNftCreator(+userId, +nftId);
    if (checkNftCreator) {
      const nftInfo = await nftService.getNftInfoWithReward(+nftId);
      const nftInfoIpfs = await uploadMetaIpfs(
        nftInfo.nftName,
        nftInfo.description,
        nftInfo.image,
      );

      await nftService.checkDeployedState(+nftId);

      const benefitInfoIpfs = await uploadBenefitIpfs(nftInfo.benefit);
      const messageInfo = await nftService.getUserAndNftInfo(
        +userId,
        +nftId,
        'NFT_PUBLISH_SUCCESS',
      );

      switch (nftInfo.chainType) {
        case 'Ethereum': {
          await nftService.startLoading(+nftId);
          const data = await deployEtherNFT(
            nftInfo.nftName,
            nftInfoIpfs,
            benefitInfoIpfs,
          );
          await nftService.updateNftInfo(
            +nftId,
            data!.contractAddress,
            data!.date,
          );
          await nftService.equalReward(+nftId);
          await nftService.finishLoading(+nftId);
          await messageSender(messageInfo);
          return res
            .status(statusCode.OK)
            .send(
              success(statusCode.OK, responseMessage.PUBLISH_NFT_SUCCESS, data),
            );
        }
        case 'Polygon': {
          await nftService.startLoading(+nftId);
          const data = await deployPolygonNFT(
            nftInfo.nftName,
            nftInfoIpfs,
            benefitInfoIpfs,
          );

          await nftService.updateNftInfo(
            +nftId,
            data.contractAddress,
            data.date,
          );
          await nftService.equalReward(+nftId);
          await nftService.finishLoading(+nftId);
          await messageSender(messageInfo);
          return res
            .status(statusCode.OK)
            .send(
              success(statusCode.OK, responseMessage.PUBLISH_NFT_SUCCESS, data),
            );
        }
        case 'Klaytn': {
          await nftService.startLoading(+nftId);
          const data = await deployKlaytnNFT(
            nftInfo.nftName,
            nftInfoIpfs,
            benefitInfoIpfs,
          );

          await nftService.updateNftInfo(
            +nftId,
            data.contractAddress,
            data.date,
          );
          await nftService.equalReward(+nftId);
          await nftService.finishLoading(+nftId);
          await messageSender(messageInfo);
          return res
            .status(statusCode.OK)
            .send(
              success(statusCode.OK, responseMessage.PUBLISH_NFT_SUCCESS, data),
            );
        }
        case 'Aptos': {
          await nftService.startLoading(+nftId);
          const data = await deployAptosNFT(
            nftInfo.nftName! + ` #${nftId}`,
            nftInfoIpfs,
            benefitInfoIpfs,
          );

          await nftService.updateNftInfo(
            +nftId,
            data.address.toString(),
            data.date,
          );
          await nftService.equalReward(+nftId);
          await nftService.finishLoading(+nftId);
          await messageSender(messageInfo);
          return res
            .status(statusCode.OK)
            .send(
              success(statusCode.OK, responseMessage.PUBLISH_NFT_SUCCESS, data),
            );
        }
        case 'Aurora': {
          await nftService.startLoading(+nftId);
          //* NFT 발행
          const data = await deployAuroraNFT(
            nftInfo.nftName,
            nftInfoIpfs,
            benefitInfoIpfs,
          );
          //* transaction 날짜와 NFT address 저장
          await nftService.updateNftInfo(
            +nftId,
            data!.contractAddress,
            data!.date,
          );
          await nftService.equalReward(+nftId);
          await nftService.finishLoading(+nftId);
          await messageSender(messageInfo);
          return res
            .status(statusCode.OK)
            .send(
              success(statusCode.OK, responseMessage.PUBLISH_NFT_SUCCESS, data),
            );
        }
        case 'Oasys': {
          await nftService.startLoading(+nftId);
          //* NFT 발행
          const data = await deployOasysNFT(
            nftInfo.nftName,
            nftInfoIpfs,
            benefitInfoIpfs,
          );
          //* transaction 날짜와 NFT address 저장
          await nftService.updateNftInfo(
            +nftId,
            data!.contractAddress,
            data!.date,
          );
          await nftService.equalReward(+nftId);
          await nftService.finishLoading(+nftId);
          await messageSender(messageInfo);
          return res
            .status(statusCode.OK)
            .send(
              success(statusCode.OK, responseMessage.PUBLISH_NFT_SUCCESS, data),
            );
        }
        case 'XPLA': {
          await nftService.startLoading(+nftId);
          //* NFT 발행
          const data = await deployXplaNFT(
            nftInfo.nftName,
            nftInfoIpfs,
            benefitInfoIpfs,
          );
          //* transaction 날짜와 NFT address 저장
          await nftService.updateNftInfo(
            +nftId,
            data!.contractAddress,
            data!.date,
          );
          await nftService.equalReward(+nftId);
          await nftService.finishLoading(+nftId);
          await messageSender(messageInfo);
          return res
            .status(statusCode.OK)
            .send(
              success(statusCode.OK, responseMessage.PUBLISH_NFT_SUCCESS, data),
            );
        }
      }
    }
  } catch (error) {
    await nftService.finishLoading(+nftId);
    next(error);
  }
};

/**
 * @desc [PATCH]] NFT 혜택 수정 후 발행
 * @url /api/nft/publish
 */
const updateNftBenefit = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.body.id;
  const { nftId } = req.body;
  try {
    //* NFT 생성자인지 확인하기
    await nftService.checkNftCreator(+userId, +nftId);
    const nftInfo = await nftService.getNftInfoWithReward(+nftId);
    const benefitInfoIpfs = await uploadBenefitIpfs(nftInfo.benefit);
    const messageToOwner = await nftService.getUserAndNftInfo(
      userId,
      nftId,
      'NFT_REFRESH_SUCCESS',
    );
    await nftService.checkEditedState(nftId);
    const messageToHolder = await nftService.makeRecipList(userId, nftId);
    switch (nftInfo.chainType) {
      case 'Ethereum': {
        await nftService.startLoading(nftId);
        const nftContract = new ethers.Contract(
          nftInfo.nftAddress as string,
          benefitData.abi,
          etherProvider,
        );
        const data = await setEtherBenefitURI(nftContract, benefitInfoIpfs);
        await nftService.updateAtNft(+nftId, data.date);

        await nftService.equalRewardInfo(nftId);
        await nftService.finishLoading(nftId);
        await messageSender(messageToOwner);
        if (messageToHolder.length > 0) {
          await multipleMessageSender(messageToHolder, 'NFT_REWARDS_ADD');
        }
        return res
          .status(statusCode.OK)
          .send(
            success(
              statusCode.OK,
              responseMessage.UPDATE_NFT_BENEFIT_SUCCESS,
              data,
            ),
          );
      }
      case 'Polygon': {
        await nftService.startLoading(nftId);
        const nftContract = new ethers.Contract(
          nftInfo.nftAddress as string,
          benefitData.abi,
          polygonProvider,
        );
        const data = await setPolygonBenefitURI(nftContract, benefitInfoIpfs);

        await nftService.updateAtNft(+nftId, data.date);

        await nftService.equalRewardInfo(nftId);
        await nftService.finishLoading(nftId);
        await messageSender(messageToOwner);
        if (messageToHolder.length > 0) {
          await multipleMessageSender(messageToHolder, 'NFT_REWARDS_ADD');
        }

        return res
          .status(statusCode.OK)
          .send(
            success(
              statusCode.OK,
              responseMessage.UPDATE_NFT_BENEFIT_SUCCESS,
              data,
            ),
          );
      }
      case 'Klaytn': {
        await nftService.startLoading(nftId);
        const nftContract = new ethers.Contract(
          nftInfo.nftAddress as string,
          benefitData.abi,
          klaytnProvider,
        );
        const data = await setKlaytnBenefitURI(nftContract, benefitInfoIpfs);

        await nftService.updateAtNft(+nftId, data.date);

        await nftService.equalRewardInfo(nftId);
        await nftService.finishLoading(nftId);
        await messageSender(messageToOwner);
        if (messageToHolder.length > 0) {
          await multipleMessageSender(messageToHolder, 'NFT_REWARDS_ADD');
        }
        return res
          .status(statusCode.OK)
          .send(
            success(
              statusCode.OK,
              responseMessage.UPDATE_NFT_BENEFIT_SUCCESS,
              data,
            ),
          );
      }
      case 'Aurora': {
        await nftService.startLoading(nftId);
        const nftContract = new ethers.Contract(
          nftInfo.nftAddress as string,
          benefitData.abi,
          auroraProvider,
        );
        const data = await setAuroraBenefitURI(nftContract, benefitInfoIpfs);
        await nftService.updateAtNft(+nftId, data.date);
        await nftService.equalRewardInfo(nftId);
        await nftService.finishLoading(nftId);
        await messageSender(messageToOwner);
        if (messageToHolder.length > 0) {
          await multipleMessageSender(messageToHolder, 'NFT_REWARDS_ADD');
        }
        return res
          .status(statusCode.OK)
          .send(
            success(
              statusCode.OK,
              responseMessage.UPDATE_NFT_BENEFIT_SUCCESS,
              data,
            ),
          );
      }
      case 'Aptos': {
        await nftService.startLoading(nftId);
        const data = await setAptosBenefitURI(
          nftInfo.nftName! + ` #${nftId}`,
          benefitInfoIpfs,
        );
        await nftService.updateAtNft(+nftId, new Date(data.date));
        await nftService.equalRewardInfo(nftId);
        await nftService.finishLoading(nftId);
        await messageSender(messageToOwner);
        if (messageToHolder.length > 0) {
          await multipleMessageSender(messageToHolder, 'NFT_REWARDS_ADD');
        }
        return res
          .status(statusCode.OK)
          .send(
            success(
              statusCode.OK,
              responseMessage.UPDATE_NFT_BENEFIT_SUCCESS,
              data,
            ),
          );
      }
      case 'Oasys': {
        await nftService.startLoading(nftId);
        const nftContract = new ethers.Contract(
          nftInfo.nftAddress as string,
          benefitData.abi,
          oasysProvider,
        );
        const data = await setOasysBenefitURI(nftContract, benefitInfoIpfs);
        await nftService.updateAtNft(+nftId, data.date);
        await nftService.equalRewardInfo(nftId);
        await nftService.finishLoading(nftId);
        await messageSender(messageToOwner);
        if (messageToHolder.length > 0) {
          await multipleMessageSender(messageToHolder, 'NFT_REWARDS_ADD');
        }
        return res
          .status(statusCode.OK)
          .send(
            success(
              statusCode.OK,
              responseMessage.UPDATE_NFT_BENEFIT_SUCCESS,
              data,
            ),
          );
      }
    }
  } catch (error) {
    await nftService.finishLoading(nftId);
    next(error);
  }
};

/**
 * @desc [POST] 통합 NFT 생성
 * @url /api/nft/integrated
 */
const createIntegratedNft = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.body.id;
  const { nftIdArray, chainType } = req.body;
  try {
    const nftAddressList = await nftService.getNftAddressList(nftIdArray);
    if (nftAddressList.length < 2)
      return res
        .status(statusCode.BAD_REQUEST)
        .send(fail(statusCode.BAD_REQUEST, responseMessage.BAD_REQUEST));
    const mintIdList = await nftService.getMintIdList(userId, nftIdArray);
    switch (chainType) {
      case 'Ethereum': {
        const data = await makeIntegratedNFT(
          config.walletAddress,
          config.ethereumImage,
          nftAddressList as string[],
          mintIdList as number[],
          chainType,
        );
        await nftService.createIntegratedNft(
          userId,
          nftIdArray,
          chainType,
          data.integratedId,
        );
        return res
          .status(statusCode.CREATED)
          .send(
            success(
              statusCode.CREATED,
              responseMessage.CREATE_INTEGRATED_NFT_SUCCESS,
              data,
            ),
          );
      }
      case 'Polygon': {
        const data = await makePolygonIntegratedNFT(
          config.walletAddress,
          config.ethereumImage,
          nftAddressList as string[],
          mintIdList as number[],
          chainType,
        );
        await nftService.createIntegratedNft(
          userId,
          nftIdArray,
          chainType,
          data.integratedId,
        );
        return res
          .status(statusCode.CREATED)
          .send(
            success(
              statusCode.CREATED,
              responseMessage.CREATE_INTEGRATED_NFT_SUCCESS,
              data,
            ),
          );
      }
      case 'Klaytn': {
        const data = await makeKlaytnIntegratedNFT(
          config.walletAddress,
          config.ethereumImage,
          nftAddressList as string[],
          mintIdList as number[],
          chainType,
        );
        await nftService.createIntegratedNft(
          userId,
          nftIdArray,
          chainType,
          data.integratedId,
        );
        return res
          .status(statusCode.CREATED)
          .send(
            success(
              statusCode.CREATED,
              responseMessage.CREATE_INTEGRATED_NFT_SUCCESS,
              data,
            ),
          );
      }
      case 'Aurora': {
        const data = await makeAuroraIntegratedNFT(
          config.walletAddress,
          config.ethereumImage,
          nftAddressList as string[],
          mintIdList as number[],
          chainType,
        );
        await nftService.createIntegratedNft(
          userId,
          nftIdArray,
          chainType,
          data.integratedId,
        );
        return res
          .status(statusCode.CREATED)
          .send(
            success(
              statusCode.CREATED,
              responseMessage.CREATE_INTEGRATED_NFT_SUCCESS,
              data,
            ),
          );
      }
      case 'Aptos': {
        const lastIntegratedNft = await nftService.getLastIntegratedNft();

        const nftNameList = await nftService.getNftNameList(nftIdArray);
        const user = await userService.getUserInfo(userId);
        const data = await makeAptosIntegratedNFT(
          `Yours#${lastIntegratedNft.id + 1}`,
          user.name!,
          config.aptosImage,
          nftNameList,
          mintIdList,
        );
        await nftService.createIntegratedNft(userId, nftIdArray, chainType);

        return res
          .status(statusCode.CREATED)
          .send(
            success(
              statusCode.CREATED,
              responseMessage.CREATE_INTEGRATED_NFT_SUCCESS,
              data,
            ),
          );
      }
      case 'Oasys': {
        const data = await makeOasysIntegratedNFT(
          config.walletAddress,
          config.ethereumImage,
          nftAddressList as string[],
          mintIdList as number[],
          chainType,
        );
        await nftService.createIntegratedNft(
          userId,
          nftIdArray,
          chainType,
          data.integratedId,
        );
        return res
          .status(statusCode.CREATED)
          .send(
            success(
              statusCode.CREATED,
              responseMessage.CREATE_INTEGRATED_NFT_SUCCESS,
              data,
            ),
          );
      }
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [POST] 통합 NFT 업데이트
 * @url /api/nft/integrated
 */
const updateIntegratedNft = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.body.id;
  const { integratedId, contractId, nftIdArray, chainType } = req.body;
  try {
    const mintIdList = await nftService.getMintIdList(userId, nftIdArray);
    const nftAddressList = await nftService.getNftAddressList(nftIdArray);
    let data;
    switch (chainType) {
      case 'Ethereum': {
        data = await updateIntegratedNFT(
          contractId,
          nftAddressList as string[],
          mintIdList as number[],
        );
        break;
      }
      case 'Polygon': {
        data = await updatePolygonIntegratedNFT(
          contractId,
          nftAddressList as string[],
          mintIdList as number[],
        );
        break;
      }
      case 'Klaytn': {
        data = await updateKlaytnIntegratedNFT(
          contractId,
          nftAddressList as string[],
          mintIdList as number[],
        );
        break;
      }
      case 'Aurora': {
        data = await updateAuroraIntegratedNFT(
          contractId,
          nftAddressList as string[],
          mintIdList as number[],
        );
        break;
      }
      case 'Aptos': {
        const nftNameList = await nftService.getNftNameList(nftIdArray);
        data = await updateAptosIntegratedNFT(
          `Yours#${integratedId}`,
          nftNameList,
          mintIdList,
        );
        break;
      }
      case 'Oasys': {
        data = await updateOasysIntegratedNFT(
          contractId,
          nftAddressList as string[],
          mintIdList as number[],
        );
        break;
      }
    }
    await nftService.updateIntegratedNft(+userId, integratedId, nftIdArray);
    return res
      .status(statusCode.OK)
      .send(
        success(
          statusCode.OK,
          responseMessage.UPDATE_INTEGRATED_NFT_SUCCESS,
          data,
        ),
      );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [GET] 통합 NFT 상세 정보 조회
 * @url /api/nft/integrated/detail?id={}
 */
const getIntegratedNftInfo = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.query;
  try {
    const data = await nftService.getIntegratedNftInfo(+(id as string));
    return res
      .status(statusCode.OK)
      .send(
        success(
          statusCode.OK,
          responseMessage.READ_INTEGRATED_NFT_DETAIL_SUCCESS,
          data,
        ),
      );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [GET] 유저가 가진 통합 NFT 리스트 조회
 * @url /api/nft/integrated
 */
const getIntegratedNftList = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.body.id;
  try {
    const data = await nftService.getIntegratedNftList(+userId);
    return res
      .status(statusCode.OK)
      .send(
        success(
          statusCode.OK,
          responseMessage.READ_INTEGRATED_NFT_SUCCESS,
          data,
        ),
      );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [DELETE] 통합 NFT 소각
 * @url /api/nft/integrated?id={}&contractId={}
 */
const deleteIntegratedNft = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.body.id;
  const { id, contractId } = req.query;
  let transaction;
  try {
    const integratedNft = await nftService.checkChainType(+(id as string));
    switch (integratedNft?.chainType) {
      case 'Ethereum': {
        transaction = await burnIntegratedNFT(
          config.walletAddress as string,
          +(contractId as string),
        );
        break;
      }
      case 'Polygon': {
        transaction = await burnPolygonIntegratedNFT(
          config.walletAddress as string,
          +(contractId as string),
        );
        break;
      }
      case 'Klaytn': {
        transaction = await burnKlaytnIntegratedNFT(
          config.walletAddress as string,
          +(contractId as string),
        );
        break;
      }
      case 'Aurora': {
        transaction = await burnAuroraIntegratedNFT(
          config.walletAddress as string,
          +(contractId as string),
        );
        break;
      }
      case 'Aptos': {
        //* TODO
        await burnAptosIntegratedNft(`Yours#76`);
        break;
      }
      case 'Aurora': {
        transaction = await burnOasysIntegratedNFT(
          config.walletAddress as string,
          +(contractId as string),
        );
        break;
      }
    }
    transaction.wait().then(async () => {
      await nftService.deleteIntegratedNft(userId, +(id as string));
    });
    return res
      .status(statusCode.OK)
      .send(
        success(statusCode.OK, responseMessage.DELETE_INTEGRATED_NFT_SUCCESS),
      );
  } catch (error) {
    next(error);
  }
};

const checkNftOwner = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.body.id;
    const { id } = req.query;
    const data = await nftService.checkNftOwner(+userId, +(id as string));
    return res
      .status(statusCode.OK)
      .send(
        success(statusCode.OK, responseMessage.READ_NFT_OWNSHIP_SUCCESS, data),
      );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [POST] Welcome NFT 받기
 * @url /api/nft/welcome
 */
const createWelcomeNft = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.body.id;
    const getNftInfo = await nftService.getNftInfo(0);
    const nftContract = new ethers.Contract(
      getNftInfo.nftAddress as string,
      benefitData.abi,
      etherProvider,
    );
    const mintNftInfo = await mintEtherNFT(nftContract, 'walletAddress');
    await nftService.giveMintIdToUser(userId, 0, mintNftInfo.mintId);
    const messageInfo = await nftService.getUserAndNftInfo(
      userId,
      +getNftInfo.id,
      'WELCOME_NFT',
    );
    await messageSender(messageInfo);
    return res
      .status(statusCode.OK)
      .send(success(statusCode.OK, responseMessage.CREATE_WELCOME_NFT_SUCCESS));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [POST] 입장코드 발급
 * @url /api/nft/invite
 */
const createInviteCode = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.body.id;
    const getNftInfo = await nftService.getNftInfo(0);
    const data = await userService.findRfTokenById(userId);
    let code = data!.refreshToken.concat('.', getNftInfo.nftAddress as string);
    code = await encodeByAES256(code);
    return res
      .status(statusCode.OK)
      .send(
        success(
          statusCode.OK,
          responseMessage.CREATE_INVITE_CODE_SUCCESS,
          code,
        ),
      );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [POST] NFT 옮겨가기
 * @url /api/nft/:nftId/transfer
 */
const transferNft = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let transaction, data;
    const userId = req.body.id;
    const { nftId } = req.params;
    const { walletAddress } = req.body;
    const nft = await nftService.getMintIdWithNftAddress(userId, +nftId);
    switch (nft.nfts.chainType) {
      case 'Ethereum': {
        const nftContract = new ethers.Contract(
          nft.nfts.nftAddress as string,
          benefitData.abi,
          etherProvider,
        );
        transaction = await transferEtherNFT(
          nftContract,
          nft.mintId as number,
          config.walletAddress,
          walletAddress,
        );
        transaction.wait().then(async () => {
          await nftService.deleteNftInMyPage(userId, +nftId);
        });
        data = {
          transactionHash: transaction.hash,
        };
        break;
      }
      case 'Polygon': {
        const nftContract = new ethers.Contract(
          nft.nfts.nftAddress as string,
          benefitData.abi,
          polygonProvider,
        );
        transaction = await transferPolygonNFT(
          nftContract,
          nft.mintId as number,
          config.walletAddress,
          walletAddress,
        );
        transaction.wait().then(async () => {
          await nftService.deleteNftInMyPage(userId, +nftId);
        });
        data = {
          transactionHash: transaction.hash,
        };
        break;
      }
      case 'Klaytn': {
        const nftContract = new ethers.Contract(
          nft.nfts.nftAddress as string,
          benefitData.abi,
          klaytnProvider,
        );
        transaction = await transferKlaytnNFT(
          nftContract,
          nft.mintId as number,
          config.walletAddress,
          walletAddress,
        );
        transaction.wait().then(async () => {
          await nftService.deleteNftInMyPage(userId, +nftId);
        });
        data = {
          transactionHash: transaction.hash,
        };
        break;
      }
      case 'Aurora': {
        const nftContract = new ethers.Contract(
          nft.nfts.nftAddress as string,
          benefitData.abi,
          auroraProvider,
        );
        transaction = await transferAuroraNFT(
          nftContract,
          nft.mintId as number,
          config.walletAddress,
          walletAddress,
        );
        transaction.wait().then(async () => {
          await nftService.deleteNftInMyPage(userId, +nftId);
        });
        data = {
          transactionHash: transaction.hash,
        };
        break;
      }
      case 'Aptos': {
        data = await transferAptosNFT(
          walletAddress,
          (nft.nfts.nftName + ` #${+nftId}`) as string,
          nft.mintId as number,
        );
        await nftService.deleteNftInMyPage(userId, +nftId);
        break;
      }
      case 'Oasys': {
        const nftContract = new ethers.Contract(
          nft.nfts.nftAddress as string,
          benefitData.abi,
          oasysProvider,
        );
        transaction = await transferOasysNFT(
          nftContract,
          nft.mintId as number,
          config.walletAddress,
          walletAddress,
        );
        transaction.wait().then(async () => {
          await nftService.deleteNftInMyPage(userId, +nftId);
        });
        data = {
          transactionHash: transaction.hash,
        };
        break;
      }
      case 'XPLA': {
        const nftContract = new ethers.Contract(
          nft.nfts.nftAddress as string,
          benefitData.abi,
          xplaProvider,
        );
        transaction = await transferXplaNFT(
          nftContract,
          nft.mintId as number,
          config.walletAddress,
          walletAddress,
        );
        transaction.wait().then(async () => {
          await nftService.deleteNftInMyPage(userId, +nftId);
        });
        data = {
          transactionHash: transaction.hash,
        };
        break;
      }
    }
    return res
      .status(statusCode.OK)
      .send(success(statusCode.OK, responseMessage.TRANSFER_NFT_SUCCESS, data));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [POST] 외부 NFT 확인하기
 * @url /api/nft/external
 */
const takeExternalNft = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.body.id;
    const { nftName, image, chainType, nftAddress } = req.body;

    const data = await nftService.takeExternalNft(
      userId,
      nftName,
      image,
      chainType,
      nftAddress,
    );
    return res
      .status(statusCode.OK)
      .send(
        success(statusCode.OK, responseMessage.GET_EXTERNAL_NFT_SUCCESS, data),
      );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc [PATCH] 외부 NFT 민팅하기
 * @url /api/nft/external
 */
const mintExternalNft = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.body.id;
    const { chainType, nftAddress, isExternal, tokenId } = req.body;

    const data = await nftService.mintExternalNft(
      userId,
      chainType,
      nftAddress,
      isExternal,
      tokenId,
    );
    return res
      .status(statusCode.OK)
      .send(
        success(statusCode.OK, responseMessage.MINT_EXTERNAL_NFT_SUCCESS, data),
      );
  } catch (error) {
    next(error);
  }
};

export default {
  getInfoByType,
  getNftDetailInfo,
  getNftOwnersInfo,
  createNft,
  sendAuthMailForNft,
  verifyMailForNft,
  getOwnNftList,
  getCreateNftList,
  verifyPhotoForNft,
  getRequestAuthPhoto,
  createReward,
  updateRewardInfo,
  getNftRewardDetailInfo,
  deleteNftReward,
  getToBeIntegratedNfts,
  publishNFT,
  updateNftBenefit,
  createIntegratedNft,
  updateIntegratedNft,
  getIntegratedNftInfo,
  getIntegratedNftList,
  deleteIntegratedNft,
  checkNftOwner,
  createWelcomeNft,
  createInviteCode,
  transferNft,
  takeExternalNft,
  mintExternalNft,
};
