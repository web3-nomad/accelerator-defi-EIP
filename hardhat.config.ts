import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";

import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 100,
      },
    },
  },
  networks: {
    mainnet: {
      chainId: 295, // hedera mainnet chainId
      url: RPC_URL,
      accounts: [PRIVATE_KEY || ""],
    },
    testnet: {
      chainId: 296, // hedera testnet chainId
      url: RPC_URL,
      accounts: [PRIVATE_KEY || ""],
    },
    previewnet: {
      chainId: 297, // hedera previewnet chainId
      url: RPC_URL,
      accounts: [PRIVATE_KEY || ""],
    },
    hardhat: {
      chainId: 31337,
      gas: 1800000,
      // forking: {
      //   url: process.env.RPC_URL || "",
      // },
    },
  },  
  gasReporter: {
    enabled: true,
    currency: "USD",
    coinmarketcap: COINMARKETCAP_API_KEY,
  },
  mocha: {
    timeout: 100000000,
  },
};

export default config;