import axios from 'axios';
import { exceptionMessage } from '../modules/constants';
import { SocialUser } from '../interfaces/user/SocialUser';

const kakaoAuth = async (kakaoAccessToken: string) => {
  try {
    //*사용자 정보 받기
    const user = await axios({
      method: 'get',
      url: 'https://kapi.kakao.com/v2/user/me',
      headers: {
        Authorization: `Bearer ${kakaoAccessToken}`,
      },
    });
    const userId = user.data.id.toString();
    if (!userId) return exceptionMessage.INVALID_USER;

    const kakaoUser: SocialUser = {
      userId: userId,
    };

    return kakaoUser;
  } catch (error) {
    console.log('KakaoAuth error', error);
    return null;
  }
};

const googleAuth = async (googleAccessToken: string) => {
  try {
    const user = await axios({
      method: 'get',
      url: `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${googleAccessToken}`,
      headers: {
        authorization: `Bearer ${googleAccessToken}`,
      },
    });

    const userId = user.data.id;
    if (!userId) return exceptionMessage.INVALID_USER;
    const googleUser: SocialUser = {
      userId: userId,
    };

    return googleUser;
  } catch (error) {
    console.log('googleAuth error', error);
    return null;
  }
};

export default {
  kakaoAuth,
  googleAuth,
};
