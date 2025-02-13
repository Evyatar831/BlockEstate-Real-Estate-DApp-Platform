require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      chainId: 31337  //The Chain ID 31337 is specifically required for Hardhat local networks.
    }
  }
};