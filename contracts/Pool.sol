// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./PoolToken.sol";

contract Pool {
    uint256 pTokenAmount;
    IERC20 public stable;
    PoolToken public pToken;

    constructor(address _stable, address _pToken) {
        stable = IERC20(_stable);
        pToken = PoolToken(_pToken);
    }

    // function contractProfit() public {
    //     stable.mint(address(this), 1000);
    // }

    function deposit(uint256 amount, address tokenAddress) external payable {
        require(
            amount >= 100 && amount <= 1000 ether,
            "Pool: Amount not in range"
        );
        require(tokenAddress == address(stable), "Pool :Only stable");
        require(
            stable.balanceOf(msg.sender) >= amount,
            "Pool: Not enough balance"
        );
        require(
            stable.allowance(msg.sender, address(this)) >= amount,
            "Pool: Not enough allowance"
        );
        stable.transferFrom(msg.sender, address(this), amount);
        pTokenAmount += amount / 10;
        pToken.mint(msg.sender, amount / 10);
    }

    function withdraw() external {
        require(pToken.balanceOf(msg.sender) > 0, "Pool: Dont have pTokens");
        uint256 pTokenBalance = pToken.balanceOf(msg.sender);
        pToken.burn(msg.sender, pTokenBalance);
        stable.transfer(
            msg.sender,
            ((pTokenBalance * (stable.balanceOf(address(this)))) / pTokenAmount)
        );
        pTokenAmount -= pTokenBalance;
    }
}
