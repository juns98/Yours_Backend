export interface nftNotification {
  name: string | null;
  nftName: string | null;
  nftId: number | null;
  phone: string | null;
  photoDescription?: string | null;
  rejectReason?: string | null;
  templateCode: string | null;
}
export interface recipient {
  recipientNo: string | null;
  templateParameter: {
    name: string | null;
    nftName: string | null;
    nftId: number | null;
  };
}
