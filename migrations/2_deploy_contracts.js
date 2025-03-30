// "XToken" represents a smart contract for managing lease tokens.
const XToken = artifacts.require("XToken");
// "PaymentEscrow" represents a smart contract for managing payment escrow.
const PaymentEscrow = artifacts.require("PaymentEscrow");
// "LeaseProperty" represents a smart contract for managing lease properties.
const LeaseProperty = artifacts.require("LeaseProperty");
// "LeaseMarketplace" represents a smart contract for managing a marketplace for leaseing properties.
const LeaseMarketplace = artifacts.require("LeaseMarketplace");
// "LeaseDisputeDAO" represents a smart contract for managing disputes related to lease.
const LeaseDisputeDAO = artifacts.require("LeaseDisputeDAO");

// Fixed parameters for the contracts
const PROTECTION_FEE = 50; // The fee that the payment escrow imposes on the landlord during property listing for protection against disputes
const VOTER_REWARD = 50; // The reward that the payment escrow imposes on the tenant to stake for incentivizing voting on disputes
const VOTE_PRICE = 1; // The price that the payment escrow imposes on the validator to vote on disputes
const MINIMUM_VOTES = 4; // The minimum number of votes required to resolve a dispute specified by the LeaseDisputeDAO contract

// Deployment order: XToken -> PaymentEscrow -> LeaseProperty -> LeaseMarketplace -> LeaseDisputeDAO
module.exports = async (deployer, network, accounts) => {
  
  // First: Deploy the XToken contract
  await deployer.deploy(XToken).then(function () {
    // Second: Deploy the PaymentEscrow contract and pass the address of the XToken contract and the other fixed parameters
    return deployer.deploy(
      PaymentEscrow,
      XToken.address,
      PROTECTION_FEE,
      VOTER_REWARD,
      VOTE_PRICE
    );
  });

  // Third: Deploy the LeaseProperty contract
  await deployer.deploy(LeaseProperty).then(function () {
    // Fourth: Deploy the LeaseMarketplace contract and pass the address of the LeaseProperty and PaymentEscrow contracts
    return deployer.deploy(
      LeaseMarketplace,
      LeaseProperty.address,
      PaymentEscrow.address
    );
  });

  // Fifth: Deploy the LeaseDisputeDAO contract and pass the address of the LeaseProperty, PaymentEscrow, and LeaseMarketplace contracts
  await deployer.deploy(
    LeaseDisputeDAO,
    LeaseProperty.address,
    PaymentEscrow.address,
    LeaseMarketplace.address,
    MINIMUM_VOTES
  );

   // Get the instance of the PaymentEscrow contract
   const escrowContract = await PaymentEscrow.deployed();
   // Get the instance of the LeaseProperty contract
   const leasePropertyContract = await LeaseProperty.deployed();
   // Get the instance of the LeaseMarketplace contract
   const leaseMarketplaceContract = await LeaseMarketplace.deployed();

  /* After deploying the contracts, set the addresses of respective contracts below in each contract
     Main purpose: Access Control (Security) - Prevent unauthorized access to functions in the contracts
     Note: The addresses of the contracts are set in the respective contracts to ensure that only the authorized contracts can access some functions of the contracts
  */
 
  // Set the addresses of the LeaseMarketplace contract in the PaymentEscrow contract
  await escrowContract.setLeaseMarketplaceAddress(LeaseMarketplace.address);
  // Set the address of the LeaseDisputeDAO contract in the PaymentEscrow contract
  await escrowContract.setLeaseDisputeDAOAddress(LeaseDisputeDAO.address);
  // Set the address of the LeaseMarketplace contract in the LeaseProperty contract
  await leasePropertyContract.setLeaseMarketplaceAddress(LeaseMarketplace.address);
  // Set the address of the LeaseDisputeDAO contract in the LeaseMarketplace contract
  await leaseMarketplaceContract.setLeaseDisputeDAOAddress(LeaseDisputeDAO.address);
};
