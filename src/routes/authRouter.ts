import { body } from 'express-validator';
import { Router } from 'express';
import { tokenController } from '../controllers';
import { userController } from '../controllers';
import errorValidator from '../middlewares/error/errorValidator';

const router: Router = Router();

/**
 * @desc [POST] 구글/카카오 로그인
 */
router.post('/', userController.getSocialUser);

/**
 * @desc [POST] Yours 회원가입
 */
router.post(
  '/signup',
  [
    body('snsId').notEmpty(),
    body('nickname').notEmpty(),
    body('profileImage').notEmpty(),
    body('email').notEmpty(),
    body('phone').notEmpty(),
    body('social').notEmpty(),
    body('isMarketing').notEmpty(),
    body('secret').notEmpty(),
    body('walletAddress').notEmpty(),
  ],
  errorValidator,
  userController.createUser,
);

/**
 * @desc [GET] 토큰 재발급
 */
router.get('/token', tokenController.getToken);

/**
 * @desc [POST] 인증코드 일치 여부 확인
 */
router.post(
  '/verification',
  [body('authText').notEmpty(), body('authCode').notEmpty()],
  errorValidator,
  userController.verifyAuthCode,
);

export default router;
