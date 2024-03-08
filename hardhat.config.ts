import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";

import * as dotenv from "dotenv";

dotenv.config();

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
    test: {
      url: process.env.TEST_RPC_URL,
      accounts: [process.env.PRIVATE_KEY || ""],
    },
    main: {
      url: process.env.MAIN_RPC_URL,
      accounts: [process.env.MAIN_PRIVATE_KEY || ""],
    },
    hardhat: {
      gas: 1800000,
      forking: {
        url: process.env.TEST_RPC_URL || "",
      },
    },
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  mocha: {
    timeout: 100000000,
  },
};

export default config;
