import { Request, Response, NextFunction } from 'express';
import {
  exceptionMessage,
  responseMessage,
  statusCode,
} from '../modules/constants';
import jwt from '../modules/jwtHandler';
import { success, fail } from '../modules/constants/util';
import { userService } from '../services';

/**
 * [GET] 토큰 재발급
 */
const getToken = async (req: Request, res: Response, next: NextFunction) => {
  const refreshToken = req.headers.refreshtoken;

  //* 토큰이 없다면
  if (!refreshToken)
    return res
      .status(statusCode.BAD_REQUEST)
      .send(fail(statusCode.BAD_REQUEST, responseMessage.EMPTY_TOKEN));

  try {
    const refresh = jwt.verify(refreshToken as string);

    // 유효하지 않은 refreshToken
    if (refresh == exceptionMessage.TOKEN_INVALID) {
      return res
        .status(statusCode.UNAUTHORIZED)
        .send(fail(statusCode.UNAUTHORIZED, responseMessage.INVALID_TOKEN));
    }

    // 만료된 refreshToken
    if (refresh == exceptionMessage.TOKEN_EXPIRED) {
      return res
        .status(statusCode.UNAUTHORIZED)
        .send(fail(statusCode.UNAUTHORIZED, responseMessage.EXPIRED_TOKEN));
    }

    //* 유효한 refreshToken의 유저 찾기
    const user = await userService.findUserByRfToken(refreshToken as string);

    if (!user) {
      return res
        .status(statusCode.UNAUTHORIZED)
        .send(fail(statusCode.UNAUTHORIZED, responseMessage.INVALID_TOKEN));
    }

    const data = {
      accessToken: jwt.sign(user.id, user.email),
    };

    return res
      .status(statusCode.OK)
      .send(success(statusCode.OK, responseMessage.CREATE_TOKEN_SUCCESS, data));
  } catch (error) {
    next(error);
  }
};

export default {
  getToken,
};
