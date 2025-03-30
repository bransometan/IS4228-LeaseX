/*
Description: Test cases for Lease Property Management and Lease Property Marketplace
Roles: 1 Landlord, 3 Tenant 
Run Command: truffle test ./test/test_marketplace.js

Lease Property Management
Test Cases (3):
1. Landlord add lease property
2. Landlord updates lease property
3. Landlord deletes their property listing

Lease Property Marketplace
Test Cases (19):
1. Tenants get XTokens in exchange for ETH
2. Landlord CANNOT list property
3. Landlord CAN list a property on market place
4. Landlord can update property when there is no tenant applications
5. Landlord can unlist property when there is no tenant applications
6. Tenant can apply for lease property
7. Landlord cannot unlist property when there are applications
8. Landlord cannot update property when there are applications
9. Landlord cannot delete property when there are applications
10. Tenant cancel tenant lease application
11. Landlord accepts lease application
12. Landlord reject tenant lease application
13. Landlord accept payment for monthly lease fee from a tenant
14. Tenant cannot move out from lease property when payment not made for entire lease period
15. Tenant make payment for monthly lease fee
16. Landlord accept payment for monthly lease fee from a tenant
17. Tenant move out from lease property
18. Landlord unlist lease property
19. Landlord convert XToken back to ETH
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

contract('Lease Property + Lease Marketplace Test Cases', function(accounts) {
    let xTokenInstance, paymentEscrowInstance, leaseMarketplaceInstance, leasePropertyInstance, leaseDisputeDAOInstance;

    const landlord = accounts[1];
    const tenant1 = accounts[2];
    const tenant2 = accounts[3];
    const tenant3 = accounts[4];

    const depositFee = 50; // deposit fee

    before(async () => {
        xTokenInstance = await XToken.deployed();
        paymentEscrowInstance = await PaymentEscrow.deployed();
        leaseMarketplaceInstance = await LeaseMarketplace.deployed();
        leasePropertyInstance = await LeaseProperty.deployed();
        leaseDisputeDAOInstance = await LeaseDisputeDAO.deployed();
    });

    it('Test 1 (Success): Landlord add lease property', async () => {
        // Landlord lists 2 property of hdb type
        let hdb1 = await leasePropertyInstance.addLeaseProperty("123 Main St", "s123456", "01-01", 0 , "Nice place", 2, 30, 12, {from: landlord});
        let hdb2 = await leasePropertyInstance.addLeaseProperty("123 Bishan Street 10", "s321323", "02-02", 0 , "Amazing vibe", 5, 50, 12, {from: landlord});

        // Landlord lists 2 property of condo type
        let condo1 = await leasePropertyInstance.addLeaseProperty("123 Jurong East ", "s423443", "03-03", 1 , "Nice place amazing", 3, 20, 12, {from: landlord});
        let condo2 = await leasePropertyInstance.addLeaseProperty("12 Mandai Avenue", "s534534", "04-04", 1 , "cool place", 1, 50, 12, {from: landlord});

        // Landlord lists 2 property of landed type
        let landed1 = await leasePropertyInstance.addLeaseProperty("76 Sengkang Drive", "s534533", "05-05", 2 , "Bright place", 6, 20, 12, {from: landlord});
        let landed2 = await leasePropertyInstance.addLeaseProperty("11 Bukit Timah Hill", "s532666", "06-06", 2 , "Windy place", 5, 20, 12, {from: landlord});

        // Landlord lists 1 property of other type
        let other1 = await leasePropertyInstance.addLeaseProperty("123 Industrial St", "s5435443", "07-07", 3 , "Cool place", 10, 40, 12, {from: landlord});

        // Check if the events are emitted
        truffleAssert.eventEmitted(hdb1, 'LeasePropertyCreated');
        truffleAssert.eventEmitted(hdb2, 'LeasePropertyCreated');
        truffleAssert.eventEmitted(condo1, 'LeasePropertyCreated');
        truffleAssert.eventEmitted(condo2, 'LeasePropertyCreated');
        truffleAssert.eventEmitted(landed1, 'LeasePropertyCreated');
        truffleAssert.eventEmitted(landed2, 'LeasePropertyCreated');
        truffleAssert.eventEmitted(other1, 'LeasePropertyCreated');

        // Test using postal code
        assert.equal(await leasePropertyInstance.getPostalCode(0), "s123456", "Property 0 not added");
        assert.equal(await leasePropertyInstance.getPostalCode(1), "s321323", "Property 1 not added");
        assert.equal(await leasePropertyInstance.getPostalCode(2), "s423443", "Property 2 not added");
        assert.equal(await leasePropertyInstance.getPostalCode(3), "s534534", "Property 3 not added");
        assert.equal(await leasePropertyInstance.getPostalCode(4), "s534533", "Property 4 not added");
        assert.equal(await leasePropertyInstance.getPostalCode(5), "s532666", "Property 5 not added");
        assert.equal(await leasePropertyInstance.getPostalCode(6), "s5435443", "Property 6 not added");

    });

    it('Test 2 (Success): Landlord updates lease property', async () => {
        // Landlord updates a lease property. As an example, we will use property 6
        let updateResult = await leasePropertyInstance.updateLeaseProperty(
            6, "239 Main St", "s123457", "11-11", 0, "Even nicer place", 3, 35, 12, {from: landlord}
        );

        // Check if the event is emitted
        truffleAssert.eventEmitted(updateResult, 'LeasePropertyUpdateDetails');
        
        // Check if the property is updated correctly using the postal code
        assert.equal(await leasePropertyInstance.getPostalCode(6), "s123457", "Property 6 not updated");
    });


    it('Test 3 (Success): Landlord deletes their property listing', async () => {
        // Landlord deletes the property. As an example, we will use property 6
        let deleteResult = await leasePropertyInstance.deleteLeaseProperty(6, {from: landlord});
        truffleAssert.eventEmitted(deleteResult, 'LeasePropertyDeleted');
        
        // Check if the property is deleted correctly using the postal code
        assert.equal(await leasePropertyInstance.getPostalCode(6), "", "Property 6 not deleted");        
    });

    it('Test 1 (Success): Tenants get XTokens in exchange for ETH', async () => {
        // Amount of ETH a user will send to the contract to get XTokens.
        // For example, 0.1 ETH will give them 10 XTokens if the rate is 0.01 ETH per XToken.
        // For this test, we will use 10 ETH to get 1000 XTokens.

        // Get current ETH balance of tenants
        let tenant1EthBalanceBefore = await web3.eth.getBalance(tenant1);
        let tenant2EthBalanceBefore = await web3.eth.getBalance(tenant2);
        let tenant3EthBalanceBefore = await web3.eth.getBalance(tenant3);
        // Get current token balance of tenants
        let tenant1TokenBalanceBefore = await xTokenInstance.checkXToken(tenant1);
        let tenant2TokenBalanceBefore = await xTokenInstance.checkXToken(tenant2);
        let tenant3TokenBalanceBefore = await xTokenInstance.checkXToken(tenant3);

        // Convert 10 ETH to Wei
        let amountOfEthToSend = web3.utils.toWei('10', 'ether');

        // Get XTokens in exchange for ETH for tenant1
        let result0 = await xTokenInstance.getXToken({
            from: tenant1, 
            value: amountOfEthToSend
        });

        // Get XTokens in exchange for ETH for tenant2
        let result1 = await xTokenInstance.getXToken({
            from: tenant2, 
            value: amountOfEthToSend
        });

        // Get XTokens in exchange for ETH for tenant3
        let result2 = await xTokenInstance.getXToken({
            from: tenant3, 
            value: amountOfEthToSend
        });

        // Check if the events are emitted
        truffleAssert.eventEmitted(result0, 'getCredit');
        truffleAssert.eventEmitted(result1, 'getCredit');
        truffleAssert.eventEmitted(result2, 'getCredit');

        // Get current ETH balance of tenants after getting XTokens
        let tenant1EthBalanceAfter = await web3.eth.getBalance(tenant1);
        let tenant2EthBalanceAfter = await web3.eth.getBalance(tenant2);
        let tenant3EthBalanceAfter = await web3.eth.getBalance(tenant3);
        // Get current token balance of tenants after getting XTokens
        let tenant1TokenBalanceAfter = await xTokenInstance.checkXToken(tenant1);
        let tenant2TokenBalanceAfter = await xTokenInstance.checkXToken(tenant2);
        let tenant3TokenBalanceAfter = await xTokenInstance.checkXToken(tenant3);

        // Check if the ETH is less after getting XTokens
        assert(Number(tenant1EthBalanceAfter) < Number(tenant1EthBalanceBefore), "Tenant1 New ETH balance is incorrect");
        assert(Number(tenant2EthBalanceAfter) < Number(tenant2EthBalanceBefore), "Tenant2 New ETH balance is incorrect");
        assert(Number(tenant3EthBalanceAfter) < Number(tenant3EthBalanceBefore), "Tenant3 New ETH balance is incorrect");
        // Check if the XTokens are received correctly
        assert.equal(tenant1TokenBalanceAfter.toString(), (BigInt(tenant1TokenBalanceBefore) + BigInt(1000)).toString(), "Tenant1 XToken balance is incorrect");
        assert.equal(tenant2TokenBalanceAfter.toString(), (BigInt(tenant2TokenBalanceBefore) + BigInt(1000)).toString(), "Tenant2 XToken balance is incorrect");
        assert.equal(tenant3TokenBalanceAfter.toString(), (BigInt(tenant3TokenBalanceBefore) + BigInt(1000)).toString(), "Tenant3 XToken balance is incorrect");
        
    });

    it('Test 2 (Failure): Landlord CANNOT list property', async () => {
        // Amount of ETH landlord will send to the contract to get XTokens.
        let amountOfEthToSend = web3.utils.toWei('0.4', 'ether');

        // Get XTokens in exchange for ETH for landlord
        await xTokenInstance.getXToken({
            from: landlord,
            value: amountOfEthToSend
        });

        // Check the XToken balance of the landlord
        let landlordBalance = await xTokenInstance.checkXToken(landlord);
        console.log("Landlord's XToken Balance:", landlordBalance.toString());
        
        // Landlord tries to list a property without having enough balance (0.4 ETH = 40 XTokens < 0.5 ETH = 50 XTokens)
        // 50 XTokens (Protection Fee) are required to list a property
        try {
            await leaseMarketplaceInstance.listALeaseProperty(1, depositFee, {from: landlord});
            assert.fail("The transaction should have reverted due to insufficient balance!");
        } catch (error) {
            console.log("Caught error:", error.message);
            assert(
                error.message.includes('revert Payer does not have enough balance'),
                "Unexpected error message: " + error.message
            );
        }
    });
                                                                                                                   
    it('Test 3 (Success): Landlord CAN list a property on market place', async () => {
        // Amount of ETH landlord will send to the contract to get XTokens.
        let amountOfEthToSend = web3.utils.toWei('10', 'ether');
        // Get XTokens in exchange for ETH for landlord
        await xTokenInstance.getXToken({
            from: landlord, 
            value: amountOfEthToSend
        });
        // Check the XToken balance of the landlord
        let landlordBalance = await xTokenInstance.checkXToken(landlord);
        console.log("Landlord Balance " + landlordBalance.toString())
        // Landlord lists a property on the marketplace
        const leaseProperty = await leaseMarketplaceInstance.listALeaseProperty(1, depositFee, {from: landlord});
        // Check if the event is emitted
        truffleAssert.eventEmitted(leaseProperty, 'LeasePropertyListed');
        
        // Check if the property is listed
        const isListed = await leasePropertyInstance.getListedStatus(1);
        assert.equal(isListed, true, "Property should be listed");
    });

    it("Test 4 (Success): Landlord can update property when there is no tenant applications", async () => {
        // Check if anyone has applied for the property
        const ifAnyoneApplied = await leaseMarketplaceInstance.getLeaseApplicationCount(1);
        // Check if the property has tenant applications
        assert.equal(ifAnyoneApplied, false, "Property has tenant applications")
        // Update the property details
        let updatedTitle = "239 Main St";
        let updatedDescription = "Even nicer place";
        let updatedLeasePrice = 35;
        let updateResult = await leasePropertyInstance.updateLeaseProperty(
            1, updatedTitle, "s123457", "Unit 2", 0, updatedDescription, 3, updatedLeasePrice, 12, {from: landlord}
        );

        // Check if the event is emitted
        truffleAssert.eventEmitted(updateResult, 'LeasePropertyUpdateDetails');

        // Check if the property is updated correctly
        let updatedProperty = await leasePropertyInstance.getLeaseProperty(1);
        assert.equal(updatedProperty[1], updatedTitle, "Property title should be updated.");
        assert.equal(updatedProperty[5], updatedDescription, "Property description should be updated.");
        assert.equal(updatedProperty[7], updatedLeasePrice, "Lease price should be updated.");
    });

    it("Test 5 (Success): Landlord can unlist property when there is no tenant applications", async () => {
        // Check if anyone has applied for the property
        const ifAnyoneApplied = await leaseMarketplaceInstance.getLeaseApplicationCount(1);
        // Check if the property has tenant applications
        assert.equal(ifAnyoneApplied, false, "Property has tenant applications")
        // Unlist the property
        const unlistResult = await leaseMarketplaceInstance.unlistALeaseProperty(1, {from: landlord});
        // Check if the event is emitted
        truffleAssert.eventEmitted(unlistResult, 'LeasePropertyUnlisted');
        // Check if the property is unlisted
        const isListed = await leasePropertyInstance.getListedStatus(1);
        assert.equal(isListed, false, "Property should be unlisted");
    });

    it("Test 6 (Success): Tenant can apply for lease property", async () => {
        // Landlord lists a property on the marketplace
        await leaseMarketplaceInstance.listALeaseProperty(2, depositFee, {from: landlord});
        
        // Tenant 1, Tenant 2, and Tenant 3 apply for the property
        // XToken has already been given to the tenants in the previous tests
        const result1 = await leaseMarketplaceInstance.applyLeaseProperty(2, "John Doe", "johndoe@example.com", "1235567890", "Need a place near school", {from: tenant1});
        const result2 = await leaseMarketplaceInstance.applyLeaseProperty(2, "John Neymar", "johnneymar@example.com", "1243437890", "Need a place near work", {from: tenant2});
        const result3 = await leaseMarketplaceInstance.applyLeaseProperty(2, "John Messi", "johnmessi@example.com", "123412890", "Need a place near park", {from: tenant3});

        // Check if the events are emitted for all tenants to check if they have applied for the property
        truffleAssert.eventEmitted(result1, 'LeaseApplicationSubmitted');
        truffleAssert.eventEmitted(result2, 'LeaseApplicationSubmitted');
        truffleAssert.eventEmitted(result3, 'LeaseApplicationSubmitted');

        // Get the new tenants balance after applying for the property
        let t1balance = await xTokenInstance.checkXToken(tenant1);
        let t2balance = await xTokenInstance.checkXToken(tenant2);
        let t3balance = await xTokenInstance.checkXToken(tenant3);

        // Check if the deposit fee is deducted from the tenant's wallet
        assert.equal(t1balance, 950, "Tenant wallet should have deducted the amount");
        assert.equal(t2balance, 950, "Tenant wallet should have deducted the amount");
        assert.equal(t3balance, 950, "Tenant wallet should have deducted the amount");

    });

    it("Test 7 (Failure): Landlord cannot unlist property when there are applications", async () => {
        // Attempt to unlist the property which should fail due to existing applications
        try {
            await leaseMarketplaceInstance.unlistALeaseProperty(2, {from: landlord});
            assert.fail("The transaction should have reverted!");
        } catch (error) {
            console.log("Caught error:", error.message);
            assert(error.message.includes('revert Lease property is not vacant'), "Unexpected error message: " + error.message);
        }
    });

    it("Test 8 (Failure): Landlord cannot update property when there are applications", async () => {
        // Attempt to update the property which should fail due to existing applications
        try {
            let updatedTitle = "123 Failure St";
            let updatedDescription = "Nicest place";
            let updatedLeasePrice = 10;
            await leasePropertyInstance.updateLeaseProperty(
                2, updatedTitle, "s123457", "Unit 2", 0, updatedDescription, 3, updatedLeasePrice, 12, {from: landlord}
            );
        } catch (error) {
            console.log("Caught error:", error.message);
            assert(error.message.includes('revert Lease Property cannot be updated or deleted'), "Unexpected error message: " + error.message);
        }
    });

    it("Test 9 (Failure): Landlord cannot delete property when there are applications", async () => {
        // Attempt to delete the property which should fail due to existing applications
        try {
            await leasePropertyInstance.deleteLeaseProperty(2, {from: landlord});
        } catch (error) {
            console.log("Caught error:", error.message);
            assert(error.message.includes('revert Lease Property cannot be updated or deleted'), "Unexpected error message: " + error.message);
        }
    });

    it("Test 10 (Success): Tenant cancel tenant lease application", async () => {
        // Check tenant 3 balance before cancellation
        let t3balanceBefore = await xTokenInstance.checkXToken(tenant3);
        console.log(`Balance Before: ${t3balanceBefore.toString()}`);
        // Tenant 3 cancel the application
        const result = await leaseMarketplaceInstance.cancelOrRejectLeaseApplication(2, 2, {from: tenant3});
        // Check if the event is emitted
        truffleAssert.eventEmitted(result, 'LeaseApplicationCancelOrRejected');
        // Check tenant 3 balance after the cancellation
        let t3balanceAfter = await xTokenInstance.checkXToken(tenant3);
        let expectedBalanceAfter = new web3.utils.BN(t3balanceBefore).add(new web3.utils.BN(depositFee));
        // Check if the deposit fee is refunded to the tenant's wallet
        assert.equal(t3balanceAfter.toString(), expectedBalanceAfter.toString(), "Deposit Fee not refunded correctly");

        console.log(`Balance After: ${t3balanceAfter.toString()}`);
    });

    it("Test 11 (Success): Landlord accepts lease application", async () => {
        // Check landlord wallet balance before accept application
        let landlordBBefore = await xTokenInstance.checkXToken(landlord);
        console.log("Landlord wallet balance BEFORE accept applicaton : " + landlordBBefore.toString())

        // Accept tenant 2 application
        const result = await leaseMarketplaceInstance.acceptLeaseApplication(2, 1, {from: landlord});
        // Check if the event is emitted
        truffleAssert.eventEmitted(result, 'LeaseApplicationAccepted');
        
        // Check landlord wallet balance after accept application
        let landlordB = await xTokenInstance.checkXToken(landlord);
        let expectedBalanceAfter = new web3.utils.BN(landlordBBefore).add(new web3.utils.BN(depositFee));
        // Check if the deposit fee is received from the tenant's wallet
        assert.equal(landlordB.toString(), expectedBalanceAfter.toString(), "Deposit fee not received from tenant");

        console.log("Landlord wallet balance AFTER accept applicaton : " + landlordB.toString())

    });

    it("Test 12 (Success): Landlord reject tenant lease application", async () => {
        // Get the tenant's balance before the cancellation
        let t1balancebefore = await xTokenInstance.checkXToken(tenant1);
        console.log(`Balance Before: ${t1balancebefore.toString()}`);
        // Landlord reject tenant 1 application
        const result = await leaseMarketplaceInstance.cancelOrRejectLeaseApplication(2, 0, {from: landlord});
        // Check if the event is emitted
        truffleAssert.eventEmitted(result, 'LeaseApplicationCancelOrRejected');
        // Get the tenant's balance after the cancellation
        let t1balance = await xTokenInstance.checkXToken(tenant1);

        // Check if the deposit fee is refunded to the tenant's wallet
        let expectedBalanceAfter = new web3.utils.BN(t1balancebefore).add(new web3.utils.BN(depositFee));
        assert.equal(t1balance.toString(), expectedBalanceAfter.toString(), "Deposit Fee not refunded correctly");

        console.log(`Balance After: ${t1balance.toString()}`);

    });

    it("Test 13 (Failure): Landlord cannot accept payment from lease application when tenant has not made payment", async () => {
        // Check if the tenant has made payment for the lease application before accepting payment
        try {
            await leaseMarketplaceInstance.acceptPayment(2, 1, {from: landlord});
        } catch (error) {
            console.log("Caught error:", error.message);
            assert(error.message.includes('revert Tenant has not made payment'), "Unexpected error message: " + error.message);
        }

    });

    it("Test 14 (Success): Tenant make payment for monthly lease fee", async () => {
        // Check if the lease application is marked as ongoing
        let application = await leaseMarketplaceInstance.getLeaseApplication(2,1);
        // Check if the lease application is ongoing
        assert.equal(application.status, 1, "Application status not ongoing");

        // Check tenant 2 balance before making payment
        let tenant2before = await xTokenInstance.checkXToken(tenant2);
        console.log("Before Payment Made :" + tenant2before.toString())

        // Tenant 2 makes payment for the monthly lease fee
        const result = await leaseMarketplaceInstance.makePayment(2, 1, {from: tenant2});
        truffleAssert.eventEmitted(result, 'PaymentMade');

        // Check tenant 2 balance after making payment
        let tenant2after = await xTokenInstance.checkXToken(tenant2);
        let mfee = await leasePropertyInstance.getLeasePrice(2);
        let expectedBalanceAfter = new web3.utils.BN(tenant2before).sub(new web3.utils.BN(mfee));
        // Check if the monthly lease fee is deducted from the tenant's wallet
        assert.equal(tenant2after.toString(), expectedBalanceAfter.toString(), "Tenant have not made payment");
        console.log("After Payment Made :" + tenant2after.toString())
    });

    it("Test 15 (Success): Landlord accept payment for monthly lease fee from a tenant", async () => {
        // Check if the lease application is marked as MAKE PAYMENT
        let application = await leaseMarketplaceInstance.getLeaseApplication(2,1);
        assert.equal(application.status, 2, "Application status not MAKE PAYMENT");

        // Check landlord wallet balance before accepting payment
        let landlordbefore = await xTokenInstance.checkXToken(landlord);
        console.log("Before Lease Receive:" + landlordbefore.toString())

        // Landlord accept payment for the monthly lease fee
        const result = await leaseMarketplaceInstance.acceptPayment(2, 1, {from: landlord});
        truffleAssert.eventEmitted(result, 'PaymentAccepted');

        // Check landlord wallet balance after accepting payment
        let landlordafter = await xTokenInstance.checkXToken(landlord);
        let mfee = await leasePropertyInstance.getLeasePrice(2);
        let expectedBalanceAfter = new web3.utils.BN(landlordbefore).add(new web3.utils.BN(mfee));
        // Check if the monthly lease fee is received by the landlord
        assert.equal(landlordafter.toString(), expectedBalanceAfter.toString(), "Landlord have not accept payment");
        console.log("After Monthly Lease Receive:" + landlordafter.toString())
    });

    it("Test 16 (Failure): Tenant cannot move out from lease property when payment not made for entire lease period", async () => {
        // Check if the lease application is marked as COMPLETED, which means the tenant has paid for the entire lease period
        try {
            await leaseMarketplaceInstance.moveOut(2, 1, {from: tenant2});
        } catch (error) {
            console.log("Caught error:", error.message);
            assert(error.message.includes('revert Lease application is not completed'), "Unexpected error message: " + error.message);
        }

    });

    it("Test 17 (Success): Tenant move out from lease property", async () => {
        // As tenant 2 has made payment for the 1 month out of entire lease period of 12 month, we will simulate the payment for 11 months
        for (let i = 0; i < 11; i++) {
            let t2before = await xTokenInstance.checkXToken(tenant2);
            console.log(`Tenant Start Balance for Month ${i + 2} :` + t2before.toString())

            await leaseMarketplaceInstance.makePayment(2, 1, {from: tenant2});
            await leaseMarketplaceInstance.acceptPayment(2, 1, {from: landlord});

            let t2after = await xTokenInstance.checkXToken(tenant2);
            console.log(`Tenant Balance After Lease Month ${i + 2}:` + t2after.toString())
        }

        // Check tenant 2 balance before moving out
        let t2current = await xTokenInstance.checkXToken(tenant2);
        // Check if the lease application is marked as COMPLETED
        let application = await leaseMarketplaceInstance.getLeaseApplication(2,1);
        assert.equal(application.status, 3, "Application status not COMPLETED");

        // Tenant 2 moves out from the lease property
        await leaseMarketplaceInstance.moveOut(2, 1, {from: tenant2});

        // Check tenant 2 balance after moving out
        let t2end = await xTokenInstance.checkXToken(tenant2);
        let expectedBalanceAfter = new web3.utils.BN(t2current).add(new web3.utils.BN(depositFee));
        // Check if the deposit fee is refunded to the tenant's wallet
        assert.equal(t2end.toString(), expectedBalanceAfter.toString(), "Deposit Fee not refunded correctly");
        console.log("After Move Out + Deposit Fee:" + t2end.toString())
        
    });

    it("Test 18 (Success): Landlord unlist lease property", async () => {
        // Get current wallet balance of landlord
        const landlordwallet = await xTokenInstance.checkXToken(landlord);
        console.log("Before Unlist Property:" + landlordwallet.toString())

        // Unlist the property
        const result = await leaseMarketplaceInstance.unlistALeaseProperty(2, {from: landlord});
        // Check if the event is emitted
        truffleAssert.eventEmitted(result, 'LeasePropertyUnlisted');

        // Check if the protection fee of 50 XTokens is refunded to the landlord's wallet
        const landlordwalletA = await xTokenInstance.checkXToken(landlord);
        let expectedBalanceAfter = new web3.utils.BN(landlordwallet).add(new web3.utils.BN(50));
        // Check if the protection fee is refunded correctly
        assert.equal(landlordwalletA.toString(), expectedBalanceAfter.toString(), "Protection Fee not refunded correctly");
        console.log("After Unlist (Refund + full protection fee) :" + landlordwalletA.toString())
    });

    it("Test 19 (Success): Landlord convert XToken back to ETH", async () => {
        // Get current ETH balance of landlord
        let landlordEthBalanceBefore = await web3.eth.getBalance(landlord);
        // Get current token balance of landlord
        const landlordWalletBefore = await xTokenInstance.checkXToken(landlord);
        console.log("Before Convert XToken to ETH:" + landlordWalletBefore.toString())

        // Convert XToken to ETH
        const result = await xTokenInstance.convertXTokenToETH(landlord, landlordWalletBefore, {from: landlord});
        // Check if the event is emitted
        truffleAssert.eventEmitted(result, 'refundCredit');

        // Get current ETH balance of landlord after converting XToken to ETH
        let landlordEthBalanceAfter = await web3.eth.getBalance(landlord);
        // Get current token balance of landlord after converting XToken to ETH
        const landlordWalletAfter = await xTokenInstance.checkXToken(landlord);

        // Check if the ETH is more after converting XToken to ETH
        assert(Number(landlordEthBalanceAfter) > Number(landlordEthBalanceBefore), "Landlord New ETH balance is incorrect");
        // Check if the XTokens are converted to ETH correctly
        assert.equal(landlordWalletAfter.toString(), "0", "XToken not converted to ETH correctly");
        console.log("After Convert XToken to ETH:" + landlordWalletAfter.toString())
    });

});



