import { Router } from 'express';
import auth from '../middlewares/auth';
import { nftController } from '../controllers';
import { body, param, query } from 'express-validator';
import errorValidator from '../middlewares/error/errorValidator';
import upload from '../middlewares/upload';

const router: Router = Router();

/**
 * @desc [GET] 통합 NFT 상세 정보 조회
 */
router.get(
  '/integrated/detail',
  [query('id').notEmpty()],
  errorValidator,
  nftController.getIntegratedNftInfo,
);

/**
 * @desc [GET] 유저가 가진 통합 NFT 리스트 조회
 */
router.get('/integrated', auth, nftController.getIntegratedNftList);

/**
 * @desc [DELETE] 통합 NFT 소각
 */
router.delete(
  '/integrated',
  [query('id').notEmpty()],
  [query('contractId').notEmpty()],
  errorValidator,
  auth,
  nftController.deleteIntegratedNft,
);

/**
 * @desc [GET] 카테고리별 정보 조회
 */
router.get(
  '/',
  [query('type').notEmpty().isIn(['create', 'owm', 'reward'])],
  auth,
  nftController.getInfoByType,
);

/**
 * @desc [POST] NFT 생성
 */
router.post(
  '/',
  upload.single('image'),
  [
    body('nftName').notEmpty(),
    body('description').notEmpty(),
    body('authType').notEmpty(),
    body('options').notEmpty(),
    body('chainType')
      .notEmpty()
      .isIn([
        'Ethereum',
        'Polygon',
        'Klaytn',
        'Aptos',
        'Aurora',
        'Oasys',
        'XPLA',
      ]),
  ],
  errorValidator,
  auth,
  nftController.createNft,
);

/**
 * @desc [POST] NFT 인증메일 발송
 */
router.post(
  '/email',
  [body('nftId').notEmpty(), body('email').isEmail().notEmpty()],
  errorValidator,
  auth,
  nftController.sendAuthMailForNft,
);

/**
 * @desc [POST] NFT 메일 인증
 */
router.post(
  '/email/verification',
  [body('code').notEmpty().isString()],
  errorValidator,
  nftController.verifyMailForNft,
);

/**
 * @desc [GET] 유저가 받은 NFT ID 리스트 조회
 */
router.get('/own', auth, nftController.getOwnNftList);
router.get(
  '/own/check',
  [query('id').notEmpty()],
  auth,
  nftController.checkNftOwner,
);

/**
 * @desc [GET] 유저가 생성한 NFT ID 리스트 조회
 */
router.get('/creation', auth, nftController.getCreateNftList);

/**
 * @desc [POST] NFT 사진 인증
 */
router.post(
  '/verification/photo',
  upload.single('image'),
  [body('nftId').notEmpty()],
  auth,
  nftController.verifyPhotoForNft,
);

/**
 * @desc [GET] 통합될 NFT 확인 정보 조회
 */
router.get('/integrated/check', [
  query('chainType').isIn([
    'Ethereum',
    'Polygon',
    'Klaytn',
    'Aptos',
    'Aurora',
    'Oasys',
    'XPLA',
  ]),
  errorValidator,
  auth,
  nftController.getToBeIntegratedNfts,
]);

/**
 * @desc [POST]] NFT 발행
 */
router.post(
  '/publish',
  [body('nftId').isNumeric().notEmpty()],
  errorValidator,
  auth,
  nftController.publishNFT,
);

/**
 * @desc [PATCH] NFT 혜택 수정 후 발행
 */
router.patch(
  '/publish',
  [body('nftId').isNumeric().notEmpty()],
  errorValidator,
  auth,
  nftController.updateNftBenefit,
);

/**
 * @desc [POST] 통합 NFT 생성
 */
router.post(
  '/integrated',
  [
    body('nftIdArray').isArray().notEmpty(),
    body('chainType')
      .isString()
      .notEmpty()
      .isIn([
        'Ethereum',
        'Polygon',
        'Klaytn',
        'Aptos',
        'Aurora',
        'Oasys',
        'XPLA',
      ]),
  ],
  errorValidator,
  auth,
  nftController.createIntegratedNft,
);

/**
 * @desc [POST] 통합 NFT 업데이트
 */
router.patch(
  '/integrated',
  [
    body('integratedId').isNumeric().notEmpty(),
    body('contractId').isNumeric().notEmpty(),
    body('nftIdArray').isArray().notEmpty(),
    body('chainType')
      .isString()
      .notEmpty()
      .isIn([
        'Ethereum',
        'Polygon',
        'Klaytn',
        ,
        'Aptos',
        'Aurora',
        'Oasys',
        'XPLA',
      ]),
  ],
  errorValidator,
  auth,
  nftController.updateIntegratedNft,
);

/**
 * @desc [GET] NFT 상세 페이지 조회
 */
router.get(
  '/:nftId/detail',
  [param('nftId').notEmpty()],
  errorValidator,
  nftController.getNftDetailInfo,
);

/**
 * @desc [GET] NFT 소유자 정보 조회
 */
router.get(
  '/:nftId/owners',
  [param('nftId').notEmpty()],
  errorValidator,
  nftController.getNftOwnersInfo,
);

/**
 * @desc [GET] NFT 사진 요청 중인지 조회
 */
router.get(
  '/:nftId/photo',
  [param('nftId').notEmpty()],
  errorValidator,
  auth,
  nftController.getRequestAuthPhoto,
);

/**
 * @desc [POST] NFT 헤택 생성
 */
router.post(
  '/:nftId/reward',
  [
    param('nftId').notEmpty(),
    body('rewardName').notEmpty(),
    body('description').notEmpty(),
    body('category').isIn([
      'community',
      'membership',
      'game',
      'coupon',
      'ticket',
      null,
    ]),
    body('option').isString(),
  ],
  errorValidator,
  auth,
  nftController.createReward,
);

/**
 * @desc [PATCH] NFT 헤택 수정
 */
router.patch(
  '/:nftId/reward',
  [
    body('rewardId').notEmpty(),
    body('rewardName'),
    body('description'),
    body('category').isIn([
      'community',
      'membership',
      'game',
      'coupon',
      'ticket',
      null,
    ]),
    body('option').isString(),
  ],
  errorValidator,
  auth,
  nftController.updateRewardInfo,
);

/**
 * @desc [GET] NFT 혜택 상세보기
 */
router.get('/:rewardId/reward/detail', nftController.getNftRewardDetailInfo);

/**
 * @desc [POST] NFT 옮겨가기
 */
router.post(
  '/:nftId/transfer',
  [body('walletAddress').notEmpty()],
  errorValidator,
  auth,
  nftController.transferNft,
);

/**
 * @desc [DELETE] NFT 혜택 삭제
 */
router.delete(
  '/:nftId/:rewardId',
  [param('rewardId').notEmpty()],
  errorValidator,
  auth,
  nftController.deleteNftReward,
);

/**
 * @desc [POST] Welcome NFT 받기
 */
router.post('/welcome', errorValidator, auth, nftController.createWelcomeNft);

/**
 * @desc [POST] 입장코드 발급
 */
router.post('/invite', errorValidator, auth, nftController.createInviteCode);

/**
 * @desc [POST] 외부 NFT 확인하기
 */
router.post(
  '/external',
  [
    body('nftName').notEmpty().isString(),
    body('image').notEmpty().isString(),
    body('chainType').notEmpty().isString(),
    body('nftAddress').notEmpty().isString(),
  ],
  errorValidator,
  auth,
  nftController.takeExternalNft,
);

/**
 * @desc [POST] 외부 NFT 민팅하기
 */
router.patch(
  '/external',
  [
    body('chainType').notEmpty().isString(),
    body('nftAddress').notEmpty().isString(),
    body('isExternal').notEmpty().isBoolean(),
    body('tokenId').notEmpty().isNumeric(),
  ],
  errorValidator,
  auth,
  nftController.mintExternalNft,
);

export default router;
