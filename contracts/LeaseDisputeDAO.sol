// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./LeaseProperty.sol";
import "./LeaseMarketplace.sol";
import "./PaymentEscrow.sol";

contract LeaseDisputeDAO {
    enum DisputeStatus {
        PENDING,
        APPROVED,
        REJECTED,
        DRAW
    }

    enum DisputeType {
        MAINTENANCE_AND_REPAIRS,
        HEALTH_AND_SAFETY,
        PRIVACY,
        DISCRIMINATION,
        NOISE_COMPLAINTS,
        LEASE_TERMS,
        OTHER
    }

    enum Vote {
        VOID,
        APPROVE,
        REJECT
    }

    struct LeaseDispute {
        uint256 leaseDisputeId;
        uint256 leasePropertyId;
        uint256 applicationId;
        address tenantAddress;
        address landlordAddress;
        uint256 startTime;
        uint256 endTime;
        DisputeStatus status;
        DisputeType disputeType;
        string disputeReason;
    }

    LeaseProperty leasePropertyContract;
    PaymentEscrow paymentEscrowContract;
    LeaseMarketplace leaseMarketplaceContract;

    uint256 private minNumOfVotersInDispute;

    uint256 private numOfDisputes = 0;

    mapping(uint256 => LeaseDispute) private disputes;

    mapping(uint256 => mapping(address => Vote)) private votesForDispute;

    mapping(uint256 => mapping(address => bool)) private tenantDispute;

    mapping(uint256 => address[]) private votersInDispute;

    constructor(
        address _leasePropertyContract,
        address _paymentEscrowContract,
        address _leaseMarketplaceContract,
        uint256 _minNumOfVotersInDispute
    ) {
        leasePropertyContract = LeaseProperty(_leasePropertyContract);
        paymentEscrowContract = PaymentEscrow(_paymentEscrowContract);
        leaseMarketplaceContract = LeaseMarketplace(_leaseMarketplaceContract);
        minNumOfVotersInDispute = _minNumOfVotersInDispute;
    }

    event LeaseDisputeCreated(uint256 disputeId, LeaseDispute leaseDispute);
    event VoteOnLeaseDispute(uint256 disputeId, address voter, Vote vote);
    event LeaseDisputeResolved(uint256 disputeId, LeaseDispute leaseDispute);
    event DisputeApprovalReward(
        uint256 leasePropertyId,
        uint256 applicationId,
        uint256 tenantReward
    );
    event DisputeRejectionReward(
        uint256 leasePropertyId,
        uint256 applicationId,
        uint256 landlordReward
    );
    event DisputeDraw(uint256 leasePropertyId, uint256 applicationId);
    event ReviewersReward(
        uint256 leasePropertyId,
        uint256 applicationId,
        uint256 totalReviewers
    );

    modifier disputePending(uint256 _disputeId) {
        require(
            disputes[_disputeId].status == DisputeStatus.PENDING,
            "Dispute is not pending"
        );
        _;
    }

    modifier disputeApproved(uint256 _disputeId) {
        require(
            disputes[_disputeId].status == DisputeStatus.APPROVED,
            "Dispute is not approved"
        );
        _;
    }

    modifier disputeRejected(uint256 _disputeId) {
        require(
            disputes[_disputeId].status == DisputeStatus.REJECTED,
            "Dispute is not rejected"
        );
        _;
    }

    modifier disputeDraw(uint256 _disputeId) {
        require(
            disputes[_disputeId].status == DisputeStatus.DRAW,
            "Dispute is not draw"
        );
        _;
    }

    modifier disputeResolved(uint256 _disputeId) {
        require(
            disputes[_disputeId].status != DisputeStatus.PENDING,
            "Dispute needs to be approved or rejected or draw"
        );
        _;
    }

    modifier voterNotVoted(uint256 _disputeId, address _voter) {
        require(
            votesForDispute[_disputeId][_voter] == Vote.VOID,
            "Voter has already voted"
        );
        _;
    }

    modifier disputeExist(uint256 _disputeId) {
        require(
            _disputeId > 0 && _disputeId <= numOfDisputes,
            "Invalid dispute Id"
        );
        _;
    }

    modifier tenantDisputed(uint256 _leasePropertyId, address _tenant) {
        require(
            tenantDispute[_leasePropertyId][_tenant],
            "Tenant has not made a dispute for this lease property"
        );
        _;
    }

    function createLeaseDispute(
        uint256 _leasePropertyId,
        uint256 _applicationId,
        DisputeType _disputeType,
        string memory _disputeReason
    ) public {
        LeaseMarketplace.LeaseApplication
            memory leaseApplication = leaseMarketplaceContract
                .getLeaseApplication(_leasePropertyId, _applicationId);

        if (
            !leaseMarketplaceContract.getTenantDisputeStatus(
                _leasePropertyId,
                _applicationId
            )
        ) {
            tenantDispute[_leasePropertyId][msg.sender] = false;
        }

        require(
            leaseApplication.leasePropertyId == _leasePropertyId,
            "Invalid lease property"
        );

        require(
            leaseApplication.applicationId == _applicationId,
            "Invalid lease application"
        );

        require(
            leaseApplication.status == LeaseMarketplace.LeaseStatus.COMPLETED,
            "Dispute can only be created by tenant after lease application is completed"
        );

        require(
            leaseApplication.tenantAddress == msg.sender,
            "Only tenant from this property can create a dispute"
        );

        require(
            !tenantDispute[_leasePropertyId][msg.sender],
            "Tenant has already made a dispute for this lease property"
        );

        transferPayment(
            msg.sender,
            address(paymentEscrowContract),
            paymentEscrowContract.getVoterReward()
        );

        numOfDisputes++;

        LeaseDispute memory leaseDispute = LeaseDispute({
            leaseDisputeId: numOfDisputes,
            leasePropertyId: _leasePropertyId,
            applicationId: _applicationId,
            tenantAddress: leaseApplication.tenantAddress,
            landlordAddress: leaseApplication.landlordAddress,
            startTime: block.timestamp,
            endTime: block.timestamp + 7 days,
            status: DisputeStatus.PENDING,
            disputeType: _disputeType,
            disputeReason: _disputeReason
        });

        disputes[numOfDisputes] = leaseDispute;

        tenantDispute[_leasePropertyId][msg.sender] = true;

        leaseMarketplaceContract.updateLeaseApplicationStatus(
            _leasePropertyId,
            _applicationId,
            LeaseMarketplace.LeaseStatus.DISPUTE
        );

        emit LeaseDisputeCreated(numOfDisputes, leaseDispute);
    }

    function voteOnLeaseDispute(
        uint256 _disputeId,
        Vote _vote
    )
        public
        disputeExist(_disputeId)
        disputePending(_disputeId)
        voterNotVoted(_disputeId, msg.sender)
    {
        LeaseMarketplace.LeaseApplication
            memory leaseApplication = leaseMarketplaceContract
                .getLeaseApplication(
                    disputes[_disputeId].leasePropertyId,
                    disputes[_disputeId].applicationId
                );

        require(
            leaseApplication.landlordAddress != msg.sender &&
                leaseApplication.tenantAddress != msg.sender,
            "Landlord and Tenants are not authorized to vote"
        );

        if (block.timestamp > disputes[_disputeId].endTime) {
            resolveLeaseDispute(_disputeId);
            return;
        }

        transferPayment(
            msg.sender,
            address(paymentEscrowContract),
            paymentEscrowContract.getVotePrice()
        );

        votesForDispute[_disputeId][msg.sender] = _vote;

        votersInDispute[_disputeId].push(msg.sender);

        emit VoteOnLeaseDispute(_disputeId, msg.sender, _vote);

        if (votersInDispute[_disputeId].length >= minNumOfVotersInDispute) {
            resolveLeaseDispute(_disputeId);
        }
    }

    function triggerResolveLeaseDispute(
        uint256 _disputeId
    ) public disputeExist(_disputeId) disputePending(_disputeId) {
        resolveLeaseDispute(_disputeId);
    }

    function resetTenantDispute(
        uint256 _leasePropertyId,
        address _tenant
    ) public tenantDisputed(_leasePropertyId, _tenant) {
        tenantDispute[_leasePropertyId][_tenant] = false;
    }

    function resolveLeaseDispute(
        uint256 _disputeId
    ) private disputeExist(_disputeId) disputePending(_disputeId) {
        uint256 approveCount = 0;
        uint256 rejectCount = 0;

        for (uint256 i = 0; i < votersInDispute[_disputeId].length; i++) {
            if (
                votesForDispute[_disputeId][votersInDispute[_disputeId][i]] ==
                Vote.APPROVE
            ) {
                approveCount++;
            } else if (
                votesForDispute[_disputeId][votersInDispute[_disputeId][i]] ==
                Vote.REJECT
            ) {
                rejectCount++;
            }
        }

        if (approveCount > rejectCount) {
            disputes[_disputeId].status = DisputeStatus.APPROVED;
            handleDisputeApprovalReward(_disputeId);
        } else if (rejectCount > approveCount) {
            disputes[_disputeId].status = DisputeStatus.REJECTED;
            handleDisputeRejectionReward(_disputeId);
        } else {
            disputes[_disputeId].status = DisputeStatus.DRAW;
            handleDisputeDraw(_disputeId);
        }

        handleReviewersReward(_disputeId);

        for (uint256 i = 0; i < votersInDispute[_disputeId].length; i++) {
            votesForDispute[_disputeId][votersInDispute[_disputeId][i]] = Vote
                .VOID;
        }

        delete votersInDispute[_disputeId];

        leaseMarketplaceContract.updateTenantHasDisputed(
            disputes[_disputeId].leasePropertyId,
            disputes[_disputeId].applicationId,
            true
        );

        leaseMarketplaceContract.updateLeaseApplicationStatus(
            disputes[_disputeId].leasePropertyId,
            disputes[_disputeId].applicationId,
            LeaseMarketplace.LeaseStatus.COMPLETED
        );

        emit LeaseDisputeResolved(_disputeId, disputes[_disputeId]);
    }

    function handleDisputeApprovalReward(
        uint256 _disputeId
    ) private disputeExist(_disputeId) disputeApproved(_disputeId) {
        LeaseDispute memory leaseDispute = disputes[_disputeId];

        LeaseMarketplace.LeaseApplication
            memory leaseApplication = leaseMarketplaceContract
                .getLeaseApplication(
                    leaseDispute.leasePropertyId,
                    leaseDispute.applicationId
                );

        uint256 totalTenants = leasePropertyContract.getNumOfTenants(
            leaseDispute.leasePropertyId
        );

        uint256 protectionFee = paymentEscrowContract.getProtectionFee();

        uint256 tenantReward = protectionFee / totalTenants;

        uint256 paymentId = leasePropertyContract.getPaymentId(
            leaseDispute.leasePropertyId
        );

        PaymentEscrow.Payment memory payment = paymentEscrowContract.getPayment(
            paymentId
        );

        paymentEscrowContract.updatePayment(
            paymentId,
            payment.payer,
            payment.payee,
            payment.amount - tenantReward,
            payment.status
        );

        transferPayment(
            address(paymentEscrowContract),
            leaseApplication.tenantAddress,
            tenantReward
        );

        emit DisputeApprovalReward(
            leaseDispute.leasePropertyId,
            leaseDispute.applicationId,
            tenantReward
        );
    }

    function handleDisputeRejectionReward(
        uint256 _disputeId
    ) private disputeExist(_disputeId) disputeRejected(_disputeId) {
        LeaseDispute memory leaseDispute = disputes[_disputeId];

        uint256 depositFee = leaseMarketplaceContract.getDepositAmount(
            leaseDispute.leasePropertyId
        );

        uint256 newDepositFeeBalance = uint256(depositFee / 2);

        leaseMarketplaceContract.updateDepositFeeBalance(
            leaseDispute.leasePropertyId,
            newDepositFeeBalance
        );

        emit DisputeRejectionReward(
            leaseDispute.leasePropertyId,
            leaseDispute.applicationId,
            newDepositFeeBalance
        );
    }

    function handleDisputeDraw(
        uint256 _disputeId
    ) private disputeExist(_disputeId) disputeDraw(_disputeId) {
        LeaseDispute memory leaseDispute = disputes[_disputeId];

        transferPayment(
            address(paymentEscrowContract),
            leaseDispute.tenantAddress,
            paymentEscrowContract.getVoterReward()
        );

        emit DisputeDraw(
            leaseDispute.leasePropertyId,
            leaseDispute.applicationId
        );
    }

    function handleReviewersReward(
        uint256 _disputeId
    ) private disputeExist(_disputeId) disputeResolved(_disputeId) {
        LeaseDispute memory leaseDispute = disputes[_disputeId];

        uint256 totalReviewers = votersInDispute[_disputeId].length;

        uint256 totalVotePrice = paymentEscrowContract.getVotePrice() *
            totalReviewers;

        if (leaseDispute.status == DisputeStatus.APPROVED) {
            uint256 totalCorrectVotes = 0;
            for (uint256 i = 0; i < totalReviewers; i++) {
                if (
                    votesForDispute[_disputeId][
                        votersInDispute[_disputeId][i]
                    ] == Vote.APPROVE
                ) {
                    totalCorrectVotes++;
                }
            }

            uint256 totalRewards = paymentEscrowContract.getVoterReward() +
                totalVotePrice;

            uint256 rewardPerCorrectVote = totalRewards / totalCorrectVotes;

            for (uint256 i = 0; i < totalReviewers; i++) {
                if (
                    votesForDispute[_disputeId][
                        votersInDispute[_disputeId][i]
                    ] == Vote.APPROVE
                ) {
                    transferPayment(
                        address(paymentEscrowContract),
                        votersInDispute[_disputeId][i],
                        rewardPerCorrectVote
                    );
                }
            }
        } else if (leaseDispute.status == DisputeStatus.REJECTED) {
            uint256 totalCorrectVotes = 0;
            for (uint256 i = 0; i < totalReviewers; i++) {
                if (
                    votesForDispute[_disputeId][
                        votersInDispute[_disputeId][i]
                    ] == Vote.REJECT
                ) {
                    totalCorrectVotes++;
                }
            }

            uint256 totalRewards = paymentEscrowContract.getVoterReward() +
                totalVotePrice;

            uint256 rewardPerCorrectVote = totalRewards / totalCorrectVotes;

            for (uint256 i = 0; i < totalReviewers; i++) {
                if (
                    votesForDispute[_disputeId][
                        votersInDispute[_disputeId][i]
                    ] == Vote.REJECT
                ) {
                    transferPayment(
                        address(paymentEscrowContract),
                        votersInDispute[_disputeId][i],
                        rewardPerCorrectVote
                    );
                }
            }
        } else if (leaseDispute.status == DisputeStatus.DRAW) {
            for (uint256 i = 0; i < totalReviewers; i++) {
                transferPayment(
                    address(paymentEscrowContract),
                    votersInDispute[_disputeId][i],
                    paymentEscrowContract.getVotePrice()
                );
            }
        }

        emit ReviewersReward(
            leaseDispute.leasePropertyId,
            leaseDispute.applicationId,
            totalReviewers
        );
    }

    function transferPayment(
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

        paymentEscrowContract.release(paymentId);

        return paymentId;
    }

    function getLeaseDispute(
        uint256 _disputeId
    ) public view returns (LeaseDispute memory) {
        return disputes[_disputeId];
    }

    function getNumOfDisputes() public view returns (uint256) {
        return numOfDisputes;
    }

    function getNumOfDisputesByLandlord(
        address _landlordAddress
    ) public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i <= numOfDisputes; i++) {
            if (disputes[i].landlordAddress == _landlordAddress) {
                count++;
            }
        }
        return count;
    }

    function getNumOfDisputesByTenant(
        address _tenantAddress
    ) public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i <= numOfDisputes; i++) {
            if (disputes[i].tenantAddress == _tenantAddress) {
                count++;
            }
        }
        return count;
    }

    function getAllDisputes() public view returns (LeaseDispute[] memory) {
        LeaseDispute[] memory allDisputes = new LeaseDispute[](numOfDisputes);
        for (uint256 i = 1; i <= numOfDisputes; i++) {
            allDisputes[i - 1] = disputes[i];
        }
        return allDisputes;
    }

    function getDisputesByLandlord(
        address _landlordAddress
    ) public view returns (LeaseDispute[] memory) {
        uint256 numOfLandlordDisputes = getNumOfDisputesByLandlord(
            _landlordAddress
        );
        LeaseDispute[] memory landlordDisputes = new LeaseDispute[](
            numOfLandlordDisputes
        );
        uint256 count = 0;
        for (uint256 i = 1; i <= numOfDisputes; i++) {
            if (disputes[i].landlordAddress == _landlordAddress) {
                landlordDisputes[count] = disputes[i];
                count++;
            }
        }
        return landlordDisputes;
    }

    function getDisputesByTenant(
        address _tenantAddress
    ) public view returns (LeaseDispute[] memory) {
        uint256 numOfTenantDisputes = getNumOfDisputesByTenant(_tenantAddress);
        LeaseDispute[] memory tenantDisputes = new LeaseDispute[](
            numOfTenantDisputes
        );
        uint256 count = 0;
        for (uint256 i = 1; i <= numOfDisputes; i++) {
            if (disputes[i].tenantAddress == _tenantAddress) {
                tenantDisputes[count] = disputes[i];
                count++;
            }
        }
        return tenantDisputes;
    }

    function getNumVotersInDispute(
        uint256 _disputeId
    ) public view returns (uint256) {
        return votersInDispute[_disputeId].length;
    }
}
