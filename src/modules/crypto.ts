import CryptoJS from 'crypto-js';
import config from '../config';

const key = config.cryptoKey;
const iv = config.cryptoIV;

const encodeByAES256 = async (userId: string) => {
  let cipher = CryptoJS.AES.encrypt(userId, CryptoJS.enc.Utf8.parse(key), {
    iv: CryptoJS.enc.Utf8.parse(iv),
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC,
  }).toString();

  cipher = cipher
    .replace(/\+/g, 'p1L2u3S')
    .replace(/\//g, 's1L2a3S4h')
    .replace(/=/g, 'e1Q2u3A4l')
    .replace(/&/g, 'ieklip34')
    .replace(/%/g, 'eir33r');
  return cipher;
};

const decodeByAES256 = async (code: string) => {
  const decodedCode = code
    .replace(/p1L2u3S/g, '+')
    .replace(/s1L2a3S4h/g, '/')
    .replace(/e1Q2u3A4l/g, '=')
    .replace(/ieklip34/g, '&')
    .replace(/eir33r/g, '%');
  const cipher = CryptoJS.AES.decrypt(
    decodedCode,
    CryptoJS.enc.Utf8.parse(key),
    {
      iv: CryptoJS.enc.Utf8.parse(iv),
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC,
    },
  );
  return cipher.toString(CryptoJS.enc.Utf8);
};

export { encodeByAES256, decodeByAES256 };
