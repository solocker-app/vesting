import { ContractInfo } from './state';

const data = [
  56, 54, 57, 49, 50, 57, 56, 53, 48, 56, 50, 56, 49, 50, 50, 53, 55, 51, 52,
  56, 57, 51, 53, 53, 56, 49, 52, 56, 48, 53, 57, 255, 234, 187, 99, 7, 115,
  230, 228, 8, 70, 176, 135, 173, 124, 54, 61, 49, 6, 54, 33, 210, 205, 155,
  121, 44, 249, 220, 58, 236, 24, 62, 235, 244, 23, 59, 17, 73, 106, 94, 7, 113,
  97, 53, 90, 46, 153, 228, 33, 51, 28, 95, 8, 131, 49, 70, 135, 164, 16, 109,
  212, 81, 155, 39, 31, 28, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0,
];

console.log(ContractInfo.fromBuffer(Buffer.from(data)));
