import CryptoJS from 'crypto-js';
import config from '../config';

const makeSignature = (time: string) => {
  const space = ' '; // one space
  const newLine = '\n'; // new line
  const method = 'POST'; // method
  const url = `/sms/v2/services/${config.naverCloudServiceId}/messages`; // url (include query string)
  const timestamp = time;
  const accessKey = `${config.naverCloudSmsAccessKey}`; // access key id (from portal or Sub Account)
  const secretKey = `${config.naverCloudSmsSecretKey}`; // secret key (from portal or Sub Account)

  const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);
  hmac.update(method);
  hmac.update(space);
  hmac.update(url);
  hmac.update(newLine);
  hmac.update(timestamp);
  hmac.update(newLine);
  hmac.update(accessKey);

  const hash = hmac.finalize();

  return hash.toString(CryptoJS.enc.Base64);
};

export default makeSignature;
