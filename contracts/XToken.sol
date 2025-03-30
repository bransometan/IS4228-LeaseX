// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ERC20.sol";

/*
XToken contract is a contract that allows users to get XToken by sending ETH to the contract address.
XToken utilises ERC20 token that is minted by the contract and can be transferred to other addresses.
XToken can be converted to ETH by calling the convertXTokenToETH function.
*/

contract XToken {

    // ################################################### STRUCTURE & STATE VARIABLES ################################################### //
    ERC20 erc20Contract;
    uint256 supplyLimit;
    uint256 currentSupply;
    address owner;

    constructor() {
        ERC20 e = new ERC20();
        erc20Contract = e;
        owner = msg.sender;
        supplyLimit = 1e18; // 1e18 XToken supply limit
    }
    // ################################################### EVENTS ################################################### //
    event getCredit(uint256 credit);
    event transferCredit(address sender, address recipient, uint256 credit);
    event transferCreditFrom(
        address spender,
        address sender,
        address recipient,
        uint256 credit
    );
    event approveCredit(address sender, address spender, uint256 credit);
    event refundCredit(address sender, uint256 amount);

    // ################################################### FUNCTIONS ################################################### //
    
    // Get XToken by sending ETH
    function getXToken() public payable {
        uint256 xToken = msg.value / 1e16; // Get XToken eligible (1e16 wei = 1 XToken OR 0.01 ETH = 1 XToken)
        require(
            erc20Contract.totalSupply() + xToken < supplyLimit,
            "XToken supply is not enough"
        );
        erc20Contract.mint(msg.sender, xToken);
        emit getCredit(xToken);
    }

    // Check XToken balance
    function checkXToken(address recipient) public view returns (uint256) {
        uint256 xToken = erc20Contract.balanceOf(recipient);
        return xToken;
    }

    // Transfer XToken to another address
    function transferXToken(
        address sender,
        address recipient,
        uint256 xToken
    ) public {
        erc20Contract.transferLT(sender, recipient, xToken);
        emit transferCredit(sender, recipient, xToken);
    }

    // Transfer XToken from another address to another address
    function transferXTokenFrom(
        address spender,
        address sender,
        address recipient,
        uint256 xToken
    ) public {
        erc20Contract.transferFromLT(spender, sender, recipient, xToken);
        emit transferCreditFrom(spender, sender, recipient, xToken);
    }

    // Approve XToken to be spent by another address
    function approveXToken(
        address sender,
        address spender,
        uint256 xToken
    ) public {
        erc20Contract.approveLT(sender, spender, xToken);
        emit approveCredit(sender, spender, xToken);
    }

    // Check XToken allowance for spender
    function checkXTokenAllowance(
        address _owner,
        address spender
    ) public view returns (uint256) {
        uint256 allowance = erc20Contract.allowance(_owner, spender);
        return allowance;
    }

    // Convert XToken to ETH
    function convertXTokenToETH(
        address sender,
        uint256 XTokenAmount
    ) public {
        require(XTokenAmount > 0, "Invalid amount");
        require(
            erc20Contract.balanceOf(sender) >= XTokenAmount,
            "Insufficient balance"
        );

        uint256 ethAmount = XTokenAmount * 1e16; // 1 XToken = 0.01 ETH (1e16 wei = 1 XToken)
        require(
            address(this).balance >= ethAmount,
            "Contract does not have enough Ether to send"
        );

        erc20Contract.burn(sender, XTokenAmount);
        payable(sender).transfer(ethAmount);
        emit refundCredit(sender, ethAmount);
    }
}
