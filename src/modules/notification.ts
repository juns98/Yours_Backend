import axios from 'axios';
import config from '../config';
import { nftNotification, recipient } from '../interfaces/user/NftNotification';
const nhnHeader = {
  'Content-Type': 'application/json;charset=UTF-8',
  'X-Secret-Key': config.nhnCloudSecretKey,
};
const getToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = ('0' + (1 + date.getMonth())).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);

  return year + '-' + month + '-' + day;
};

const makeMessageData = async (messageInfo: nftNotification) => {
  const date = getToday();
  const recipient = {
    recipientNo: messageInfo.phone,
    templateParameter: {
      name: messageInfo.name,
      nftName: messageInfo.nftName,
      nftMintedAt: date,
      nftCreatedAt: date,
      nftAppliedAt: date,
      photoDescription: messageInfo.photoDescription,
      nftId: messageInfo.nftId,
      rejectReason: messageInfo.rejectReason,
    },
  };

  const data = {
    senderKey: config.nhnCloudSenderKey,
    templateCode: messageInfo.templateCode,
    recipientList: [recipient],
  };
  return data;
};

const makeMultipleMessageData = async (
  holderList: recipient[],
  templateCode: string,
) => {
  const data = {
    senderKey: config.nhnCloudSenderKey,
    templateCode: templateCode,
    recipientList: holderList,
  };
  return data;
};

const messageSender = async (messageInfo: nftNotification) => {
  try {
    const bodyData = await makeMessageData(messageInfo);
    const response = await axios.post(
      `${config.nhnCloudMessageSendUrl}/messages`,
      bodyData,
      { headers: nhnHeader },
    );
    const sendResult = response.data.message.sendResults;
    return sendResult[0];
  } catch (error) {
    throw error;
  }
};

const multipleMessageSender = async (
  holderList: recipient[],
  templateCode: string,
) => {
  try {
    const bodyData = await makeMultipleMessageData(holderList, templateCode);
    const response = await axios.post(
      `${config.nhnCloudMessageSendUrl}/messages`,
      bodyData,
      { headers: nhnHeader },
    );
    const sendResult = response.data.message.sendResults;
    return sendResult[0];
  } catch (error) {
    throw error;
  }
};

export { messageSender, multipleMessageSender };
