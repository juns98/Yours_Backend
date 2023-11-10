import { Request, Response, NextFunction } from 'express';
import { responseMessage, statusCode } from '../modules/constants';
import { success, fail } from '../modules/constants/util';
import { searchService } from '../services';

/**
 * [GET] 검색 기능을 통한 조회
 * @url /api/search?type={}&keyword={}
 */
const getSearchByName = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.body.id;
  const { type, keyword } = req.query;
  try {
    const data = await searchService.getSearchByName(
      +userId,
      type as string,
      keyword as string,
    );
    if (!data) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(fail(statusCode.NOT_FOUND, responseMessage.NOT_FOUND));
    }
    return res
      .status(statusCode.OK)
      .send(
        success(statusCode.OK, responseMessage.READ_SEARCH_INFO_SUCCESS, data),
      );
  } catch (error) {
    next(error);
  }
};
export default {
  getSearchByName,
};
