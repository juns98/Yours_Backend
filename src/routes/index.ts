import { Router } from 'express';
import adminRouter from './adminRouter';
import authRouter from './authRouter';
import smsRouter from './smsRouter';
import userRouter from './userRouter';
import nftRouter from './nftRouter';
import searchRouter from './searchRouter';
import marketRouter from './marketRouter';

const router: Router = Router();

router.use('/admin', adminRouter);
router.use('/auth', authRouter);
router.use('/sms', smsRouter);
router.use('/user', userRouter);
router.use('/nft', nftRouter);
router.use('/search', searchRouter);
router.use('/market', marketRouter);

export default router;
