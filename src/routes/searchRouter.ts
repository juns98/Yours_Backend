import { Router } from 'express';
import { searchController } from '../controllers';
import auth from '../middlewares/auth';
import { query } from 'express-validator';

const router: Router = Router();

/**
 * @desc [GET] 검색 기능을 통한 조회
 */
router.get(
  '/',
  [query('type').isString(), query('keyword').isString()],
  auth,
  searchController.getSearchByName,
);

export default router;
