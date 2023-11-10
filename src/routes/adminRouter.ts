import { Router } from 'express';
import { param } from 'express-validator';
import { adminController } from '../controllers';
import { auth } from '../middlewares';
import errorValidator from '../middlewares/error/errorValidator';

const router: Router = Router();

/**
 * @desc [PUT] NFT 승인 및 거절
 */
router.put('/', auth, adminController.approveOrRejectNft);

/**
 * @desc [GET] NFT 사진 들어온 인증 요청 조회
 */
router.get(
  '/:nftId',
  [param('nftId').notEmpty()],
  errorValidator,
  auth,
  adminController.getRequestUser,
);

/**
 * @desc [GET] 관리자 혜택 정보 조회
 */
router.get(
  '/:nftId/reward',
  [param('nftId').notEmpty()],
  errorValidator,
  adminController.getAdminNftRewardList,
);

/**
 * @desc [GET] 관리자 혜택 상세 정보 조회
 */
router.get(
  '/:rewardId/reward/detail',
  [param('rewardId').notEmpty()],
  errorValidator,
  adminController.getAdminNftRewardDetail,
);
export default router;
