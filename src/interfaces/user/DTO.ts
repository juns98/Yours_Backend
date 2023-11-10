export interface userCreateDto {
  nickname: string;
  snsId: string;
  profileImage: string;
  email: string;
  phone: string;
  social: string;
  isMarketing: boolean;
  secret: string;
  walletAddress: [
    {
      chainType: string;
      address: string;
    },
  ];
  language: string;
}

export interface createNftDto {
  ownerId: number;
  nftName: string;
  image: string;
  description: string;
  authType: number;
  options: string;
  chainType: string;
}

export interface userInfo {
  userId: number;
  nftId: number;
  email: string;
}

export interface chargeYrpDto {
  type: string;
  isCompleted: boolean;
  chargedAt: Date;
  transactionHash: string;
  walletAddress: string;
  stableChain: string;
  stableAmount: number;
  yrpAmount: number;
  feeAmount: number;
}
