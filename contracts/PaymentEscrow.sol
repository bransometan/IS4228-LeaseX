// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./XToken.sol";

contract PaymentEscrow {
    enum PaymentStatus {
        PENDING,
        PAID,
        RELEASED,
        REFUNDED
    }

    struct Payment {
        address payer;
        address payee;
        uint256 amount;
        PaymentStatus status;
    }

    uint256 private numOfPayments = 0;

    uint256 private protectionFee;

    uint256 private voterReward;

    uint256 private votePrice;

    XToken xTokenContract;

    mapping(uint256 => Payment) public payments;

    address private owner;

    address private leaseMarketplaceAddress;

    address private leaseDisputeDAOAddress;

    constructor(
        address _xTokenAddress,
        uint256 _protectionFee,
        uint256 _voterReward,
        uint256 _votePrice
    ) {
        xTokenContract = XToken(_xTokenAddress);
        protectionFee = _protectionFee;
        voterReward = _voterReward;
        votePrice = _votePrice;
        owner = msg.sender;
    }

    event paymentCreated(address payer, address payee, uint256 amount);
    event paymentPaid(address payer, address payee, uint256 amount);
    event paymentReleased(address payer, address payee, uint256 amount);
    event paymentRefunded(address payer, address payee, uint256 amount);
    event protectionFeeSet(uint256 protectionFee);
    event voterRewardSet(uint256 voterReward);
    event leaseMarketplaceAddressSet(address leaseMarketplaceAddress);
    event leaseDisputeDAOAddressSet(address leaseDisputeDAOAddress);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyLeaseMarketplace() {
        require(
            msg.sender == leaseMarketplaceAddress,
            "Only LeaseMarketplace can call this function"
        );
        _;
    }

    modifier onlyLeaseDisputeDAO() {
        require(
            msg.sender == leaseDisputeDAOAddress,
            "Only LeaseDisputeDAO can call this function"
        );
        _;
    }

    modifier onlyLeaseMarketplaceOrLeaseDisputeDAO() {
        require(
            msg.sender == leaseMarketplaceAddress ||
                msg.sender == leaseDisputeDAOAddress,
            "Only LeaseMarketplace or LeaseDisputeDAO can call this function"
        );
        _;
    }

    modifier checkSufficientBalance(address _payer, uint256 _amount) {
        require(
            xTokenContract.checkXToken(_payer) >= _amount,
            "Payer does not have enough balance"
        );
        _;
    }

    modifier PaymentExists(uint256 _paymentId) {
        require(
            _paymentId > 0 && _paymentId <= numOfPayments,
            "Payment does not exist"
        );
        _;
    }

    modifier PaymentPending(uint256 _paymentId) {
        require(
            payments[_paymentId].status == PaymentStatus.PENDING,
            "Payment has already been made"
        );
        _;
    }

    modifier PaymentPaid(uint256 _paymentId) {
        require(
            payments[_paymentId].status == PaymentStatus.PAID,
            "Payment has not been made yet"
        );
        _;
    }

    modifier PaymentReleased(uint256 _paymentId) {
        require(
            payments[_paymentId].status == PaymentStatus.RELEASED,
            "Payment has not been released yet"
        );
        _;
    }

    modifier PaymentRefunded(uint256 _paymentId) {
        require(
            payments[_paymentId].status == PaymentStatus.REFUNDED,
            "Payment has not been refunded yet"
        );
        _;
    }

    modifier invalidProtectionFee(uint256 _protectionFee) {
        require(_protectionFee > 0, "Protection fee must be greater than 0");
        _;
    }

    modifier invalidVoterReward(uint256 _voterReward) {
        require(_voterReward > 0, "Voter reward must be greater than 0");
        _;
    }

    modifier invalidVotePrice(uint256 _votePrice) {
        require(_votePrice > 0, "Vote price must be greater than 0");
        _;
    }

    modifier invalidLeaseMarketplaceAddress(
        address _leaseMarketplaceAddress
    ) {
        require(
            _leaseMarketplaceAddress != address(0),
            "Invalid Leasemarketpalce address"
        );
        _;
    }

    modifier invalidLeaseDisputeDAOAddress(address _leaseDisputeDAOAddress) {
        require(
            _leaseDisputeDAOAddress != address(0),
            "Invalid LeaseDisputeDAO address"
        );
        _;
    }

    function createPayment(
        address _payer,
        address _payee,
        uint256 _amount
    )
        public
        onlyLeaseMarketplaceOrLeaseDisputeDAO
        checkSufficientBalance(_payer, _amount)
        returns (uint256)
    {
        numOfPayments++;

        payments[numOfPayments] = Payment(
            _payer,
            _payee,
            _amount,
            PaymentStatus.PENDING
        );

        xTokenContract.approveXToken(_payer, address(this), _amount);

        emit paymentCreated(_payer, _payee, _amount);

        return numOfPayments;
    }

    function pay(
        uint256 _paymentId
    )
        public
        onlyLeaseMarketplaceOrLeaseDisputeDAO
        PaymentExists(_paymentId)
        PaymentPending(_paymentId)
    {
        Payment storage payment = payments[_paymentId];

        xTokenContract.transferXTokenFrom(
            address(this),
            payment.payer,
            address(this),
            payment.amount
        );

        payment.status = PaymentStatus.PAID;

        emit paymentPaid(payment.payer, payment.payee, payment.amount);
    }

    function release(
        uint256 _paymentId
    )
        public
        onlyLeaseMarketplaceOrLeaseDisputeDAO
        PaymentExists(_paymentId)
        PaymentPaid(_paymentId)
    {
        Payment storage payment = payments[_paymentId];

        xTokenContract.transferXToken(
            address(this),
            payment.payee,
            payment.amount
        );

        payment.status = PaymentStatus.RELEASED;

        emit paymentReleased(payment.payer, payment.payee, payment.amount);
    }

    function refund(
        uint256 _paymentId
    )
        public
        onlyLeaseMarketplaceOrLeaseDisputeDAO
        PaymentExists(_paymentId)
        PaymentPaid(_paymentId)
    {
        Payment storage payment = payments[_paymentId];

        xTokenContract.transferXToken(
            address(this),
            payment.payer,
            payment.amount
        );

        payment.status = PaymentStatus.REFUNDED;

        emit paymentRefunded(payment.payer, payment.payee, payment.amount);
    }

    function setProtectionFee(
        uint256 _protectionFee
    ) public onlyOwner invalidProtectionFee(_protectionFee) {
        protectionFee = _protectionFee;
        emit protectionFeeSet(_protectionFee);
    }

    function setVoterReward(
        uint256 _voterReward
    ) public onlyOwner invalidVoterReward(_voterReward) {
        voterReward = _voterReward;
    }

    function setVotePrice(
        uint256 _votePrice
    ) public onlyOwner invalidVotePrice(_votePrice) {
        votePrice = _votePrice;
    }

    function setLeaseMarketplaceAddress(
        address _leaseMarketplaceAddress
    )
        public
        onlyOwner
        invalidLeaseMarketplaceAddress(_leaseMarketplaceAddress)
    {
        leaseMarketplaceAddress = _leaseMarketplaceAddress;
        emit leaseMarketplaceAddressSet(_leaseMarketplaceAddress);
    }

    function setLeaseDisputeDAOAddress(
        address _leaseDisputeDAOAddress
    ) public onlyOwner invalidLeaseDisputeDAOAddress(_leaseDisputeDAOAddress) {
        leaseDisputeDAOAddress = _leaseDisputeDAOAddress;
        emit leaseDisputeDAOAddressSet(_leaseDisputeDAOAddress);
    }

    function updatePayment(
        uint256 _paymentId,
        address _payer,
        address _payee,
        uint256 _amount,
        PaymentStatus _status
    ) public onlyLeaseDisputeDAO {
        payments[_paymentId] = Payment(_payer, _payee, _amount, _status);
    }

    function getProtectionFee() public view returns (uint256) {
        return protectionFee;
    }

    function getVoterReward() public view returns (uint256) {
        return voterReward;
    }

    function getVotePrice() public view returns (uint256) {
        return votePrice;
    }

    function getPayment(
        uint256 _paymentId
    ) public view returns (Payment memory) {
        return payments[_paymentId];
    }

    function getNumOfPayments() public view returns (uint256) {
        return numOfPayments;
    }

    function getBalance() public view returns (uint256) {
        return xTokenContract.checkXToken(address(this));
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    function getContractAddress() public view returns (address) {
        return address(this);
    }

    function getLeaseMarketplaceAddress() public view returns (address) {
        return leaseMarketplaceAddress;
    }

    function getLeaseDisputeDAOAddress() public view returns (address) {
        return leaseDisputeDAOAddress;
    }
}
