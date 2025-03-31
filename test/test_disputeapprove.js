/*
Description: Test cases for dispute APPROVED for lease property (tenant wins)
Roles: 1 Tenant, 1 Landlord, 3 Validator
Run Command: truffle test ./test/test_disputeapprove.js
Test Cases (8):
1. Tenant can file for a dispute for a lease property
2. Tenant cannot move out of lease property in a dispute
3. Validators can vote for a dispute for a lease property (3 VALIDATORS)
4. Validators can only vote once for a dispute once for a lease property
5. Check Dispute APPROVAL outcome with voters
6. Tenant can only file for 1 dispute in the same lease property
7. Tenant move out of lease property (after dispute)
8. Landlord unlist the property
*/

// Require contracts to be deployed and assertion frameworks initialisation
const _deploy_contracts = require("../migrations/2_deploy_contracts");
const truffleAssert = require('truffle-assertions');
var assert = require('assert');
const Web3 = require('web3'); // npm install web3

// Create variables to represent contracts
var XToken = artifacts.require("../contracts/XToken.sol");
var PaymentEscrow = artifacts.require("../contracts/PaymentEscrow.sol");
var LeaseMarketplace = artifacts.require("../contracts/LeaseMarketplace.sol");
var LeaseProperty = artifacts.require("../contracts/LeaseProperty.sol");
var LeaseDisputeDAO = artifacts.require("../contracts/LeaseDisputeDAO.sol");

contract('Dispute APPROVED for Lease', function (accounts) {
    let xTokenInstance, paymentEscrowInstance, leaseMarketplaceInstance, leasePropertyInstance, leaseDisputeDAOInstance;

    const landlord = accounts[1];
    const tenant = accounts[2];
    const validator1 = accounts[3];
    const validator2 = accounts[4];
    const validator3 = accounts[5];
    const depositFee = 50;

    before(async () => {
        xTokenInstance = await XToken.deployed();
        paymentEscrowInstance = await PaymentEscrow.deployed();
        leaseMarketplaceInstance = await LeaseMarketplace.deployed();
        leasePropertyInstance = await LeaseProperty.deployed();
        leaseDisputeDAOInstance = await LeaseDisputeDAO.deployed();
    });

    it('Test 1 (Success): Tenant can file for a dispute for a lease property', async () => {

        /* ------------------------Start of Initial Setup----------------------- */

        // Amount of ETH to send to the contract
        let amountOfEthToSend = web3.utils.toWei('5', 'ether');

        // Get lease token for landlord and tenant
        await xTokenInstance.getXToken({
            from: landlord,
            value: amountOfEthToSend
        });

        await xTokenInstance.getXToken({
            from: tenant,
            value: amountOfEthToSend
        });

        // Create a lease property
        await leasePropertyInstance.addLeaseProperty("123 Main St", "s123456", "1", 0, "Nice place", "2", "30", "3", { from: landlord });

        // List the lease property
        await leaseMarketplaceInstance.listALeaseProperty(0, depositFee, { from: landlord });

        // Tenant apply for lease property
        await leaseMarketplaceInstance.applyLeaseProperty(0, "Tan Ah Kao", "tanahkao@gmail.com", "91231234", "I wish to stay in Main St with Nice place", { from: tenant });
        // Landlord accepts the lease application
        await leaseMarketplaceInstance.acceptLeaseApplication(0, 0, { from: landlord });

        // Tenant make payment to landlord and landlord accept payment for 3 months (until end of lease period)
        for (let i = 0; i < 3; i++) {
            // Tenant make payment to landlord
            await leaseMarketplaceInstance.makePayment(0, 0, { from: tenant });
            // Landlord accept payment
            await leaseMarketplaceInstance.acceptPayment(0, 0, { from: landlord });
        }

        /* ------------------------End of Initial Setup----------------------- */

        /* ------------------------Start of Create Dispute----------------------- */
        // Check the balance of the tenant wallet
        const tenantTokens = await xTokenInstance.checkXToken(tenant);
        console.log("Amount tenant have BEFORE dispute : " + tenantTokens)

        // Tenant file for a dispute
        const tenantDispute1 = await leaseDisputeDAOInstance.createLeaseDispute(0, 0, 1, "Landlord threatens to light house on fire", { from: tenant });
        // Check if the event was emitted
        truffleAssert.eventEmitted(tenantDispute1, 'LeaseDisputeCreated');

        // check balance of the token of tenant
        const tokenafter = await xTokenInstance.checkXToken(tenant);
        console.log("Amount tenant have AFTER dispute : " + tokenafter.toString())

        // Get the voter reward that the tenant needs to stake for the dispute
        const voterReward = await paymentEscrowInstance.getVoterReward();
        // Check if token balance is deducted correctly
        let expectedBalanceAfter = new web3.utils.BN(tenantTokens).sub(new web3.utils.BN(voterReward));
        assert.equal(tokenafter.toString(), expectedBalanceAfter.toString(), "Token balance not deducted correctly");

        /* ------------------------End of Create Dispute----------------------- */
    });

    it('Test 2 (Failure): Tenant cannot move out of lease property in a dispute', async () => {
        // Tenant move out of lease property in a dispute (should fail)
        try {
            await leaseMarketplaceInstance.moveOut(0, 0, {from: tenant});
        } catch (error) {
            console.log("Caught error:", error.message);
            assert(error.message.includes('revert Lease application is not completed'), "Unexpected error message: " + error.message);
        }
    });

    it('Test 3 (Success): Validators can vote for a dispute for a lease property (3 VALIDATORS)', async () => {
        // Get lease token for validators
        let amountOfEthToSend = web3.utils.toWei('5', 'ether');
        await xTokenInstance.getXToken({
            from: validator1,
            value: amountOfEthToSend
        });
        await xTokenInstance.getXToken({
            from: validator2,
            value: amountOfEthToSend
        });
        await xTokenInstance.getXToken({
            from: validator3,
            value: amountOfEthToSend
        });

        // Get current balance of the validators wallet
        let amtv1Before = await xTokenInstance.checkXToken(validator1);
        let amtv2Before = await xTokenInstance.checkXToken(validator2);
        let amtv3Before = await xTokenInstance.checkXToken(validator3);
        
        console.log("Validator 1 current wallet balance : " + amtv1Before.toString())
        console.log("Validator 2 current wallet balance : " + amtv2Before.toString())
        console.log("Validator 3 current wallet balance : " + amtv3Before.toString())
        
        /* 0 is void, 1 is approve, 2 is reject
        Note: disputeId starts from 1 (0 is used to indicate no dispute)
        Note: 2 validators approve, 1 validator reject.*/
        // Validator 1 approve
        let validator1VoteAccept = await leaseDisputeDAOInstance.voteOnLeaseDispute(1, 1, { from: validator1 });
        // Check if the event was emitted
        truffleAssert.eventEmitted(validator1VoteAccept, 'VoteOnLeaseDispute');

        // Validator 2 approve
        let validator2VoteAccept = await leaseDisputeDAOInstance.voteOnLeaseDispute(1, 1, { from: validator2 });
        // Check if the event was emitted
        truffleAssert.eventEmitted(validator2VoteAccept, 'VoteOnLeaseDispute');

        // Validator 3 reject
        let validator3VoteReject = await leaseDisputeDAOInstance.voteOnLeaseDispute(1, 2, { from: validator3 });
        // Check if the event was emitted
        truffleAssert.eventEmitted(validator3VoteReject, 'VoteOnLeaseDispute');

        // Check the new balance of the validators wallet
        let amtv1After = await xTokenInstance.checkXToken(validator1);
        let amtv2After = await xTokenInstance.checkXToken(validator2);
        let amtv3After = await xTokenInstance.checkXToken(validator3);

        // Get Vote Price from Payment Escrow for validators to participate in voting
        let votePrice = await paymentEscrowInstance.getVotePrice();
        // Get the expected balance after deducting the vote price
        let expectedBalanceAfter1 = new web3.utils.BN(amtv1Before).sub(new web3.utils.BN(votePrice));
        let expectedBalanceAfter2 = new web3.utils.BN(amtv2Before).sub(new web3.utils.BN(votePrice));
        let expectedBalanceAfter3 = new web3.utils.BN(amtv3Before).sub(new web3.utils.BN(votePrice));

        // Check if token balance is deducted correctly
        assert.equal(amtv1After.toString(), expectedBalanceAfter1.toString(), "Token balance not deducted correctly for validator 1");
        assert.equal(amtv2After.toString(), expectedBalanceAfter2.toString(), "Token balance not deducted correctly for validator 2");
        assert.equal(amtv3After.toString(), expectedBalanceAfter3.toString(), "Token balance not deducted correctly for validator 3");

        console.log("Validator 1 new wallet balance : " + amtv1After.toString())
        console.log("Validator 2 new wallet balance : " + amtv2After.toString())
        console.log("Validator 3 new wallet balance : " + amtv3After.toString())
    });

    it('Test 4 (Success): Validators can only vote once for a dispute once for a lease property', async () => {

        // Validator 1, 2 and 3 vote again (should fail)
        try {
            let validator1Vote = await leaseDisputeDAOInstance.voteOnLeaseDispute(1, 1, { from: validator1 });
            truffleAssert.eventEmitted(validator1Vote, 'VoteOnLeaseDispute');

            let validator2Vote = await leaseDisputeDAOInstance.voteOnLeaseDispute(1, 1, { from: validator2 });
            truffleAssert.eventEmitted(validator2Vote, 'VoteOnLeaseDispute');

            let validator3Vote = await leaseDisputeDAOInstance.voteOnLeaseDispute(1, 2, { from: validator3 });
            truffleAssert.eventEmitted(validator3Vote, 'VoteOnLeaseDispute');

        } catch (error) {
            console.log("Caught error:", error.message);
            assert(error.message.includes('revert Voter has already voted'), "Unexpected error message: " + error.message);
        }
    });

    it('Test 5 (Success): Check Dispute APPROVAL outcome with voters', async () => {  

        // Get number of tenants in the lease property
        let numberOfTenants = await leasePropertyInstance.getNumOfTenants(0);
        // Get number of votes in the dispute
        let numberOfVotes = await leaseDisputeDAOInstance.getNumVotersInDispute(1);
        // Get vote price from Payment Escrow
        let votePrice = await paymentEscrowInstance.getVotePrice();
        // Get the validator reward that the winning validators will receive 
        // <Formula: (Voter Reward + (Number of Votes * Vote Price)) / Number of Winning Validators)>
        let validatorReward = ((Number(await paymentEscrowInstance.getVoterReward())) + (numberOfVotes * Number(votePrice))) / 2;
        // Get the tenant reward that the tenant will receive
        // <Formula: (1 / Number of Tenants) * Protection Fee>
        let tenantReward = (1 / numberOfTenants)*(await paymentEscrowInstance.getProtectionFee());
    
        // Get tenant balance before dispute
        let tenantTokensBefore = await xTokenInstance.checkXToken(tenant);
        // Get landlord balance before dispute
        let landlordTokensBefore = await xTokenInstance.checkXToken(landlord);
        // Get winning validator 1 balance before dispute
        let validator1TokensBefore = await xTokenInstance.checkXToken(validator1);
        // Get winning validator 2 balance before dispute
        let validator2TokensBefore = await xTokenInstance.checkXToken(validator2);
        // Get losing validator 3 balance before dispute
        let validator3TokensBefore = await xTokenInstance.checkXToken(validator3);

        console.log("Tenant Balance BEFORE dispute : " + tenantTokensBefore.toString());
        console.log("Landlord Balance BEFORE dispute : " + landlordTokensBefore.toString());
        console.log("Winning Validator 1 Balance BEFORE dispute : " + validator1TokensBefore.toString());
        console.log("Winning Validator 2 Balance BEFORE dispute : " + validator2TokensBefore.toString());
        console.log("Losing Validator 3 Balance BEFORE dispute : " + validator3TokensBefore.toString());

        // Resolve the dispute (Triggered manually for testing purposes)
        let resolve = await leaseDisputeDAOInstance.triggerResolveLeaseDispute(1);
        truffleAssert.eventEmitted(resolve, 'LeaseDisputeResolved');

        // Check the new balance of the tenant wallet
        let tenantTokensafter = await xTokenInstance.checkXToken(tenant);
        // Check the new balance of the landlord wallet
        let landlordTokensafter = await xTokenInstance.checkXToken(landlord);
        // Check the new balance of the winning validator 1 wallet
        let validator1Tokensafter = await xTokenInstance.checkXToken(validator1);
        // Check the new balance of the winning validator 2 wallet
        let validator2Tokensafter = await xTokenInstance.checkXToken(validator2);
        // Check the new balance of the losing validator 3 wallet
        let validator3Tokensafter = await xTokenInstance.checkXToken(validator3);

        console.log("Tenant New Balance AFTER dispute : " + tenantTokensafter.toString());
        console.log("Landlord New Balance AFTER dispute : " + landlordTokensafter.toString());
        console.log("Winning Validator 1 New Balance BEFORE added VOTE commision : " + validator1Tokensafter.toString());
        console.log("Winning Validator 2 New Balance BEFORE added Vote commison : " + validator2Tokensafter.toString());
        console.log("Losing Validator 3 New Balance BEFORE lost : " + validator3Tokensafter.toString());

        // Get the expected balance after adding the rewards
        let expectedBalanceAfterTenant = new web3.utils.BN(tenantTokensBefore).add(new web3.utils.BN(tenantReward));
        let expectedBalanceAfterLandlord = new web3.utils.BN(landlordTokensBefore);
        let expectedBalanceAfterValidator1 = new web3.utils.BN(validator1TokensBefore).add(new web3.utils.BN(validatorReward));
        let expectedBalanceAfterValidator2 = new web3.utils.BN(validator2TokensBefore).add(new web3.utils.BN(validatorReward));
        let expectedBalanceAfterValidator3 = new web3.utils.BN(validator3TokensBefore);

        // Check if token balance is deducted correctly
        assert.equal(tenantTokensafter.toString(), expectedBalanceAfterTenant.toString(), "Token balance not added correctly for tenant");
        assert.equal(landlordTokensafter.toString(), expectedBalanceAfterLandlord.toString(), "Token balance not deducted correctly for landlord");
        assert.equal(validator1Tokensafter.toString(), expectedBalanceAfterValidator1.toString(), "Token balance not added correctly for validator 1");
        assert.equal(validator2Tokensafter.toString(), expectedBalanceAfterValidator2.toString(), "Token balance not added correctly for validator 2");
        assert.equal(validator3Tokensafter.toString(), expectedBalanceAfterValidator3.toString(), "Token balance not added correctly for validator 3");

    });

    it('Test 6 (Failure): Tenant can only file for 1 dispute in the same lease property', async () => {
        // Tenant file for a dispute again (should fail)
        try {
            await leaseDisputeDAOInstance.createLeaseDispute(0, 0, 1, "Landlord threatens to light house on fire second time", { from: tenant });
        } catch (error) {
            console.log("Caught error:", error.message);
            assert(error.message.includes('revert Tenant has already made a dispute for this lease property'), "Unexpected error message: " + error.message);
        }
    });


    it('Test 7 (Success): Tenant move out of lease property (after dispute)', async () => {    
        // Get the current balance of the tenant wallet
        let t2current = await xTokenInstance.checkXToken(tenant);
        // Get the current balance of the landlord wallet
        let landlordbefore = await xTokenInstance.checkXToken(landlord);
        // Get lease application details
        let application = await leaseMarketplaceInstance.getLeaseApplication(0,0);
        // Check that application status is COMPLETED to allow tenant to move out
        assert.equal(application.status, 3, "Application status not COMPLETED");

        console.log("Tenant Balance : Before Move Out : " + t2current.toString())
        console.log("Landlord Balance : Before Move Out : " + landlordbefore.toString())

        // Tenant move out of lease property
        await leaseMarketplaceInstance.moveOut(0, 0, {from: tenant});

        // Check the new balance of the tenant wallet
        let t2after = await xTokenInstance.checkXToken(tenant);
        // Check the new balance of the landlord wallet
        let landlordAfter = await xTokenInstance.checkXToken(landlord);

        // Get the expected balance after moving out
        let expectedTenantBalanceAfter = new web3.utils.BN(t2current).add(new web3.utils.BN(depositFee));
        let expectedLandlordBalanceAfter = new web3.utils.BN(landlordbefore).sub(new web3.utils.BN(depositFee));
        assert.equal(t2after.toString(), expectedTenantBalanceAfter.toString(), "Deposit Fee not refunded correctly to Tenant");
        assert.equal(landlordAfter.toString(), expectedLandlordBalanceAfter.toString(), "Deposit Fee not refunded correctly From Landlord");
        
        console.log("Tenant Balance : After Move Out + Deposit Fee : " + t2after.toString())
        console.log("Landlord Balance : After Move Out : " + landlordAfter.toString())
    });

    it('Test 8 (Success): Landlord unlist the property', async () => {

        // Get number of tenants in the lease property
        let numberOfTenants = await leasePropertyInstance.getNumOfTenants(0);
        // Get the tenant reward that the tenant will receive
        // <Formula: (1 / Number of Tenants) * Protection Fee>
        let tenantReward = (1 / numberOfTenants)*(await paymentEscrowInstance.getProtectionFee());
        // Get remaining protection fee balance for landlord
        let remainingProtectionFee = (Number(await paymentEscrowInstance.getProtectionFee())) - Number(tenantReward);

        // Get the current balance of the landlord wallet
        const landlordWalletBefore = await xTokenInstance.checkXToken(landlord);
        console.log("Before Unlist Property Token Balance:" + landlordWalletBefore.toString());

        // Unlist the lease property
        const result = await leaseMarketplaceInstance.unlistALeaseProperty(0, {from: landlord});
        // Check if the event was emitted
        truffleAssert.eventEmitted(result, 'LeasePropertyUnlisted');

        // Get the new balance of the landlord wallet
        let landlordWalletAfter = await xTokenInstance.checkXToken(landlord);
        console.log("After Unlist Property Token Balance (Get remaining protection fee)) :" + landlordWalletAfter.toString());

        // Get the expected balance after unlisting the property
        let expectedLandlordBalanceAfter = new web3.utils.BN(landlordWalletBefore).add(new web3.utils.BN(remainingProtectionFee));

        // Check if token balance is added correctly
        assert.equal(landlordWalletAfter.toString(), expectedLandlordBalanceAfter.toString(), "Protection Fee not refunded correctly to Landlord");
    });
});