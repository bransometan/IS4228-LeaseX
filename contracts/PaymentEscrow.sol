// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./LeaseToken.sol";

/*
PaymentEscrow contract is used to facilitate the payment transactions between the landlord and tenant.
- Any payment transaction between the landlord and tenant will be created, paid, released, or refunded using this contract.
- The contract is used by the RentalMarketplace contract to create, pay, release, and refund payments.
- The contract is also used by the RentDisputeDAO contract to create, pay, release, and refund payments in case of disputes.
*/

contract PaymentEscrow {
    
    // ################################################### STRUCTURE & STATE VARIABLES ################################################### //
    
    enum PaymentStatus {
        PENDING, // Payment has been created but not yet made
        PAID, // Payment has been made but not yet released
        RELEASED, // Payment has been released
        REFUNDED // Payment has been refunded
    }

    struct Payment {
        address payer; // Address of the payer
        address payee; // Address of the payee
        uint256 amount; // Amount of the payment
        PaymentStatus status; // Status of the payment
    }

    // The number of payment transactions that have been made
    uint256 private numOfPayments = 0;
    // The number of tokens landlord must stake in the potential event of a dispute with tenant
    uint256 private protectionFee;
    // Tenant or landlord who wants to initiate a dispute must stake a reward (in tokens) to incentivize voters to vote in the dispute
    uint256 private voterReward;
    // Reviewer who will vote on the dispute must stake a vote price (in tokens) to vote in the dispute
    uint256 private votePrice;

    LeaseToken leaseTokenContract; // LeaseToken contract

    mapping(uint256 => Payment) public payments; // Mapping of payment ID to payment details

    // The owner of the contract (PaymentEscrow), who can set the protection fee (for landlord) and voter rewards (for disputes)
    address private owner;
    // The address of the RentalMarketplace contract, mainly used for access control
    address private rentalMarketplaceAddress;
    // The address of the RentDisputeDAO contract, mainly used for access control
    address private rentDisputeDAOAddress;

    constructor(
        address _leaseTokenAddress,
        uint256 _protectionFee,
        uint256 _voterReward,
        uint256 _votePrice
    ) {
        leaseTokenContract = LeaseToken(_leaseTokenAddress);
        protectionFee = _protectionFee;
        voterReward = _voterReward;
        votePrice = _votePrice;
        owner = msg.sender;
    }

    // ################################################### EVENTS ################################################### //

    event paymentCreated(address payer, address payee, uint256 amount);
    event paymentPaid(address payer, address payee, uint256 amount);
    event paymentReleased(address payer, address payee, uint256 amount);
    event paymentRefunded(address payer, address payee, uint256 amount);
    event protectionFeeSet(uint256 protectionFee);
    event voterRewardSet(uint256 voterReward);
    event rentalMarketplaceAddressSet(address rentalMarketplaceAddress);
    event rentDisputeDAOAddressSet(address rentDisputeDAOAddress);

    // ################################################### MODIFIERS ################################################### //

    // Modifier to check if the caller is the owner of the contract
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    // Modifier to check if the caller is the RentalMarketplace contract
    modifier onlyRentalMarketplace() {
        require(
            msg.sender == rentalMarketplaceAddress,
            "Only RentalMarketplace can call this function"
        );
        _;
    }

    // Modifier to check if the caller is the RentDisputeDAO contract
    modifier onlyRentDisputeDAO() {
        require(
            msg.sender == rentDisputeDAOAddress,
            "Only RentDisputeDAO can call this function"
        );
        _;
    }

    // Modifier to check if the caller is the RentalMarketplace or RentDisputeDAO contract
    modifier onlyRentalMarketplaceOrRentDisputeDAO() {
        require(
            msg.sender == rentalMarketplaceAddress ||
                msg.sender == rentDisputeDAOAddress,
            "Only RentalMarketplace or RentDisputeDAO can call this function"
        );
        _;
    }

    // Modifier to check if the payer has sufficient balance to make the payment
    modifier checkSufficientBalance(address _payer, uint256 _amount) {
        require(
            leaseTokenContract.checkLeaseToken(_payer) >= _amount,
            "Payer does not have enough balance"
        );
        _;
    }

    // Modifier to check if the payment exists
    modifier PaymentExists(uint256 _paymentId) {
        require(_paymentId > 0 && _paymentId <= numOfPayments, "Payment does not exist");
        _;
    }

    // Modifier to check if the payment is pending
    modifier PaymentPending(uint256 _paymentId) {
        require(
            payments[_paymentId].status == PaymentStatus.PENDING,
            "Payment has already been made"
        );
        _;
    }

    // Modifier to check if the payment has been made
    modifier PaymentPaid(uint256 _paymentId) {
        require(
            payments[_paymentId].status == PaymentStatus.PAID,
            "Payment has not been made yet"
        );
        _;
    }

    // Modifier to check if the payment has been released
    modifier PaymentReleased(uint256 _paymentId) {
        require(
            payments[_paymentId].status == PaymentStatus.RELEASED,
            "Payment has not been released yet"
        );
        _;
    }

    // Modifier to check if the payment has been refunded
    modifier PaymentRefunded(uint256 _paymentId) {
        require(
            payments[_paymentId].status == PaymentStatus.REFUNDED,
            "Payment has not been refunded yet"
        );
        _;
    }

    // Modifier to check if the protection fee is valid
    modifier invalidProtectionFee(uint256 _protectionFee) {
        require(_protectionFee > 0, "Protection fee must be greater than 0");
        _;
    }

    // Modifier to check if voter reward is valid
    modifier invalidVoterReward(uint256 _voterReward) {
        require(_voterReward > 0, "Voter reward must be greater than 0");
        _;
    }

    // Modifier to check if the vote price is valid
    modifier invalidVotePrice(uint256 _votePrice) {
        require(_votePrice > 0, "Vote price must be greater than 0");
        _;
    }

    // Modifier to check if the RentalMarketplace address is valid
    modifier invalidRentalMarketplaceAddress(
        address _rentalMarketplaceAddress
    ) {
        require(
            _rentalMarketplaceAddress != address(0),
            "Invalid Rentalmarketpalce address"
        );
        _;
    }

    // Modifier to check if the RentDisputeDAO address is valid
    modifier invalidRentDisputeDAOAddress(address _rentDisputeDAOAddress) {
        require(
            _rentDisputeDAOAddress != address(0),
            "Invalid RentDisputeDAO address"
        );
        _;
    }

    // ################################################### FUNCTIONS ################################################### //

    // Function to create a payment transaction between the payer and payee
    function createPayment(
        address _payer,
        address _payee,
        uint256 _amount
    )
        public
        onlyRentalMarketplaceOrRentDisputeDAO
        checkSufficientBalance(_payer, _amount)
        returns (uint256)
    {
        // Increment the number of payments
        numOfPayments++;
        // Create a new payment transaction
        payments[numOfPayments] = Payment(
            _payer,
            _payee,
            _amount,
            PaymentStatus.PENDING // Payment is pending until it is made
        );

        // Payer approves PaymentEscrow to spend the payment amount on behalf of the payer
        leaseTokenContract.approveLeaseToken(_payer, address(this), _amount);

        // Emit an event for the created payment
        emit paymentCreated(_payer, _payee, _amount);
       
        // Return the payment ID (index starts from 1 as 0 is used for non-existent payments)
        return numOfPayments;
    }

    // Function to transfer the payment amount from the payer to the PaymentEscrow
    function pay(
        uint256 _paymentId
    )
        public
        onlyRentalMarketplaceOrRentDisputeDAO()
        PaymentExists(_paymentId)
        PaymentPending(_paymentId)
    {
        // Get the payment details
        Payment storage payment = payments[_paymentId];

        // Payer transfers the payment amount to PaymentEscrow
        leaseTokenContract.transferLeaseTokenFrom(
            address(this),
            payment.payer,
            address(this),
            payment.amount
        );
        // Update the payment status to PAID
        payment.status = PaymentStatus.PAID;
        // Emit an event for the payment made
        emit paymentPaid(payment.payer, payment.payee, payment.amount);
    }

    // Function to release the payment amount from the PaymentEscrow to the Payee
    function release(
        uint256 _paymentId
    )
        public
        onlyRentalMarketplaceOrRentDisputeDAO()
        PaymentExists(_paymentId)
        PaymentPaid(_paymentId)
    {
        // Get the payment details
        Payment storage payment = payments[_paymentId];

        // PaymentEscrow transfers the payment amount to the payee
        leaseTokenContract.transferLeaseToken(
            address(this),
            payment.payee,
            payment.amount
        );
        // Update the payment status to RELEASED
        payment.status = PaymentStatus.RELEASED;
        // Emit an event for the payment released
        emit paymentReleased(payment.payer, payment.payee, payment.amount);
    }

    // Function to refund the payment amount from the PaymentEscrow to the Payer (after PaymentEscrow has received the payment amount from the Payer)
    function refund(
        uint256 _paymentId
    )
        public
        onlyRentalMarketplaceOrRentDisputeDAO()
        PaymentExists(_paymentId)
        PaymentPaid(_paymentId)
    {
        // Get the payment details
        Payment storage payment = payments[_paymentId];
        // PaymentEscrow transfers the payment amount back to the Payer
        leaseTokenContract.transferLeaseToken(
            address(this),
            payment.payer, // Refund the payment amount to the Payer
            payment.amount
        );
        // Update the payment status to REFUNDED
        payment.status = PaymentStatus.REFUNDED;
        // Emit an event for the payment refunded
        emit paymentRefunded(payment.payer, payment.payee, payment.amount);
    }

    // ################################################### SETTER METHODS ################################################### //

    // Function to set the protection fee
    function setProtectionFee(
        uint256 _protectionFee
    ) public onlyOwner invalidProtectionFee(_protectionFee) {
        protectionFee = _protectionFee;
        emit protectionFeeSet(_protectionFee);
    }

    // Function to set the voter reward
    function setVoterReward(
        uint256 _voterReward
    ) public onlyOwner invalidVoterReward(_voterReward) {
        voterReward = _voterReward;
    }

    // Function to set the vote price
    function setVotePrice(
        uint256 _votePrice
    ) public onlyOwner invalidVotePrice(_votePrice) {
        votePrice = _votePrice;
    }

    // Function to set the RentalMarketplace address (Access Control)
    function setRentalMarketplaceAddress(
        address _rentalMarketplaceAddress
    )
        public
        onlyOwner
        invalidRentalMarketplaceAddress(_rentalMarketplaceAddress)
    {
        rentalMarketplaceAddress = _rentalMarketplaceAddress;
        emit rentalMarketplaceAddressSet(_rentalMarketplaceAddress);
    }

    // Function to set the RentDisputeDAO address (Access Control)
    function setRentDisputeDAOAddress(
        address _rentDisputeDAOAddress
    ) public onlyOwner invalidRentDisputeDAOAddress(_rentDisputeDAOAddress) {
        rentDisputeDAOAddress = _rentDisputeDAOAddress;
        emit rentDisputeDAOAddressSet(_rentDisputeDAOAddress);
    }

    // Function to update the payment details (in case of disputes)
    // Only RentDisputeDAO can call this function
    function updatePayment(
        uint256 _paymentId,
        address _payer,
        address _payee,
        uint256 _amount,
        PaymentStatus _status
    ) public onlyRentDisputeDAO() {
        payments[_paymentId] = Payment(_payer, _payee, _amount, _status);
    }

    // ################################################### GETTER METHODS ################################################### //

    // Function to get the protection fee
    function getProtectionFee() public view returns (uint256) {
        return protectionFee;
    }

    // Function to get the voter reward
    function getVoterReward() public view returns (uint256) {
        return voterReward;
    }

    // Function to get the vote price
    function getVotePrice() public view returns (uint256) {
        return votePrice;
    }

    // Function to get the payment details
    function getPayment(
        uint256 _paymentId
    ) public view returns (Payment memory) {
        return payments[_paymentId];
    }

    // Function to get the number of payments
    function getNumOfPayments() public view returns (uint256) {
        return numOfPayments;
    }

    // Function to get the balance of the contract
    function getBalance() public view returns (uint256) {
        return leaseTokenContract.checkLeaseToken(address(this));
    }

    // Function to get the owner of the contract
    function getOwner() public view returns (address) {
        return owner;
    }

    // Function to get the contract address
    function getContractAddress() public view returns (address) {
        return address(this);
    }

    // Function to get the RentalMarketplace address
    function getRentalMarketplaceAddress() public view returns (address) {
        return rentalMarketplaceAddress;
    }

    // Function to get the RentDisputeDAO address
    function getRentDisputeDAOAddress() public view returns (address) {
        return rentDisputeDAOAddress;
    }
}
