const { time, loadFixture, mine } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { etherscan } = require("../hardhat.config");
const helpers = require("@nomicfoundation/hardhat-network-helpers");

describe("Pool", function () {
  async function deployPool() {
    const [owner, caller, lpProvider, otherAccount] = await ethers.getSigners();
    //USDT
    const stableAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const usdt = await ethers.getContractAt("IERC20", stableAddress);
    //poolToken == L  P token
    const PoolToken = await ethers.getContractFactory("PoolToken");
    const pooltoken = await PoolToken.deploy();

    const Pool = await ethers.getContractFactory("Pool");
    const pool = await Pool.deploy(stableAddress, pooltoken.address);
    //ImpersonasteAccount
    const address = "0xa2d28634c36a09400e52048cc70fc90a094aaead";
    await helpers.impersonateAccount(address);
    const impersonatedSigner = await ethers.getSigner(address);
    //--------------
    //Swaps
    const pancakeSwapAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
    const bakarySwapAddress = "0xCDe540d7eAFE93aC5fE6233Bee57E1270D3E330F";
    // const pancakeSwap = await getContractAt("IRouter", pancakeSwapAddress);
    // const bakarySwap = await getContractAt("IRouter", bakarySwapAddress);
    //--------------

    return { pool, owner, usdt, caller, lpProvider, pooltoken, impersonatedSigner, otherAccount };
  }

  xdescribe("Initialization", function () {
    it("Should initiate with correct args: ", async function () {
      const { pool, owner, caller, lpProvider, pooltoken, otherAccount } = await loadFixture(
        deployPool
      );
      const stableAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
      expect(await pool.stable().address, stableAddress);
      expect(await pool.lpToken().address, pooltoken.address);
    });
  });

  describe("Deposit", function () {
    it("Should initiate with correct args: ", async function () {
      const { pool, owner, usdt, caller, lpProvider, impersonatedSigner, pooltoken, otherAccount } =
        await loadFixture(deployPool);
      const depAmount = ethers.BigNumber.from("10000");
      // console.log((await pool.balanceView(impersonatedSigner.address)).toString())
      await usdt.connect(impersonatedSigner).transfer(owner.address, 10000000000)
      await usdt.connect(impersonatedSigner).transfer(caller.address, 1000000)
      // console.log((await pool.balanceView(impersonatedSigner.address)).toString())
      // console.log((await pool.balanceView(owner.address)).toString())
      await usdt.approve(pool.address, depAmount)
      await pool.deposit(depAmount, "0xdAC17F958D2ee523a2206206994597C13D831ec7")
      // console.log(await pooltoken.balanceOf(owner.address))
    });
  });

});
