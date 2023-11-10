import { redisCli } from '../loader/redis';

//* 인증 코드 생성
const createAuthCode = () => {
  const code = Math.floor(Math.random() * (999999 - 100000)) + 100000;
  return code;
};

//* 인증 코드 검증
const verifyCode = async (authType: string, authCode: number | string) => {
  const result = await redisCli.get(authType);
  if (result == authCode) {
    await redisCli.del(authType);
    return true;
  }
  return false;
};

//* 인증 코드 저장
const saveAuthCode = async (authType: string, authCode: number) => {
  await redisCli.set(authType, authCode, { EX: 180 });
};

//* 메일 인증 코드 저장
const saveMailAuthCode = async (authType: string, authCode: string) => {
  const result = await redisCli.exists(authCode);
  if (result == 1) {
    await redisCli.del(authCode);
  }
  const data = await redisCli.set(authType, authCode, { EX: 180 });
};
export { createAuthCode, verifyCode, saveAuthCode, saveMailAuthCode };
