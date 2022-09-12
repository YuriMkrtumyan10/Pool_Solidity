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

    function balanceView(address _addr) public view returns (uint256) {
        return stable.balanceOf(_addr);
    }

    function deposit(uint256 amount, address tokenAddress) external payable {
        require(
            amount >= 10 && amount <= 1000 ether,
            "Pool: Amount not in range"
        );
        require(tokenAddress == address(stable), "Pool: Only stable");
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
        address _stableRouter,
        uint256 _amount
    ) external {
        uint256 arbitrageAmount;

        if (_token1 != address(stable)) {
            arbitrageAmount = swap(
                _amount,
                address(stable),
                _token1,
                _stableRouter
            );
        } else {
            arbitrageAmount = _amount;
        }

        uint256 token1StartBalance = IERC20(_token1).balanceOf(address(this));
        uint256 token2StartBalance = IERC20(_token2).balanceOf(address(this));

        swap(arbitrageAmount, _token1, _token2, _router1);
        uint256 tradableAmount = IERC20(_token2).balanceOf(address(this)) -
            token2StartBalance;
        swap(tradableAmount, _token2, _token1, _router2);

        uint256 token1EndBalance = IERC20(_token2).balanceOf(address(this));
        require(token1EndBalance > token1StartBalance, "Pool: No profit!");

        if (_token1 != address(stable)) {
            arbitrageAmount = swap(
                _amount,
                _token1,
                address(stable),
                _stableRouter
            );
        }
    }

    function swap(
        uint256 _amount,
        address _tokenIn,
        address _tokenOut,
        address _router
    ) private returns (uint256) {
        address[] memory tokens = new address[](2);
        tokens[0] = _tokenIn;
        tokens[1] = _tokenOut;

        IERC20(_tokenIn).approve(_router, _amount);

        uint256[] memory _resultAmounts = IRouter(_router)
            .swapExactTokensForTokens(
                _amount,
                1,
                tokens,
                address(this),
                block.timestamp + 300
            );

        return _resultAmounts[_resultAmounts.length - 1];
    }
}
