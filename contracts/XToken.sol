// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ERC20.sol";

/*
LeaseToken contract is a contract that allows users to get LeaseToken by sending ETH to the contract address.
LeaseToken utilises ERC20 token that is minted by the contract and can be transferred to other addresses.
LeaseToken can be converted to ETH by calling the convertLeaseTokenToETH function.
*/

contract LeaseToken {

    // ################################################### STRUCTURE & STATE VARIABLES ################################################### //
    ERC20 erc20Contract;
    uint256 supplyLimit;
    uint256 currentSupply;
    address owner;

    constructor() {
        ERC20 e = new ERC20();
        erc20Contract = e;
        owner = msg.sender;
        supplyLimit = 1e18; // 1e18 LeaseToken supply limit
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
    
    // Get LeaseToken by sending ETH
    function getLeaseToken() public payable {
        uint256 leaseToken = msg.value / 1e16; // Get LeaseToken eligible (1e16 wei = 1 LeaseToken OR 0.01 ETH = 1 LeaseToken)
        require(
            erc20Contract.totalSupply() + leaseToken < supplyLimit,
            "LeaseToken supply is not enough"
        );
        erc20Contract.mint(msg.sender, leaseToken);
        emit getCredit(leaseToken);
    }

    // Check LeaseToken balance
    function checkLeaseToken(address recipient) public view returns (uint256) {
        uint256 leaseToken = erc20Contract.balanceOf(recipient);
        return leaseToken;
    }

    // Transfer LeaseToken to another address
    function transferLeaseToken(
        address sender,
        address recipient,
        uint256 leaseToken
    ) public {
        erc20Contract.transferLT(sender, recipient, leaseToken);
        emit transferCredit(sender, recipient, leaseToken);
    }

    // Transfer LeaseToken from another address to another address
    function transferLeaseTokenFrom(
        address spender,
        address sender,
        address recipient,
        uint256 leaseToken
    ) public {
        erc20Contract.transferFromLT(spender, sender, recipient, leaseToken);
        emit transferCreditFrom(spender, sender, recipient, leaseToken);
    }

    // Approve LeaseToken to be spent by another address
    function approveLeaseToken(
        address sender,
        address spender,
        uint256 leaseToken
    ) public {
        erc20Contract.approveLT(sender, spender, leaseToken);
        emit approveCredit(sender, spender, leaseToken);
    }

    // Check LeaseToken allowance for spender
    function checkLeaseTokenAllowance(
        address _owner,
        address spender
    ) public view returns (uint256) {
        uint256 allowance = erc20Contract.allowance(_owner, spender);
        return allowance;
    }

    // Convert LeaseToken to ETH
    function convertLeaseTokenToETH(
        address sender,
        uint256 leaseTokenAmount
    ) public {
        require(leaseTokenAmount > 0, "Invalid amount");
        require(
            erc20Contract.balanceOf(sender) >= leaseTokenAmount,
            "Insufficient balance"
        );

        uint256 ethAmount = leaseTokenAmount * 1e16; // 1 LeaseToken = 0.01 ETH (1e16 wei = 1 LeaseToken)
        require(
            address(this).balance >= ethAmount,
            "Contract does not have enough Ether to send"
        );

        erc20Contract.burn(sender, leaseTokenAmount);
        payable(sender).transfer(ethAmount);
        emit refundCredit(sender, ethAmount);
    }
}
