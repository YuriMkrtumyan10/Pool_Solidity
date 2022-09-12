require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require("hardhat/config");

require("hardhat-deploy-ethers");

require("@nomiclabs/hardhat-etherscan");
require("hardhat-etherscan-abi");

const ALCHEMY_API_KEY = "Iz796qy2kpvTRBqiVIG0zGEsYYSLlyV4";
const ETHERSCAN_API_KEY = "8A6E18KUFHZSNMVG6XBMX3PIYWR8YQ14MK";
const PRIVATE_KEY = "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: {
        enabled: true,
        url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      },
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    caller: {
      default: 1,
    },
    staker: {
      default: 2,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  solidity: "0.8.9",
};


