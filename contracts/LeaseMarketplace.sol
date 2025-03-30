// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./LeaseProperty.sol";
import "./PaymentEscrow.sol";
import "./LeaseDisputeDAO.sol";

contract LeaseMarketplace {
    enum LeaseStatus {
        PENDING,
        ONGOING,
        MADE_PAYMENT,
        COMPLETED,
        DISPUTE
    }

    struct LeaseApplication {
        uint256 leasePropertyId;
        uint256 applicationId;
        address landlordAddress;
        address tenantAddress;
        string tenantName;
        string tenantEmail;
        string tenantPhone;
        string description;
        uint256 monthsPaid;
        LeaseStatus status;
        uint256[] paymentIds;
        bool tenantHasDisputed;
    }

    LeaseProperty leasePropertyContract;
    PaymentEscrow paymentEscrowContract;

    mapping(uint256 => uint256) private leasePropertyDeposits;

    mapping(uint256 => mapping(uint256 => LeaseApplication))
        private leaseApplications;

    mapping(uint256 => uint256) private leaseApplicationCounts;

    mapping(address => bool) private hasApplied;

    address private owner;

    address private leaseDisputeDAOAddress;

    constructor(address leasePropertyAddress, address paymentEscrowAddress) {
        leasePropertyContract = LeaseProperty(leasePropertyAddress);
        paymentEscrowContract = PaymentEscrow(paymentEscrowAddress);
        owner = msg.sender;
    }

    event LeasePropertyListed(uint256 leasePropertyId, uint256 depositFee);
    event LeasePropertyUnlisted(uint256 leasePropertyId);
    event LeaseApplicationSubmitted(
        uint256 leasePropertyId,
        uint256 applicationId
    );
    event LeaseApplicationCancelOrRejected(
        uint256 leasePropertyId,
        uint256 applicationId
    );
    event LeaseApplicationAccepted(
        uint256 leasePropertyId,
        uint256 applicationId
    );

    event PaymentMade(uint256 leasePropertyId, uint256 applicationId);
    event PaymentAccepted(uint256 leasePropertyId, uint256 applicationId);
    event tenantMoveOut(uint256 leasePropertyId, uint256 applicationId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    modifier onlyLeaseDisputeDAO() {
        require(
            msg.sender == leaseDisputeDAOAddress,
            "Only LeaseDisputeDAO can call this function"
        );
        _;
    }

    modifier landlordOnly(uint256 leasePropertyId) {
        require(
            msg.sender == leasePropertyContract.getLandlord(leasePropertyId),
            "Only landlord can perform this action"
        );
        _;
    }

    modifier leasePropertyListed(uint256 leasePropertyId) {
        require(
            leasePropertyContract.getListedStatus(leasePropertyId) == true,
            "Lease property is not listed"
        );
        _;
    }

    modifier leasePropertyNotListed(uint256 leasePropertyId) {
        require(
            leasePropertyContract.getListedStatus(leasePropertyId) == false,
            "Lease property is already listed"
        );
        _;
    }

    modifier leaseApplicationExist(
        uint256 leasePropertyId,
        uint256 applicationId
    ) {
        require(
            leaseApplications[leasePropertyId][applicationId].tenantAddress !=
                address(0),
            "Lease application does not exist"
        );
        _;
    }

    modifier leaseApplicationPending(
        uint256 leasePropertyId,
        uint256 applicationId
    ) {
        require(
            leaseApplications[leasePropertyId][applicationId].status ==
                LeaseStatus.PENDING,
            "Lease application is not pending"
        );
        _;
    }

    modifier leaseApplicationOngoing(
        uint256 leasePropertyId,
        uint256 applicationId
    ) {
        require(
            leaseApplications[leasePropertyId][applicationId].status ==
                LeaseStatus.ONGOING,
            "Lease application is not ongoing"
        );
        _;
    }

    modifier leaseApplicationMadePayment(
        uint256 leasePropertyId,
        uint256 applicationId
    ) {
        require(
            leaseApplications[leasePropertyId][applicationId].status ==
                LeaseStatus.MADE_PAYMENT,
            "Tenant has not made payment"
        );
        _;
    }

    modifier leaseApplicationCompleted(
        uint256 leasePropertyId,
        uint256 applicationId
    ) {
        require(
            leaseApplications[leasePropertyId][applicationId].status ==
                LeaseStatus.COMPLETED,
            "Lease application is not completed"
        );
        _;
    }

    modifier leasePropertyVacant(uint256 leasePropertyId) {
        require(
            leaseApplicationCounts[leasePropertyId] == 0,
            "Lease property is not vacant"
        );
        _;
    }

    modifier leasePropertyNotFull(uint256 leasePropertyId) {
        require(
            leaseApplicationCounts[leasePropertyId] <
                leasePropertyContract.getNumOfTenants(leasePropertyId),
            "Lease property is full"
        );
        _;
    }

    modifier depositFeeGreaterThanZero(uint256 depositFee) {
        require(depositFee > 0, "Deposit LeaseToken must be greater than 0");
        _;
    }

    function listALeaseProperty(
        uint256 leasePropertyId,
        uint256 depositFee
    )
        public
        leasePropertyNotListed(leasePropertyId)
        depositFeeGreaterThanZero(depositFee)
        landlordOnly(leasePropertyId)
    {
        uint256 protectionFee = paymentEscrowContract.getProtectionFee();

        uint256 paymentId = createPaymentTransaction(
            msg.sender,
            address(paymentEscrowContract),
            protectionFee
        );

        leasePropertyContract.setPaymentId(leasePropertyId, paymentId);

        leasePropertyDeposits[leasePropertyId] = depositFee;

        leasePropertyContract.setListedStatus(leasePropertyId, true);

        leasePropertyContract.incrementListedLeaseProperty();

        emit LeasePropertyListed(leasePropertyId, depositFee);
    }

    function unlistALeaseProperty(
        uint256 leasePropertyId
    )
        public
        leasePropertyListed(leasePropertyId)
        landlordOnly(leasePropertyId)
        leasePropertyVacant(leasePropertyId)
    {
        paymentEscrowContract.refund(
            leasePropertyContract.getPaymentId(leasePropertyId)
        );

        leasePropertyDeposits[leasePropertyId] = 0;

        leasePropertyContract.setPaymentId(leasePropertyId, 0);

        leasePropertyContract.setListedStatus(leasePropertyId, false);

        leasePropertyContract.decrementListedLeaseProperty();

        emit LeasePropertyUnlisted(leasePropertyId);
    }

    function applyLeaseProperty(
        uint256 leasePropertyId,
        string memory tenantName,
        string memory tenantEmail,
        string memory tenantPhone,
        string memory description
    )
        public
        leasePropertyListed(leasePropertyId)
        leasePropertyNotFull(leasePropertyId)
    {
        require(
            msg.sender != leasePropertyContract.getLandlord(leasePropertyId),
            "Landlord cannot apply for own lease property"
        );

        require(
            !hasApplied[msg.sender],
            "Tenant has already applied for a lease property"
        );

        uint256 applicationId = leaseApplicationCounts[leasePropertyId];

        leaseApplications[leasePropertyId][applicationId] = LeaseApplication(
            leasePropertyId,
            leaseApplicationCounts[leasePropertyId],
            leasePropertyContract.getLandlord(leasePropertyId),
            msg.sender,
            tenantName,
            tenantEmail,
            tenantPhone,
            description,
            0,
            LeaseStatus.PENDING,
            new uint256[](0),
            false
        );

        uint256 depositFee = leasePropertyDeposits[leasePropertyId];

        uint256 paymentId = createPaymentTransaction(
            msg.sender,
            leasePropertyContract.getLandlord(leasePropertyId),
            depositFee
        );

        leaseApplications[leasePropertyId][applicationId].paymentIds.push(
            paymentId
        );

        leaseApplicationCounts[leasePropertyId]++;

        hasApplied[msg.sender] = true;

        leasePropertyContract.setUpdateStatus(leasePropertyId, false);

        emit LeaseApplicationSubmitted(leasePropertyId, applicationId);
    }

    function cancelOrRejectLeaseApplication(
        uint256 leasePropertyId,
        uint256 applicationId
    )
        public
        leaseApplicationExist(leasePropertyId, applicationId)
        leaseApplicationPending(leasePropertyId, applicationId)
    {
        paymentEscrowContract.refund(
            leaseApplications[leasePropertyId][applicationId].paymentIds[0]
        );

        removeApplication(leasePropertyId, applicationId);

        emit LeaseApplicationCancelOrRejected(leasePropertyId, applicationId);
    }

    function acceptLeaseApplication(
        uint256 leasePropertyId,
        uint256 applicationId
    )
        public
        landlordOnly(leasePropertyId)
        leaseApplicationExist(leasePropertyId, applicationId)
        leaseApplicationPending(leasePropertyId, applicationId)
    {
        LeaseApplication storage leaseApplication = leaseApplications[
            leasePropertyId
        ][applicationId];

        paymentEscrowContract.release(leaseApplication.paymentIds[0]);

        leaseApplication.status = LeaseStatus.ONGOING;

        emit LeaseApplicationAccepted(leasePropertyId, applicationId);
    }

    function makePayment(
        uint256 leasePropertyId,
        uint256 applicationId
    )
        public
        leasePropertyListed(leasePropertyId)
        leaseApplicationExist(leasePropertyId, applicationId)
        leaseApplicationOngoing(leasePropertyId, applicationId)
    {
        require(
            msg.sender != leasePropertyContract.getLandlord(leasePropertyId),
            "Landlord cannot make payment for own lease property"
        );

        require(
            hasApplied[msg.sender],
            "Tenant has not applied for this lease property"
        );

        LeaseApplication storage leaseApplication = leaseApplications[
            leasePropertyId
        ][applicationId];

        uint256 monthlyLease = leasePropertyContract.getLeasePrice(
            leasePropertyId
        );

        uint256 paymentId = createPaymentTransaction(
            msg.sender,
            leasePropertyContract.getLandlord(leasePropertyId),
            monthlyLease
        );

        leaseApplications[leasePropertyId][applicationId].paymentIds.push(
            paymentId
        );

        leaseApplication.status = LeaseStatus.MADE_PAYMENT;

        emit PaymentMade(leasePropertyId, applicationId);
    }

    function acceptPayment(
        uint256 leasePropertyId,
        uint256 applicationId
    )
        public
        leasePropertyListed(leasePropertyId)
        landlordOnly(leasePropertyId)
        leaseApplicationExist(leasePropertyId, applicationId)
        leaseApplicationMadePayment(leasePropertyId, applicationId)
    {
        LeaseApplication storage leaseApplication = leaseApplications[
            leasePropertyId
        ][applicationId];

        paymentEscrowContract.release(
            leaseApplication.paymentIds[leaseApplication.paymentIds.length - 1]
        );

        leaseApplication.monthsPaid++;

        if (
            leaseApplication.monthsPaid ==
            leasePropertyContract.getLeaseDuration(leasePropertyId)
        ) {
            leaseApplication.status = LeaseStatus.COMPLETED;
        } else {
            leaseApplication.status = LeaseStatus.ONGOING;
        }

        emit PaymentAccepted(leasePropertyId, applicationId);
    }

    function moveOut(
        uint256 leasePropertyId,
        uint256 applicationId
    )
        public
        leasePropertyListed(leasePropertyId)
        leaseApplicationExist(leasePropertyId, applicationId)
        leaseApplicationCompleted(leasePropertyId, applicationId)
    {
        require(
            msg.sender != leasePropertyContract.getLandlord(leasePropertyId),
            "Landlord cannot move out of own lease property"
        );

        require(
            hasApplied[msg.sender],
            "Tenant has not applied for this lease property"
        );

        uint256 depositFee = leasePropertyDeposits[leasePropertyId];

        uint256 paymentId = createPaymentTransaction(
            leasePropertyContract.getLandlord(leasePropertyId),
            msg.sender,
            depositFee
        );

        paymentEscrowContract.release(paymentId);

        leaseApplications[leasePropertyId][applicationId].paymentIds.push(
            paymentId
        );

        removeApplication(leasePropertyId, applicationId);

        emit tenantMoveOut(leasePropertyId, applicationId);
    }

    function removeApplication(
        uint256 leasePropertyId,
        uint256 applicationId
    )
        private
        leasePropertyListed(leasePropertyId)
        leaseApplicationExist(leasePropertyId, applicationId)
    {
        leaseApplicationCounts[leasePropertyId]--;

        hasApplied[
            leaseApplications[leasePropertyId][applicationId].tenantAddress
        ] = false;

        delete leaseApplications[leasePropertyId][applicationId];

        if (leaseApplicationCounts[leasePropertyId] == 0) {
            leasePropertyContract.setUpdateStatus(leasePropertyId, true);
        }
    }

    function createPaymentTransaction(
        address from,
        address to,
        uint256 amount
    ) private returns (uint256) {
        uint256 paymentId = paymentEscrowContract.createPayment(
            from,
            to,
            amount
        );

        paymentEscrowContract.pay(paymentId);

        return paymentId;
    }

    function setLeaseDisputeDAOAddress(
        address _leaseDisputeDAOAddress
    ) public onlyOwner {
        leaseDisputeDAOAddress = _leaseDisputeDAOAddress;
    }

    function updateDepositFeeBalance(
        uint256 leasePropertyId,
        uint256 newDepositFee
    )
        public
        leasePropertyListed(leasePropertyId)
        depositFeeGreaterThanZero(newDepositFee)
        onlyLeaseDisputeDAO
    {
        leasePropertyDeposits[leasePropertyId] = newDepositFee;
    }

    function updateLeaseApplicationStatus(
        uint256 leasePropertyId,
        uint256 applicationId,
        LeaseStatus newStatus
    )
        public
        leasePropertyListed(leasePropertyId)
        leaseApplicationExist(leasePropertyId, applicationId)
        onlyLeaseDisputeDAO
    {
        leaseApplications[leasePropertyId][applicationId].status = newStatus;
    }

    function updateTenantHasDisputed(
        uint256 leasePropertyId,
        uint256 applicationId,
        bool hasDisputed
    )
        public
        leasePropertyListed(leasePropertyId)
        leaseApplicationExist(leasePropertyId, applicationId)
        onlyLeaseDisputeDAO
    {
        leaseApplications[leasePropertyId][applicationId]
            .tenantHasDisputed = hasDisputed;
    }

    function getLeaseApplication(
        uint256 leasePropertyId,
        uint256 applicationId
    ) public view returns (LeaseApplication memory) {
        return leaseApplications[leasePropertyId][applicationId];
    }

    function getLeaseApplicationCount(
        uint256 leasePropertyId
    ) public view returns (uint256) {
        return leaseApplicationCounts[leasePropertyId];
    }

    function getHasApplied(address tenantAddress) public view returns (bool) {
        return hasApplied[tenantAddress];
    }

    function getAllLeaseApplicationsFromLeaseProperty(
        uint256 leasePropertyId
    ) public view returns (LeaseApplication[] memory) {
        LeaseApplication[] memory leaseApplicationList = new LeaseApplication[](
            leaseApplicationCounts[leasePropertyId]
        );
        for (uint256 i = 0; i < leaseApplicationCounts[leasePropertyId]; i++) {
            leaseApplicationList[i] = leaseApplications[leasePropertyId][i];
        }
        return leaseApplicationList;
    }

    function getLeaseApplicationByTenant(
        address tenantAddress
    ) public view returns (LeaseApplication memory) {
        for (
            uint256 i = 0;
            i < leasePropertyContract.getNumLeaseProperty();
            i++
        ) {
            for (uint256 j = 0; j < leaseApplicationCounts[i]; j++) {
                if (leaseApplications[i][j].tenantAddress == tenantAddress) {
                    return leaseApplications[i][j];
                }
            }
        }
        return
            LeaseApplication(
                0,
                0,
                address(0),
                address(0),
                "",
                "",
                "",
                "",
                0,
                LeaseStatus.PENDING,
                new uint256[](0),
                false
            );
    }

    function getDepositAmount(
        uint256 leasePropertyId
    ) public view returns (uint256) {
        return leasePropertyDeposits[leasePropertyId];
    }

    function getTenantDisputeStatus(
        uint256 leasePropertyId,
        uint256 applicationId
    ) public view returns (bool) {
        return
            leaseApplications[leasePropertyId][applicationId].tenantHasDisputed;
    }
}
