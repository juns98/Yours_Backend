import { Router } from 'express';
import { marketController } from '../controllers';
import errorValidator from '../middlewares/error/errorValidator';
import { body, check, query } from 'express-validator';
import { auth } from '../middlewares';
import { checkHeader } from '../middlewares';

const router: Router = Router();

/**
 * @desc [GET] NFT 상세 페이지 조회
 */
router.get(
  '/detail',
  [query('dashboardId').notEmpty()],
  errorValidator,
  checkHeader,
  marketController.getMarketNftDetail,
);

/**
 * @desc [GET] 마켓플레이스 NFT 리스팅 조회
 */
router.get(
  '/',
  [
    query('type')
      .notEmpty()
      .isString()
      .isIn(['all', 'coupon', 'ticket', 'membership', 'game']),
    query('sort').notEmpty().isString().isIn(['lastest', 'hottest']),
    query('size').notEmpty().isNumeric(),
    check('page').notEmpty().isNumeric().isFloat({ min: 1 }),
  ],
  errorValidator,
  marketController.getMarketNftList,
);

/**
 * @desc [POST] 좋아요 추가
 */
router.post(
  '/like',
  [
    body('userId').notEmpty().isNumeric(),
    body('dashboardId').notEmpty().isNumeric(),
  ],
  errorValidator,
  marketController.addLike,
);

/**
 * @desc [DELETE] 좋아요 취소
 */
router.delete(
  '/like',
  [
    body('userId').notEmpty().isNumeric(),
    body('dashboardId').notEmpty().isNumeric(),
  ],
  errorValidator,
  marketController.subLike,
);

/**
 * @desc [PATCH] NFT 구매
 */
router.patch(
  '/buy',
  [
    body('price').notEmpty().isNumeric(),
    body('dashboardId').notEmpty().isNumeric(),
  ],
  errorValidator,
  auth,
  marketController.buyNft,
);

/**
 * @desc [POST] NFT 판매
 */
router.post(
  '/sell',
  [
    body('nftId').notEmpty().isNumeric(),
    body('nftAddress').notEmpty().isString(),
    body('tokenType').notEmpty().isString(),
    body('price').notEmpty().isNumeric(),
  ],
  auth,
  marketController.sellNft,
);

/**
 * @desc [GET] 마이페이지 조회
 */
router.get(
  '/myPage',
  [query('options').notEmpty().isString().isIn(['own', 'sold', 'bookmark'])],
  auth,
  marketController.getMyPage,
);

/**
 * @desc [GET] 남이 보는 마이페이지 조회
 */
router.get(
  '/user',
  [
    query('id').notEmpty(),
    query('options').notEmpty().isString().isIn(['sell', 'sold']),
  ],
  marketController.getMyPageForBuyer,
);
export default router;
