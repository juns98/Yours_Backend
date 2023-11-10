import { Router } from 'express';
import { body } from 'express-validator';
import errorValidator from '../middlewares/error/errorValidator';
import { userController } from '../controllers';

const router: Router = Router();

/**
 * @desc [POST] 휴대폰 본인 인증코드 문자 발송
 */
router.post(
  '/send',
  [body('phoneNumber').notEmpty()],
  [body('countryCode').notEmpty()],
  errorValidator,
  userController.sendAuthMessage,
);

export default router;
