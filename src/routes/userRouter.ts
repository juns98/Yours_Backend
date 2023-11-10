import { Router } from 'express';
import auth from '../middlewares/auth';
import { userController } from '../controllers';
import upload from '../middlewares/upload';
import { body, query } from 'express-validator';
import errorValidator from '../middlewares/error/errorValidator';

const router: Router = Router();

/**
 * @desc [GET] 유저 정보 조회
 */
router.get('/profile', auth, userController.getUserInfo);

/**
 * @desc [PATCH] 유저 프로필 사진 수정
 */
router.patch(
  '/profile/photo',
  upload.single('image'),
  auth,
  userController.updateProfilePhoto,
);

/**
 * @desc [PATCH] 유저 핸드폰 번호 수정
 */
router.patch(
  '/profile/phone',
  [body('phoneNumber').notEmpty()],
  errorValidator,
  auth,
  userController.updateUserPhoneNumber,
);

/**
 * @desc [PATCH] 유저 이메일 수정
 */
router.patch(
  '/profile/email',
  [body('email').isEmail().notEmpty()],
  errorValidator,
  auth,
  userController.updateUserEmail,
);

/**
 * @desc [PATCH] 유저 이름 수정
 */
router.patch(
  '/profile/nickname',
  [body('nickname').notEmpty()],
  errorValidator,
  auth,
  userController.updateNickName,
);

/**
 * @desc [PATCH] 사용자 서비스 언어 변경
 */
router.patch(
  '/profile/language',
  [body('language').notEmpty()],
  errorValidator,
  auth,
  userController.updateLanguage,
);

/**
 * @desc [POST] 유저 이메일 변경을 위한 메일 전송
 */
router.post(
  '/email/send',
  [body('email').isEmail().notEmpty()],
  errorValidator,
  userController.sendEmailForAuth,
);

/**
 * @desc [GET] 유저 퀘스트 달성 여부 조회
 */
router.get('/quest', auth, userController.getQuestInfo);

/**
 * @desc [PATCH] 지갑 퀘스트 달성하기
 */
router.patch('/quest', auth, userController.updateQuestInfo);

/**
 * @desc [PATCH] secret 변경
 */
router.patch(
  '/secret',
  [body('secret').isString().notEmpty()],
  errorValidator,
  auth,
  userController.updateSecret,
);

/**
 * @desc [GET] 지갑 주소 조회
 */
router.get('/wallet', auth, userController.getWalletInfo);

/**
 * @desc [GET] Yours 지갑 주소 여부 조회
 */
router.get(
  '/yours',
  [query('address').isString().notEmpty()],
  errorValidator,
  userController.checkYoursWallet,
);

/**
 * @desc [POST] YRP 충전
 * @url /api/user/yrp/charge
 */
router.post('/yrp/charge', [
  body('type').notEmpty().isString().isIn(['OUTPUT', 'INPUT']),
  body('isCompleted').notEmpty().isBoolean(),
  body('chargedAt').notEmpty(),
  body('transactionHash').notEmpty().isString(),
  body('walletAddress').notEmpty().isString(),
  body('stableChain')
    .notEmpty()
    .isString()
    .isIn(['USDC', 'USDC_T', 'USDT', 'DAI', 'BUSD', 'TUSD']),
  body('stableAmount').notEmpty().isFloat(),
  body('yrpAmount').notEmpty().isFloat(),
  body('feeAmount').notEmpty().isFloat(),
  errorValidator,
  auth,
  userController.chargeYrp,
]);

/**
 * @desc [GET] YRP 거래내역 조회
 */
router.get('/yrp/ledger', auth, userController.getUserYrp);

/**
 * @desc [GET] 총 YRP 조회
 */
router.get('/yrp/ledger/detail', auth, userController.getUserYrpDetail);

export default router;
