// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./RentalProperty.sol";
import "./RentalMarketplace.sol";
import "./PaymentEscrow.sol";

/*
Dispute Resolution Process:
----------------------------------------- Tenant Process ----------------------------------------------------------------------
1. Tenant can create a rent dispute for a rental property after the rental application is completed (i.e. status is COMPLETED)
2. Tenant can only create a dispute for a rental property once
3. Tenant needs to stake the voter rewards (specified by PaymentEscorw) for the dispute for the winning reviewers
4. PaymentEscrow will hold the voter reward until the dispute is resolved
----------------------------------------- Validator Process ----------------------------------------------------------------------
5. Voters like Real Estate Validators can vote on a rent dispute (i.e. approve or reject the dispute)   
6. Voters can only vote once for a particular dispute
7. Voters cannot be the landlord or tenant of the rental property
8. Voters need to stake the vote price (specified by PaymentEscorw) for the dispute
9. PaymentEscrow will hold the vote price until the dispute is resolved
----------------------------------------- Dispute Triggering Process ----------------------------------------------------------------------
10. Dispute can be resolved in two ways:
    - Time-based trigger: If the minimum number of voters in dispute is not reached within the time limit, the dispute will be resolved automatically
    - Vote-based trigger: If the minimum number of voters in dispute is reached within the time limit, the dispute will be resolved automatically
---------------------------------------- Dispute Resolution Process ----------------------------------------------------------------------
11. If the dispute is approved, tenant wins and landlord loses
    - Tenant receives (1 / Total number of tenants in the rental property) * Rental Property Protection Fee as reward
    - Landlord loses (1 / Total number of tenants in the rental property) * Rental Property Protection Fee as penalty
12. If the dispute is rejected, landlord wins and tenant loses
    - Landlord will keep 50% of the Rental Property Deposit Fee (initially paid by tenant as deposit when applying for rental property) as reward
    - Tenant will lose 50% of the Rental Property Deposit Fee as penalty
13. If the dispute is draw, no winner
    - Tenant will receive the voter reward staked earlier back as the dispute is a draw
    - No penalty/reward for the tenant in a draw dispute
    - No penalty/reward for the landlord in a draw dispute
14. Reviewers will receive the voter reward if they vote correctly on the dispute
    - If the dispute is approved or rejected, transfer the reward ((voter reward + total vote price)/total winning reviewers) to the winning reviewers who voted correctly.
    - Losing reviewers will not receive any reward and will lose the vote price.
    - If the dispute is a draw, transfer the votePrice back to the reviewers (no reward for the reviewers in a draw dispute)
*/

contract RentDisputeDAO {
    // ################################################### STRUCTURE & STATE VARIABLES ################################################### //

    enum DisputeStatus {
        PENDING, // Dispute is pending
        APPROVED, // Dispute is approved
        REJECTED, // Dispute is rejected
        DRAW // Dispute is draw
    }

    enum DisputeType {
        MAINTENANCE_AND_REPAIRS, // Dispute for maintenance and repairs
        HEALTH_AND_SAFETY, // Dispute for health and safety
        PRIVACY, // Dispute for privacy
        DISCRIMINATION, // Dispute for discrimination
        NOISE_COMPLAINTS, // Dispute for noise complaints
        LEASE_TERMS, // Dispute for lease terms
        OTHER // Other disputes
    }

    enum Vote {
        VOID, // Voter has not voted
        APPROVE, // Voter has voted to approve (tenant wins)
        REJECT // Voter has voted to reject (landlord wins)
    }

    struct RentDispute {
        uint256 rentDisputeId; // Unique identifier for the dispute
        uint256 rentalPropertyId; // Unique identifier for the rental property
        uint256 applicationId; // Unique identifier for the rental application
        address tenantAddress; // Address of the tenant who created the dispute
        address landlordAddress; // Address of the landlord of the rental property
        uint256 startTime; // Start time of the dispute
        uint256 endTime; // End time of the dispute
        DisputeStatus status; // Status of the dispute (PENDING, APPROVED, REJECTED, DRAW)
        DisputeType disputeType; // Type of the dispute
        string disputeReason; // Reason for the dispute
    }

    RentalProperty rentalPropertyContract; // RentalProperty contract
    PaymentEscrow paymentEscrowContract; // PaymentEscrow contract
    RentalMarketplace rentalMarketplaceContract; // RentalMarketplace contract

    // Minimum number of voters in a dispute
    uint256 private minNumOfVotersInDispute;

    // Track the number of disputes created
    uint256 private numOfDisputes = 0;
    // Track all disputes (disputeId => RentDispute)
    mapping(uint256 => RentDispute) private disputes;
    // Track all votes for a particular dispute (disputeId => address => Vote)
    mapping(uint256 => mapping(address => Vote)) private votesForDispute;
    // Track whether tenant has made a dispute for a particular rentalPropertyId (rentalPropertyId => address => bool)
    mapping(uint256 => mapping(address => bool)) private tenantDispute;
    // Track all voter addresses for a particular dispute (disputeId => address[])
    mapping(uint256 => address[]) private votersInDispute; // disputeId => address[]

    constructor(
        address _rentalPropertyContract,
        address _paymentEscrowContract,
        address _rentalMarketplaceContract,
        uint256 _minNumOfVotersInDispute
    ) {
        rentalPropertyContract = RentalProperty(_rentalPropertyContract);
        paymentEscrowContract = PaymentEscrow(_paymentEscrowContract);
        rentalMarketplaceContract = RentalMarketplace(
            _rentalMarketplaceContract
        );
        minNumOfVotersInDispute = _minNumOfVotersInDispute;
    }

    // ################################################### EVENTS ################################################### //

    event RentDisputeCreated(uint256 disputeId, RentDispute rentDispute);
    event VoteOnRentDispute(uint256 disputeId, address voter, Vote vote);
    event RentDisputeResolved(uint256 disputeId, RentDispute rentDispute);
    event DisputeApprovalReward(
        uint256 rentalPropertyId,
        uint256 applicationId,
        uint256 tenantReward
    );
    event DisputeRejectionReward(
        uint256 rentalPropertyId,
        uint256 applicationId,
        uint256 landlordReward
    );
    event DisputeDraw(uint256 rentalPropertyId, uint256 applicationId);
    event ReviewersReward(
        uint256 rentalPropertyId,
        uint256 applicationId,
        uint256 totalReviewers
    );

    // ################################################### MODIFIERS ################################################### //

    // Dispute status is pending
    modifier disputePending(uint256 _disputeId) {
        require(
            disputes[_disputeId].status == DisputeStatus.PENDING,
            "Dispute is not pending"
        );
        _;
    }

    // Dispute status is approved
    modifier disputeApproved(uint256 _disputeId) {
        require(
            disputes[_disputeId].status == DisputeStatus.APPROVED,
            "Dispute is not approved"
        );
        _;
    }

    // Dispute status is rejected
    modifier disputeRejected(uint256 _disputeId) {
        require(
            disputes[_disputeId].status == DisputeStatus.REJECTED,
            "Dispute is not rejected"
        );
        _;
    }

    // Dispute status is draw
    modifier disputeDraw(uint256 _disputeId) {
        require(
            disputes[_disputeId].status == DisputeStatus.DRAW,
            "Dispute is not draw"
        );
        _;
    }

    // Dispute needs to be approved or rejected or draw
    modifier disputeResolved(uint256 _disputeId) {
        require(
            disputes[_disputeId].status != DisputeStatus.PENDING,
            "Dispute needs to be approved or rejected or draw"
        );
        _;
    }

    // Voter has not voted
    modifier voterNotVoted(uint256 _disputeId, address _voter) {
        require(
            votesForDispute[_disputeId][_voter] == Vote.VOID,
            "Voter has already voted"
        );
        _;
    }

    // Dispute Exists
    modifier disputeExist(uint256 _disputeId) {
        require(
            _disputeId > 0 && _disputeId <= numOfDisputes,
            "Invalid dispute Id"
        );
        _;
    }

    // Tenant has made a dispute for the rental property
    modifier tenantDisputed(uint256 _rentalPropertyId, address _tenant) {
        require(
            tenantDispute[_rentalPropertyId][_tenant],
            "Tenant has not made a dispute for this rental property"
        );
        _;
    }

    // ################################################### FUNCTIONS ################################################### //

    // Tenant can create a rent dispute for a rental property after the rental application is completed (i.e. status is COMPLETED)
    // Tenant can only create a dispute for a rental property once
    // Tenant needs to stake the voter rewards (specified by PaymentEscorw) for the dispute for the winning reviewers
    function createRentDispute(
        uint256 _rentalPropertyId,
        uint256 _applicationId,
        DisputeType _disputeType,
        string memory _disputeReason
    ) public {

        // Get the rental application for the rental property
        RentalMarketplace.RentalApplication
            memory rentalApplication = rentalMarketplaceContract
                .getRentalApplication(_rentalPropertyId, _applicationId);

        // Check if tenant has already made a dispute for the rental property
        // Purpose of this check is because tenant may move out of the rental property and apply for the same rental property again
        // If tenant moves out of the rental property and applies for the same rental property again, tenant can make a dispute again
        // Therefore, need to reset tenantDispute to false for the rental property
        if (!rentalMarketplaceContract.getTenantDisputeStatus(_rentalPropertyId, _applicationId)) {
           // Reset tenantDispute to false for the rental property
            tenantDispute[_rentalPropertyId][msg.sender] = false;
        } 

        // Check if the rental property is valid
        require(
            rentalApplication.rentalPropertyId == _rentalPropertyId,
            "Invalid rental property"
        );
        // Check if the rental application is valid
        require(
            rentalApplication.applicationId == _applicationId,
            "Invalid rental application"
        );
        // Check if the rental application status is COMPLETED
        require(
            rentalApplication.status == RentalMarketplace.RentStatus.COMPLETED,
            "Dispute can only be created by tenant after rental application is completed"
        );
        // Check if the tenant is the tenant from the rental application
        require(
            rentalApplication.tenantAddress == msg.sender,
            "Only tenant from this property can create a dispute"
        );
        // Check if tenant has not made a dispute for the rental property
        require(
            !tenantDispute[_rentalPropertyId][msg.sender],
            "Tenant has already made a dispute for this rental property"
        );

        // Tenant needs to stake the voter rewards (specified by PaymentEscorw) for the dispute for the winning reviewers
        // PaymentEscrow will hold the voter rewards until the dispute is resolved
        // Transfer the reward from tenant to PaymentEscrow
        transferPayment(
            msg.sender,
            address(paymentEscrowContract),
            paymentEscrowContract.getVoterReward()
        );
        // Increment the number of disputes
        numOfDisputes++;
        // Create a new rent dispute
        RentDispute memory rentDispute = RentDispute({
            rentDisputeId: numOfDisputes,
            rentalPropertyId: _rentalPropertyId,
            applicationId: _applicationId,
            tenantAddress: rentalApplication.tenantAddress,
            landlordAddress: rentalApplication.landlordAddress,
            startTime: block.timestamp,
            endTime: block.timestamp + 7 days,
            status: DisputeStatus.PENDING,
            disputeType: _disputeType,
            disputeReason: _disputeReason
        });

        // Add the rent dispute to disputes mapping
        disputes[numOfDisputes] = rentDispute;
        // Set tenantDispute to true for the rental property
        tenantDispute[_rentalPropertyId][msg.sender] = true;
        // Update the rental application status to DISPUTE
        rentalMarketplaceContract.updateRentalApplicationStatus(
            _rentalPropertyId,
            _applicationId,
            RentalMarketplace.RentStatus.DISPUTE
        );

        // Emit RentDisputeCreated event
        emit RentDisputeCreated(numOfDisputes, rentDispute);
    }

    // Voters like Real Estate Validators can vote on a rent dispute (i.e. approve or reject the dispute)
    // Voters can only vote once for a particular dispute
    // Voters cannot be the landlord or tenant of the rental property
    // Voters need to stake the vote price (specified by PaymentEscorw) for the dispute
    // PaymentEscrow will hold the vote price until the dispute is resolved
    // Voters will receive the voter reward if they vote correctly on the dispute
    function voteOnRentDispute(
        uint256 _disputeId,
        Vote _vote
    )
        public
        disputeExist(_disputeId)
        disputePending(_disputeId)
        voterNotVoted(_disputeId, msg.sender)
    {
        // Get the rental application for the rental property
        RentalMarketplace.RentalApplication
            memory rentalApplication = rentalMarketplaceContract
                .getRentalApplication(
                    disputes[_disputeId].rentalPropertyId,
                    disputes[_disputeId].applicationId
                );
        // Landlord and Tenants are not authorized to vote
        require(
            rentalApplication.landlordAddress != msg.sender &&
                rentalApplication.tenantAddress != msg.sender,
            "Landlord and Tenants are not authorized to vote"
        );

        // Check if the dispute has ended, if so, trigger the resolveRentDispute function
        // By default, we should use a time-based trigger to resolve the dispute. However, we can also use a vote-based trigger to resolve the dispute
        // This is first way to resolve the dispute if the minimum number of voters in dispute is not reached within the time limit
        if (block.timestamp > disputes[_disputeId].endTime) {
            resolveRentDispute(_disputeId);
            return;
        }

        // Reviewer needs to stake a vote price (specified by PaymentEscorw)
        // PaymentEscrow will hold the vote price until the dispute is resolved
        // Transfer the reward from tenant to PaymentEscrow
        transferPayment(
            msg.sender,
            address(paymentEscrowContract),
            paymentEscrowContract.getVotePrice()
        );

        // Set the vote for the dispute
        votesForDispute[_disputeId][msg.sender] = _vote;
        // Add the voter to the votersInDispute mapping
        votersInDispute[_disputeId].push(msg.sender);

        // Emit VoteOnRentDispute event
        emit VoteOnRentDispute(_disputeId, msg.sender, _vote);

        // Check if the number of voters in dispute is >= than the minimum number of voters in dispute
        // If so, trigger the resolveRentDispute function
        // By default, we should use a time-based trigger to resolve the dispute. However, we can also use a vote-based trigger to resolve the dispute
        // This is second way to resolve the dispute if the minimum number of voters in dispute is reached within the time limit
        if (votersInDispute[_disputeId].length >= minNumOfVotersInDispute) {
            resolveRentDispute(_disputeId);
        }
    }

    // ################################################### TESTING METHODS ################################################### //

    // Manually trigger the resolveRentDispute function (for testing purposes only)
    function triggerResolveRentDispute(
        uint256 _disputeId
    ) public disputeExist(_disputeId) disputePending(_disputeId) {
        resolveRentDispute(_disputeId);
    }

    // Set tenantDispute to false for the rental property (for testing purposes only)
    function resetTenantDispute(
        uint256 _rentalPropertyId,
        address _tenant
    ) public tenantDisputed(_rentalPropertyId, _tenant) {
        tenantDispute[_rentalPropertyId][_tenant] = false;
    }

    // ################################################### INTERNAL METHODS ################################################### //

    // Resolve the rent dispute
    // Dispute status is approved if the number of approve votes > reject votes (i.e. tenant wins)
    // Dispute status is rejected if the number of reject votes > approve votes (i.e. landlord wins)
    // Dispute status is draw if the number of approve votes = reject votes (i.e. no winner)
    function resolveRentDispute(
        uint256 _disputeId
    ) private disputeExist(_disputeId) disputePending(_disputeId) {
        // Approve count and reject count for the dispute
        uint256 approveCount = 0;
        uint256 rejectCount = 0;

        // Count the number of approve and reject votes for the dispute
        // If the voter has voted to approve the dispute, increment the approve count
        // If the voter has voted to reject the dispute, increment the reject count
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

        // If the number of approve votes > reject votes, the dispute is approved (i.e. tenant wins), run handleDisputeApprovalReward function
        // If the number of reject votes > approve votes, the dispute is rejected (i.e. landlord wins), run handleDisputeRejectionReward function
        // If the number of approve votes = reject votes, the dispute is draw, run handleDisputeDraw function
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

        // Handle reviewers reward for the dispute
        handleReviewersReward(_disputeId);

        // Clear votes for the dispute
        for (uint256 i = 0; i < votersInDispute[_disputeId].length; i++) {
            votesForDispute[_disputeId][votersInDispute[_disputeId][i]] = Vote
                .VOID;
        }

        // Clear voters for the dispute
        delete votersInDispute[_disputeId];
        // Set tenantDispute to false for the rental applied since Tenant can only make a dispute for a rental property once
        rentalMarketplaceContract.updateTenantHasDisputed(disputes[_disputeId].rentalPropertyId, disputes[_disputeId].applicationId, true);
        // Update the rental application status to COMPLETED
        rentalMarketplaceContract.updateRentalApplicationStatus(
            disputes[_disputeId].rentalPropertyId,
            disputes[_disputeId].applicationId,
            RentalMarketplace.RentStatus.COMPLETED
        );

        // Emit RentDisputeResolved event
        emit RentDisputeResolved(_disputeId, disputes[_disputeId]);
    }

    // Handle rewards for tenant if the dispute is approved (i.e. tenant wins)
    // Tenant receives (1 / Total number of tenants in the rental property) * Rental Property Protection Fee as reward
    // Landlord loses (1 / Total number of tenants in the rental property) * Rental Property Protection Fee as penalty
    function handleDisputeApprovalReward(
        uint256 _disputeId
    ) private disputeExist(_disputeId) disputeApproved(_disputeId) {
        // Get the rent dispute
        RentDispute memory rentDispute = disputes[_disputeId];
        // Get the rental application for the rental property
        RentalMarketplace.RentalApplication
            memory rentalApplication = rentalMarketplaceContract
                .getRentalApplication(
                    rentDispute.rentalPropertyId,
                    rentDispute.applicationId
                );

        // Get the total number of tenants in the rental property
        uint256 totalTenants = rentalPropertyContract.getNumOfTenants(
            rentDispute.rentalPropertyId
        );
        // Get the protection fee for the rental property
        uint256 protectionFee = paymentEscrowContract.getProtectionFee();
        // Calculate the tenant reward
        uint256 tenantReward = protectionFee / totalTenants;

        // Get paymentId for protection fee transaction in the rental property
        uint256 paymentId = rentalPropertyContract.getPaymentId(
            rentDispute.rentalPropertyId
        );
        // Get payment from PaymentEscrow for the rental property
        PaymentEscrow.Payment memory payment = paymentEscrowContract.getPayment(
            paymentId
        );
        // Update Protection Fee balance for the rental property in PaymentEscrow
        paymentEscrowContract.updatePayment(
            paymentId, 
            payment.payer, 
            payment.payee, 
            payment.amount - tenantReward, // remaining protection fee balance
            payment.status 
        );

        // Transfer tenantReward from PaymentEscrow to tenant
        transferPayment(
            address(paymentEscrowContract),
            rentalApplication.tenantAddress,
            tenantReward
        );

        // Emit DisputeApprovalReward event
        emit DisputeApprovalReward(
            rentDispute.rentalPropertyId,
            rentDispute.applicationId,
            tenantReward
        );
    }

    // Handle rewards for landlord if the dispute is rejected (i.e. landlord wins)
    // Landlord will keep 50% of the Rental Property Deposit Fee (initially paid by tenant as deposit when applying for rental property) as reward
    // Tenant will lose 50% of the Rental Property Deposit Fee as penalty
    function handleDisputeRejectionReward(
        uint256 _disputeId
    ) private disputeExist(_disputeId) disputeRejected(_disputeId){
        
        // Get the rent dispute
        RentDispute memory rentDispute = disputes[_disputeId];

        // Get the initial Deposit Fee paid by tenant for the rental property
        uint256 depositFee = rentalMarketplaceContract.getDepositAmount(
            rentDispute.rentalPropertyId
        );
        // Get the new Deposit Fee balance for the rental property (50% of the initial Deposit Fee)
        uint256 newDepositFeeBalance = uint256(depositFee / 2);
        // Update new Deposit Fee balance for the rental property in RentalMarketplace
        rentalMarketplaceContract.updateDepositFeeBalance(
            rentDispute.rentalPropertyId,
            newDepositFeeBalance
        );
        
        // Emit DisputeRejectionReward event
        emit DisputeRejectionReward(
            rentDispute.rentalPropertyId,
            rentDispute.applicationId,
            newDepositFeeBalance
        );
    }

    // Handle event where the dispute is draw
    // Tenant will receive the voter reward staked earlier back as the dispute is a draw
    // No penalty/reward for the tenant in a draw dispute
    // No penalty/reward for the landlord in a draw dispute
    function handleDisputeDraw(
        uint256 _disputeId
    ) private disputeExist(_disputeId) disputeDraw(_disputeId) {
        // Get the rent dispute
        RentDispute memory rentDispute = disputes[_disputeId];

        // Transfer the votePrice back to the tenant
        // Tenant will receive the voter reward staked earlier back as the dispute is a draw
        transferPayment(
            address(paymentEscrowContract),
            rentDispute.tenantAddress,
            paymentEscrowContract.getVoterReward()
        );

        // Transfer the votePrice back to the reviewers
        emit DisputeDraw(
            rentDispute.rentalPropertyId,
            rentDispute.applicationId
        );
    }

    // Handle reviewer's reward for voters who voted correctly on the dispute (i.e. winning reviewers)
    // If the dispute is approved or rejected, transfer the reward ((voter reward + total vote price)/total winning reviewers) to the winning reviewers who voted correctly.
    // Losing reviewers will not receive any reward and will lose the vote price.
    // If the dispute is a draw, transfer the votePrice back to the reviewers (no reward for the reviewers in a draw dispute)
    function handleReviewersReward(
        uint256 _disputeId
    ) private disputeExist(_disputeId) disputeResolved(_disputeId) {
        // Get the rent dispute
        RentDispute memory rentDispute = disputes[_disputeId];

        // Get the total number of reviewers in the dispute
        uint256 totalReviewers = votersInDispute[_disputeId].length;

        // Get the total vote price for the dispute
        // Total vote price will be distributed among the winning reviewers
        // Total vote price will be refunded to the reviewers if the dispute is a draw
        uint256 totalVotePrice = paymentEscrowContract.getVotePrice() *
            totalReviewers;

        // If the dispute is approved, transfer the reward to the reviewers who voted correctly
        if (rentDispute.status == DisputeStatus.APPROVED) {
            // Count the number of reviewers who voted correctly
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
            // Total rewards for the reviewers will be the sum of the voter reward and the total vote price
            uint256 totalRewards = paymentEscrowContract.getVoterReward() +
                totalVotePrice;
            // Total rewards will be distributed among the reviewers who voted correctly
            uint256 rewardPerCorrectVote = totalRewards / totalCorrectVotes;
            // Transfer the reward to the reviewers who voted correctly
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
        }
        // If the dispute is rejected, transfer the reward to the reviewers who voted correctly
        else if (rentDispute.status == DisputeStatus.REJECTED) {
            // Count the number of reviewers who voted correctly
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
            // Total rewards for the reviewers will be the sum of the voter reward and the total vote price
            uint256 totalRewards = paymentEscrowContract.getVoterReward() +
                totalVotePrice;
            // Total rewards will be distributed among the reviewers who voted correctly
            uint256 rewardPerCorrectVote = totalRewards / totalCorrectVotes;
            // Transfer the reward to the reviewers who voted correctly
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
        }
        // If the dispute is a draw, transfer the votePrice back to the reviewers (no reward for the reviewers in a draw dispute)
        else if (rentDispute.status == DisputeStatus.DRAW) {
            // Transfer the votePrice back to the reviewers
            for (uint256 i = 0; i < totalReviewers; i++) {
                transferPayment(
                    address(paymentEscrowContract),
                    votersInDispute[_disputeId][i],
                    paymentEscrowContract.getVotePrice()
                );
            }
        }

        // Emit ReviewersReward event
        emit ReviewersReward(
            rentDispute.rentalPropertyId,
            rentDispute.applicationId,
            totalReviewers
        );
    }

    // Create a payment transaction between two parties (from and to) for a particular amount (specified by PaymentEscrow contract)
    function transferPayment(
        address from,
        address to,
        uint256 amount
    ) private returns (uint256) {
        // Create a payment transaction between two parties
        uint256 paymentId = paymentEscrowContract.createPayment(
            from,
            to,
            amount
        );
        // Pay the payment transaction
        paymentEscrowContract.pay(paymentId);
        // Release the payment transaction
        paymentEscrowContract.release(paymentId);
        // Return the paymentId
        return paymentId;
    }

    // ################################################### GETTER METHODS ################################################### //

    // Get rent dispute details
    function getRentDispute(
        uint256 _disputeId
    ) public view returns (RentDispute memory) {
        return disputes[_disputeId];
    }

    // Get number of disputes
    function getNumOfDisputes() public view returns (uint256) {
        return numOfDisputes;
    }

    // Get number of disputes by landlord address
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

    // Get number of disputes by tenant address
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

    // Get all disputes
    function getAllDisputes() public view returns (RentDispute[] memory) {
        RentDispute[] memory allDisputes = new RentDispute[](numOfDisputes);
        for (uint256 i = 1; i <= numOfDisputes; i++) {
            allDisputes[i - 1] = disputes[i];
        }
        return allDisputes;
    }

    // Get all disputes by landlord address
    function getDisputesByLandlord(
        address _landlordAddress
    ) public view returns (RentDispute[] memory) {
        uint256 numOfLandlordDisputes = getNumOfDisputesByLandlord(
            _landlordAddress
        );
        RentDispute[] memory landlordDisputes = new RentDispute[](
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

    // Get all disputes by tenant address
    function getDisputesByTenant(
        address _tenantAddress
    ) public view returns (RentDispute[] memory) {
        uint256 numOfTenantDisputes = getNumOfDisputesByTenant(_tenantAddress);
        RentDispute[] memory tenantDisputes = new RentDispute[](
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

    //Get number of voters for a particular dispute
    function getNumVotersInDispute(
        uint256 _disputeId
    ) public view returns (uint256) {
        return votersInDispute[_disputeId].length;
    }
}
