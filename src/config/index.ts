import dotenv from 'dotenv';

const envFound = dotenv.config();

if (envFound.error) {
  throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

export default {
  /**
   * env
   */
  env: process.env.NODE_ENV as string,
  /**
   * PORT
   */
  port: parseInt(process.env.PORT as string, 10) as number,

  /**
   * JWT
   */
  jwtSecret: process.env.JWT_SECRET as string,
  jwtAlgo: process.env.JWT_ALGORITHM as string,

  /**
   * KAKAO
   */
  kakaoRestApiKey: process.env.KAKAO_REST_API_KEY as string,
  kakaoRedirectUri: process.env.KAKAO_REDIRECT_URI as string,

  /**
   * REDIS
   */
  redisHost: process.env.REDIS_HOST as string,
  redisPort: parseInt(process.env.REDIS_PORT as string, 10) as number,
  redisUserName: process.env.REDIS_USERNAME as string,
  redisPassword: process.env.REDIS_PASSWORD as string,

  /**
   * NAVER_CLOUD
   */
  naverCloudServiceId: process.env.NAVER_CLOUD_SERVICE_ID as string,
  naverCloudSmsAccessKey: process.env.NAVER_CLOUD_ACCESS_KEY as string,
  naverCloudSmsSecretKey: process.env.NAVER_CLOUD_SECRET_KEY as string,

  /**
   * CALL_NUMBER
   */
  callNumber: process.env.CALL_NUMBER as string,

  /**
   * SLACK_WEBHOOK
   */
  webhookURL: process.env.SLACK_WEBHOOK_URL as string,
  /**
   * EC2 URL
   */
  ec2URL: process.env.EC2_URL as string,

  /**
   * S3 bucket
   */
  s3AccessKey: process.env.S3_ACCESS_KEY as string,
  s3SecretKey: process.env.S3_SECRET_KEY as string,
  bucketName: process.env.S3_BUCKET as string,

  /**
   * AuthMail
   */
  authMailUser: process.env.MAIL_USER as string,
  authMailPassWord: process.env.MAIL_PASSWORD as string,

  /**
   * Web3
   */
  walletAddress: process.env.WALLET_ADDRESS as string,
  gorilRPC: process.env.GORIL_RPC as string,
  mumbaiRPC: process.env.MUMBAI_RPC as string,
  baobabRPC: process.env.BAOBAB_RPC as string,
  polygonRPC: process.env.POLYGON_RPC as string,
  sepoliaRPC: process.env.SEPOLIA_RPC_URL_HTTP as string,
  klaytnRPC: process.env.KLAYTN_RPC as string,
  oasysRPC: process.env.OASYS_RPC as string,
  xplaRPC: process.env.XPLA_RPC as string,
  WalletSecretKey: process.env.WALLET_SECRET as string,
  XPLAWalletSecretKey: process.env.XPLA_WALLET_SECRET as string,
  ipfsId: process.env.REACT_APP_IPFS_ID as string,
  ipfsSecret: process.env.REACT_APP_IPFS_SECRET as string,
  walletPrivateKeyDev1: process.env.WALLET_PRIVATE_KEY_DEV1 as string,
  etherSacnApiKey: process.env.ETHERSCAN_API_KEY as string,
  sepoliaEntryPointAddress: process.env.SEPOLIA_ENTRY_POINT_ADDRESS as string,
  sepoliaPaymasterAddress: process.env.SEPOLIA_PAYMASTER_ADDRESS as string,
  sepoliaFactoryAddress: process.env.SEPOLIA_FACTORY_ADDRESS as string,
  mumbaiEntryPointAddress: process.env.MUMBAI_ENTRY_POINT_ADDRESS as string,
  mumbaiPaymasterAddress: process.env.MUMBAI_PAYMASTER_ADDRESS as string,
  mumbaiFactoryAddress: process.env.MUMBAI_FACTORY_ADDRESS as string,
  aptosNodeUrl: process.env.APTOS_NODE_URL as string,
  aptosFaucetUrl: process.env.APTOS_FAUCET_URL as string,
  aptosWalletAddress: process.env.APTOS_WALLET_ADDRESS as string,
  aptosWalletPrivateKey: process.env.APTOS_WALLET_PRIVATE_KEY as string,
  aptosCollectionName: process.env.APTOS_COLLECTION_NAME as string,
  auroraRPC: process.env.AURORA_RPC as string,
  auroraEntryPointAddress: process.env.AURORA_ENTRY_POINT_ADDRESS as string,
  auroraPaymasterAddress: process.env.AURORA_PAYMASTER_ADDRESS as string,
  auroraFactoryAddress: process.env.AURORA_FACTORY_ADDRESS as string,
  nearWalletPrivateKey: process.env.NEAR_WALLET_PRIVATE_KEY as string,
  nearNetworkId: process.env.NEAR_NETWORK_ID as string,
  nearNodeUrl: process.env.NEAR_NODE_URL as string,
  nearWalletUrl: process.env.NEAR_WALLET_URL as string,
  nearHelperUrl: process.env.NEAR_HELPER_URL as string,
  nearExplorerUrl: process.env.NEAR_EXPLORER_URL as string,
  nearFactoryId: process.env.NEAR_FACTORY_ID as string,
  nearAccountId: process.env.NEAR_ACCOUNT_ID as string,
  polygonImage: process.env.POLYGON_IMAGE as string,
  ethereumImage: process.env.ETHEREUM_IMAGE as string,
  klaytnImage: process.env.KLAYTN_IMAGE as string,
  solanaImage: process.env.SOLANA_IMAGE as string,
  auroraImage: process.env.AURORA_IMAGE as string,
  aptosImage: process.env.APTOS_IMAGE as string,

  /**
   * NHN_CLOUD
   */
  nhnCloudAppkey: process.env.NHN_CLOUD_APP_KEY as string,
  nhnCloudSecretKey: process.env.NHN_CLOUD_SECRET_KEY as string,
  nhnCloudSenderKey: process.env.NHN_CLOUD_SENDER_KEY as string,
  nhnCloudMessageSendUrl: process.env.NHN_CLOUD_MESSAGE_SEND_URL as string,

  /**
   * SENTRY
   */
  sentryDsn: process.env.SENTRY_DSN as string,
  sentryEnvironment: process.env.SENTRY_ENVIRONMENT as string,

  /**
   * crypto
   */
  cryptoKey: process.env.CRYPTO_KEY as string,
  cryptoIV: process.env.CRYPTO_IV as string,
};
