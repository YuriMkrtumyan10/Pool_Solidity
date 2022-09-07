// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./PoolToken.sol";
import "./IRouter.sol";

contract Pool {
    uint256 LpTokenAmount;
    IERC20 public stable;
    PoolToken public lpToken;

    constructor(address _stable, address _lpToken) {
        stable = IERC20(_stable);
        lpToken = PoolToken(_lpToken);
    }

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
        LpTokenAmount += amount / 10;
        lpToken.mint(msg.sender, amount / 10);
    }

    function withdraw(uint256 _amount) external {
        require(lpToken.balanceOf(msg.sender) > 0, "Pool: Dont have LpTokens");
        uint256 lpValueOfaGivenAmount = _amount / 10;
        require(
            lpToken.balanceOf(msg.sender) - lpValueOfaGivenAmount >= 0,
            "Pool: Not enough LpTokens"
        );
        lpToken.burn(msg.sender, lpValueOfaGivenAmount);
        stable.transfer(msg.sender, _amount);

        LpTokenAmount -= lpValueOfaGivenAmount;
    } 

    function arbitrage(
        address _router1,
        address _router2,
        address _token1,
        address _token2,
        uint256 _amount
    ) external {
        swap(_amount, _token1, _token2, _router1);
        uint256 token2BalanceBefore = IERC20(_token2).balanceOf(address(this));
        uint256 token2BalanceAfter = IERC20(_token2).balanceOf(address(this)) -
            token2BalanceBefore;
        swap(token2BalanceAfter, _token2, _token1, _router2);
    }

    function swap(
        uint256 _amount,
        address _token1,
        address _token2,
        address _router
    ) private {
        address[] memory tokens = new address[](2);
        tokens[0] = _token1;
        tokens[1] = _token2;
        uint256 desirableAmount = IRouter(_router).getAmountsOut(
            _amount,
            tokens
        )[1];
        require(desirableAmount > 100);
        IRouter(_router).swapExactTokensForTokens(
            _amount,
            1,
            tokens,
            msg.sender,
            block.timestamp + 300
        );
    }
}
