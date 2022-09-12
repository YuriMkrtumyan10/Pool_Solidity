// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract PoolToken is ERC20("PoolToken", "PT"), AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() {
        _setupRole(MINTER_ROLE, msg.sender);
    }

    function grantMinter(address newMinter) external onlyRole(MINTER_ROLE) {
        _grantRole(MINTER_ROLE, newMinter);
    }

    function mint(address _to, uint256 _amount) external  {
        _mint(_to, _amount);
    }

    function burn(address _from, uint256 _amount)
        external
        //onlyRole(MINTER_ROLE)
    {
        _burn(_from, _amount);
    }
}
