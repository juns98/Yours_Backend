// import {
//   benefitNFTContract,
//   deployXplaNFT,
//   mintXplaNFT,
//   setXplaBenefitURI,
//   transferXplaNFT,
//   xplaFactoryContract,
// } from '../XPLAContract';

// const main = async () => {
//   const xplaUri = 'hi.app';
//   const xplaBenefitUri = 'hello.app';
//   const MINT_ADDRESS = '0x80926c4eB1d173f5A802A95C1F03dD346C8b1a81'; // node account
//   const RECEIVE_ADDRESS = '0xBCb32146fD1248c5FC673Ee0E4A5465Dc3e8F3F7'; // yours account
//   const nftId: number = 1;

//   // Set Xpla Benefit URI
//   const setURI = await setXplaBenefitURI(benefitNFTContract, xplaBenefitUri);
//   console.log(setURI);

//   // Deploy Xpla NFT
//   deployXplaNFT('Hello Xpla', xplaUri, xplaBenefitUri);

//   // // Mint Xpla NFT
//   mintXplaNFT(benefitNFTContract, MINT_ADDRESS);

//   // // transfer Xpla NFT
//   transferXplaNFT(benefitNFTContract, nftId, MINT_ADDRESS, RECEIVE_ADDRESS);
// };

// main();
