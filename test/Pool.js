const { time, loadFixture, mine } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { etherscan } = require("../hardhat.config");
const helpers = require("@nomicfoundation/hardhat-network-helpers");

describe("Pool", function () {
  async function deployPool() {
    const [owner, caller, otherAccount] = await ethers.getSigners();
    //USDT
    const stableAddress = "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0";
    const lusdt = await ethers.getContractAt("IERC20", stableAddress);
    //poolToken == LP token
    const PoolToken = await ethers.getContractFactory("PoolToken");
    const pooltoken = await PoolToken.deploy();

    const Pool = await ethers.getContractFactory("Pool");
    const pool = await Pool.deploy(stableAddress, pooltoken.address);

    //ImpersonasteAccount
    const address = "0x88cfdb5b32775940580dc3d34e90bc8c34f0cf7d";
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [address],
    });
    const impersonatedSigner = await ethers.getSigner(address);
    //--------------

    //Swaps
    const pancakeSwapAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
    const bakarySwapAddress = "0xCDe540d7eAFE93aC5fE6233Bee57E1270D3E330F";
    const pancakeSwap = await ethers.getContractAt("IRouter", pancakeSwapAddress);
    const bakarySwap = await ethers.getContractAt("IRouter", bakarySwapAddress);
    //--------------

    return {
      pool,
      owner,
      lusdt,
      caller,
      pancakeSwap,
      bakarySwap,
      pooltoken,
      impersonatedSigner,
      otherAccount,
    };
  }

  xdescribe("Initialization", function () {
    it("Should initiate with correct args: ", async function () {
      const { pool, owner, caller, lpProvider, pooltoken, otherAccount } = await loadFixture(
        deployPool
      );
      const stableAddress = "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0";
      expect(await pool.stable().address, stableAddress);
      expect(await pool.lpToken().address, pooltoken.address);
    });
  });

  xdescribe("Deposit", function () {
    it("Should deposit LUSDT and recieve LP tokens: ", async function () {
      const {
        pool,
        owner,
        lusdt,
        caller,
        lpProvider,
        impersonatedSigner,
        pooltoken,
        otherAccount,
      } = await loadFixture(deployPool); //100000 LUSD
      const depAmount = ethers.BigNumber.from("10000");
      await lusdt
        .connect(impersonatedSigner)
        .transfer(owner.address, ethers.BigNumber.from("10000000000000000000000"));

      await lusdt.approve(pool.address, depAmount);
      await pool.deposit(depAmount, "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0");
    });

    it("Should transfer LUSDT and receive LP tokens correctly: ", async function () {
      const {
        pool,
        owner,
        lusdt,
        caller,
        lpProvider,
        impersonatedSigner,
        pooltoken,
        otherAccount,
      } = await loadFixture(deployPool); //100000 LUSD
      const depAmount = ethers.BigNumber.from("10000");
      await lusdt
        .connect(impersonatedSigner)
        .transfer(owner.address, ethers.BigNumber.from("10000000000000000000000"));
      await lusdt.approve(pool.address, depAmount);

      //--------------------------------------------------------------------------
      await expect(() =>
        pool.deposit(depAmount, "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0")
      ).to.changeTokenBalances(lusdt, [owner.address, pool.address], [-depAmount, depAmount]);

      await lusdt.approve(pool.address, depAmount);
      await expect(() =>
        pool.deposit(depAmount, "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0")
      ).to.changeTokenBalance(pooltoken, owner, depAmount / 10);

      expect(await pool.LpTokenAmount, depAmount / 10);
      //--------------------------------------------------------------------------
    });

    //requires

    it("Should revert if depAmount is not in range: ", async function () {
      const {
        pool,
        owner,
        lusdt,
        caller,
        lpProvider,
        impersonatedSigner,
        pooltoken,
        otherAccount,
      } = await loadFixture(deployPool); //100000 LUSD
      const depAmount = ethers.BigNumber.from("1");
      await lusdt
        .connect(impersonatedSigner)
        .transfer(owner.address, ethers.BigNumber.from("10000000000000000000000"));
      await lusdt.approve(pool.address, depAmount);
      //--------------------------------------------------------------------------
      await expect(
        pool.deposit(depAmount, "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0")
      ).to.be.revertedWith("Pool: Amount not in range");
      //--------------------------------------------------------------------------
      const depAmount2 = ethers.BigNumber.from("100000000000000000000000000000000000");
      await expect(
        pool.deposit(depAmount2, "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0")
      ).to.be.revertedWith("Pool: Amount not in range");
      //--------------------------------------------------------------------------
    });

    it("Should revert if the tokenAddress arg is not stableAddress: ", async function () {
      const {
        pool,
        owner,
        lusdt,
        caller,
        lpProvider,
        impersonatedSigner,
        pooltoken,
        otherAccount,
      } = await loadFixture(deployPool); //100000 LUSD
      const depAmount = ethers.BigNumber.from("10000");
      await lusdt
        .connect(impersonatedSigner)
        .transfer(owner.address, ethers.BigNumber.from("10000000000000000000000"));
      await lusdt.approve(pool.address, depAmount);
      //--------------------------------------------------------------------------
      await expect(
        //Tether address
        pool.deposit(depAmount, "0xdAC17F958D2ee523a2206206994597C13D831ec7")
      ).to.be.revertedWith("Pool: Only stable address");
      //--------------------------------------------------------------------------
    });

    it("Should revert if msg.sender has not enough stable coins to deposit: ", async function () {
      const {
        pool,
        owner,
        lusdt,
        caller,
        lpProvider,
        impersonatedSigner,
        pooltoken,
        otherAccount,
      } = await loadFixture(deployPool); //100000 LUSD
      const depAmount = ethers.BigNumber.from("10000");
      //--------------------------------------------------------------------------
      await expect(
        pool.deposit(depAmount, "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0")
      ).to.be.revertedWith("Pool: Not enough balance");
      //--------------------------------------------------------------------------
    });

    it("Should revert if pool has no allowance to take msg.sender's stable coins: ", async function () {
      const {
        pool,
        owner,
        lusdt,
        caller,
        lpProvider,
        impersonatedSigner,
        pooltoken,
        otherAccount,
      } = await loadFixture(deployPool); //100000 LUSD
      const depAmount = ethers.BigNumber.from("10000");
      await lusdt
        .connect(impersonatedSigner)
        .transfer(owner.address, ethers.BigNumber.from("10000000000000000000000"));
      //--------------------------------------------------------------------------
      await expect(
        pool.deposit(depAmount, "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0")
      ).to.be.revertedWith("Pool: Not enough allowance");
      //--------------------------------------------------------------------------
    });
  });

  xdescribe("Withdraw", function () {
    it("Should be able to withdraw correctly: ", async function () {
      const {
        pool,
        owner,
        lusdt,
        caller,
        lpProvider,
        impersonatedSigner,
        pooltoken,
        otherAccount,
      } = await loadFixture(deployPool); //100000 LUSD
      const depAmount = ethers.BigNumber.from("10000");
      await lusdt
        .connect(impersonatedSigner)
        .transfer(owner.address, ethers.BigNumber.from("10000000000000000000000"));
      await lusdt.approve(pool.address, depAmount);
      await pool.deposit(depAmount, "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0");

      await pool.withdraw(10000);
    });

    it("Should transfer stable coins back and burn LP tokens after withdrawal: ", async function () {
      const {
        pool,
        owner,
        lusdt,
        caller,
        lpProvider,
        impersonatedSigner,
        pooltoken,
        otherAccount,
      } = await loadFixture(deployPool); //100000 LUSD
      const depAmount = ethers.BigNumber.from("10000");
      await lusdt
        .connect(impersonatedSigner)
        .transfer(owner.address, ethers.BigNumber.from("10000000000000000000000"));
      await lusdt.approve(pool.address, depAmount);
      await pool.deposit(depAmount, "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0");

      //--------------------------------------------------------------------------
      await expect(() => pool.withdraw(5000)).to.changeTokenBalances(
        lusdt,
        [owner.address, pool.address],
        [depAmount / 2, -depAmount / 2]
      );
      expect(await pool.LpTokenAmount, depAmount / 10 / 2);
      //--------------------------------------------------------------------------
      await expect(() => pool.withdraw(5000)).to.changeTokenBalance(pooltoken, owner, -500);
      //--------------------------------------------------------------------------
      expect(await pool.LpTokenAmount, 0);
      //--------------------------------------------------------------------------
    });

    //requires
    it("Should revert when user didn't deposit but want to withdraw: ", async function () {
      const {
        pool,
        owner,
        lusdt,
        caller,
        lpProvider,
        impersonatedSigner,
        pooltoken,
        otherAccount,
      } = await loadFixture(deployPool);
      //--------------------------------------------------------------------------
      await expect(pool.withdraw(10000)).to.be.revertedWith("Pool: Dont have LpTokens");
      //--------------------------------------------------------------------------
    });

    it("Should revert when user wants to withdraw more money than have: ", async function () {
      const {
        pool,
        owner,
        lusdt,
        caller,
        lpProvider,
        impersonatedSigner,
        pooltoken,
        otherAccount,
      } = await loadFixture(deployPool); //100000 LUSD
      const depAmount = ethers.BigNumber.from("10000");
      await lusdt
        .connect(impersonatedSigner)
        .transfer(owner.address, ethers.BigNumber.from("10000000000000000000000"));
      await lusdt.approve(pool.address, depAmount);
      await pool.deposit(depAmount, "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0");

      //--------------------------------------------------------------------------
      await expect(pool.withdraw(depAmount * 10)).to.be.revertedWith("Pool: Not enough LpTokens");
      //--------------------------------------------------------------------------
    });
  });

  describe("Swap", function () {
    it("Should swap in a coresponding router correctly: ", async function () {
      const {
        pool,
        owner,
        lusdt,
        caller,
        pancakeSwap,
        bakarySwap,
        impersonatedSigner,
        pooltoken,
        otherAccount,
      } = await loadFixture(deployPool);
      const swapAmount = ethers.BigNumber.from("10000");
      const tokenIn = lusdt.address;
      const tokenOut = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";
      // console.log((await pool.balanceView(impersonatedSigner.address)).toString());
      await lusdt
        .connect(impersonatedSigner)
        .transfer(pool.address, ethers.BigNumber.from("10000000000000000000000"));
      //console.log((await pool.balanceView(impersonatedSigner.address)).toString());
      //console.log((await pool.balanceView(pool.address)).toString());

      const a = await pool.swap(swapAmount, tokenIn, tokenOut, pancakeSwap.address);
    });
  });
});
