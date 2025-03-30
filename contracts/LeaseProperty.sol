// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/*
RentalProperty contract is a contract that allows landlords to create, update, delete and get rental properties.
RentalProperty contract has the following core functionalities:
- Landlord create a new rental property
- Landlord update details of a rental property
- Landlord delete a rental property
*/

contract RentalProperty {
    // ################################################### STRUCTURE & STATE VARIABLES ################################################### //

    enum PropertyType {
        HDB, // Housing and Development Board
        Condo, // Condominium
        Landed, // Landed Property
        Other // Other types of property
    }

    struct rentalProperty {
        uint256 rentalPropertyId; // id of the rental property
        string location; // location of the property
        string postalCode; // postal code of the property
        string unitNumber; // unit number of the property
        PropertyType propertyType; // type of property
        string description; // description of the property
        uint256 numOfTenants; // number of tenants in the property
        uint256 rentalPrice; // rental price in LeaseToken
        uint256 leaseDuration; // lease duration in months
        address landlord; // address of the landlord owner
        bool updateStatus; // status of the rental property (true if property can be updated/deleted, false if property cannot be updated/deleted)
        bool isListed; // status of the rental property (true if property is listed, false if property is not listed)
        uint256 paymentId; // Payment transaction id for protection fee (mainly used to keep track of protection fee for payment/refund)
    }

    uint256 private numRentalProperty = 0; // number of rental properties
    uint256 private numListedRentalProperty = 0; // number of listed rental properties
    mapping(uint256 => rentalProperty) private rentalProperties; // map of rental properties indexed by rentalPropertyId

    // The owner of the contract (RentalProperty), who can set the access control to the RentalMarketplace contract
    address private owner;
    // The address of the RentalMarketplace contract, mainly used for access control
    address private rentalMarketplaceAddress;

    // Constructor to set the owner of the contract
    constructor() {
        owner = msg.sender;
    }

    // ################################################### EVENTS ################################################### //

    event RentalPropertyCreated(
        uint256 rentalPropertyId,
        string location,
        string postalCode,
        string unitNumber,
        PropertyType propertyType,
        string description,
        uint256 numOfTenants,
        uint256 rentalPrice,
        uint256 leaseDuration,
        address landlord
    );

    event RentalPropertyUpdateDetails(
        uint256 rentalPropertyId,
        string newLocation,
        string newPostalCode,
        string newUnitNumber,
        PropertyType newPropertyType,
        string newDescription,
        uint256 newNumOfTenants,
        uint256 newRentalPrice,
        uint256 newLeaseDuration
    );

    event RentalPropertyDeleted(uint256 rentalPropertyId);

    // ################################################### MODIFIERS ################################################### //

    // Modifier to ensure only the owner of the contract can call the function
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
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

    // Modifier to ensure a function is callable only by its landlord owner
    modifier landlordOnly(uint256 rentalPropertyId) {
        require(
            rentalProperties[rentalPropertyId].landlord == msg.sender,
            "Only the landlord can call this function"
        );
        _;
    }

    // Modifier to ensure a function is accessible only if the rental property id is valid
    modifier validRentalPropertyId(uint256 rentalPropertyId) {
        require(
            rentalPropertyId < numRentalProperty,
            "Invalid rental property id"
        );
        _;
    }

    // Modifier to ensure the number of tenants is valid
    modifier validNumOfTenants(uint256 numOfTenants) {
        require(numOfTenants > 0, "Number of tenants must be greater than 0");
        _;
    }

    // Modifier to ensure the rental price is valid
    modifier validRentalPrice(uint256 rentalPrice) {
        require(rentalPrice > 0, "Rental Price must be greater than 0");
        _;
    }

    // Modifier to ensure the lease duration is valid
    modifier validLeaseDuration(uint256 leaseDuration) {
        require(leaseDuration > 0, "Lease Duration must be greater than 0");
        _;
    }

    // Modifier to ensure the rental property can be updated or deleted
    modifier validUpdateStatus(uint256 rentalPropertyId) {
        require(
            rentalProperties[rentalPropertyId].updateStatus == true,
            "Rental Property cannot be updated or deleted"
        );
        _;
    }

    // ################################################### CREATE METHOD ################################################### //

    // Function for landlord to create a new Rental Property, and add to 'rentalProperties' map.
    function addRentalProperty(
        string memory _location,
        string memory _postalCode,
        string memory _unitNumber,
        PropertyType _propertyType,
        string memory _description,
        uint256 _numOfTenants,
        uint256 _rentalPrice,
        uint256 _leaseDuration
    )
        public
        validNumOfTenants(_numOfTenants)
        validRentalPrice(_rentalPrice)
        validLeaseDuration(_leaseDuration)
        returns (uint256)
    {
        // New Rental Property object
        rentalProperty memory newRentalProperty = rentalProperty(
            numRentalProperty,
            _location,
            _postalCode,
            _unitNumber,
            _propertyType,
            _description,
            _numOfTenants,
            _rentalPrice,
            _leaseDuration,
            msg.sender, // landlord is the sender
            true, // initially, rental property can be updated/deleted when there are no tenants applications
            false, // initially, rental property is not listed
            0 // initially, payment id is 0 (no payment transaction)
        );

        uint256 newRentalPropertyId = numRentalProperty++; // increment rental property id
        rentalProperties[newRentalPropertyId] = newRentalProperty; // add to rentalProperties map

        // Emit event for Rental Property creation
        emit RentalPropertyCreated(
            newRentalPropertyId,
            _location,
            _postalCode,
            _unitNumber,
            _propertyType,
            _description,
            _numOfTenants,
            _rentalPrice,
            _leaseDuration,
            msg.sender
        );

        // Return new rental property id
        return newRentalPropertyId; 
    }

    // ################################################### GETTER METHODS ################################################### //

    // Function to get a rental property
    function getRentalProperty(
        uint256 rentalPropertyId
    )
        public
        view
        validRentalPropertyId(rentalPropertyId)
        returns (rentalProperty memory)
    {
        return rentalProperties[rentalPropertyId];
    }

    // Function to get the location of a rental property
    function getLocation(
        uint256 rentalPropertyId
    )
        public
        view
        validRentalPropertyId(rentalPropertyId)
        returns (string memory)
    {
        return rentalProperties[rentalPropertyId].location;
    }

    // Function to get the postal code of a rental property
    function getPostalCode(
        uint256 rentalPropertyId
    )
        public
        view
        validRentalPropertyId(rentalPropertyId)
        returns (string memory)
    {
        return rentalProperties[rentalPropertyId].postalCode;
    }

    // Function to get the unit number of a rental property
    function getUnitNumber(
        uint256 rentalPropertyId
    )
        public
        view
        validRentalPropertyId(rentalPropertyId)
        returns (string memory)
    {
        return rentalProperties[rentalPropertyId].unitNumber;
    }

    // Function to get the property type of a rental property
    function getPropertyType(
        uint256 rentalPropertyId
    )
        public
        view
        validRentalPropertyId(rentalPropertyId)
        returns (PropertyType)
    {
        return rentalProperties[rentalPropertyId].propertyType;
    }

    // Function to get the description of a rental property
    function getDescription(
        uint256 rentalPropertyId
    )
        public
        view
        validRentalPropertyId(rentalPropertyId)
        returns (string memory)
    {
        return rentalProperties[rentalPropertyId].description;
    }

    // Function to get the number of tenants in a rental property
    function getNumOfTenants(
        uint256 rentalPropertyId
    ) public view validRentalPropertyId(rentalPropertyId) returns (uint256) {
        return rentalProperties[rentalPropertyId].numOfTenants;
    }

    // Function to get the rental price of a rental property
    function getRentalPrice(
        uint256 rentalPropertyId
    ) public view validRentalPropertyId(rentalPropertyId) returns (uint256) {
        return rentalProperties[rentalPropertyId].rentalPrice;
    }

    // Function to get the lease duration of a rental property
    function getLeaseDuration(
        uint256 rentalPropertyId
    ) public view validRentalPropertyId(rentalPropertyId) returns (uint256) {
        return rentalProperties[rentalPropertyId].leaseDuration;
    }

    // Function to get the landlord of a rental property
    function getLandlord(
        uint256 rentalPropertyId
    ) public view validRentalPropertyId(rentalPropertyId) returns (address) {
        return rentalProperties[rentalPropertyId].landlord;
    }

    // Function to get the update status of a rental property
    function getUpdateStatus(
        uint256 rentalPropertyId
    ) public view validRentalPropertyId(rentalPropertyId) returns (bool) {
        return rentalProperties[rentalPropertyId].updateStatus;
    }

    // Function to get the listed status of a rental property
    function getListedStatus(
        uint256 rentalPropertyId
    ) public view validRentalPropertyId(rentalPropertyId) returns (bool) {
        return rentalProperties[rentalPropertyId].isListed;
    }

    // Function to get the number of rental properties
    function getNumRentalProperty() public view returns (uint256) {
        return numRentalProperty;
    }

    // Function to get the number of listed rental properties
    function getNumListedRentalProperty() public view returns (uint256) {
        return numListedRentalProperty;
    }

    // Function to get the number of unlisted rental properties
    function getNumUnlistedRentalProperty() public view returns (uint256) {
        return numRentalProperty - numListedRentalProperty;
    }

    // Function to get the number of rental properties of a landlord
    function getNumLandlordRentalProperties(
        address landlord
    ) public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < numRentalProperty; i++) {
            if (rentalProperties[i].landlord == landlord) {
                count++;
            }
        }
        return count;
    }

    // Function to get the number of listed rental properties of a landlord
    function getNumLandlordListedRentalProperties(
        address landlord
    ) public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < numRentalProperty; i++) {
            if (rentalProperties[i].landlord == landlord) {
                if (rentalProperties[i].isListed == true) {
                    count++;
                }
            }
        }
        return count;
    }

    // Function to get the number of unlisted rental properties of a landlord
    function getNumLandlordUnlistedRentalProperties(
        address landlord
    ) public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < numRentalProperty; i++) {
            if (rentalProperties[i].landlord == landlord) {
                if (rentalProperties[i].isListed == false) {
                    count++;
                }
            }
        }
        return count;
    }

    // Function to get all the rental properties (listed and unlisted)
    function getAllRentalProperties()
        public
        view
        returns (rentalProperty[] memory)
    {
        rentalProperty[] memory allRentalProperties = new rentalProperty[](
            numRentalProperty
        );
        for (uint256 i = 0; i < numRentalProperty; i++) {
            allRentalProperties[i] = rentalProperties[i];
        }
        return allRentalProperties;
    }

    // Function to get all the listed rental properties
    function getAllListedRentalProperties()
        public
        view
        returns (rentalProperty[] memory)
    {
        rentalProperty[] memory listedRentalProperties = new rentalProperty[](
            numListedRentalProperty
        );
        uint256 index = 0;
        for (uint256 i = 0; i < numRentalProperty; i++) {
            if (rentalProperties[i].isListed == true) {
                listedRentalProperties[index] = rentalProperties[i];
                index++;
            }
        }
        return listedRentalProperties;
    }

    // Function to get all the unlisted rental properties
    function getAllUnlistedRentalProperties()
        public
        view
        returns (rentalProperty[] memory)
    {
        rentalProperty[] memory unlistedRentalProperties = new rentalProperty[](
            numRentalProperty - numListedRentalProperty
        );
        uint256 index = 0;
        for (uint256 i = 0; i < numRentalProperty; i++) {
            if (rentalProperties[i].isListed == false) {
                unlistedRentalProperties[index] = rentalProperties[i];
                index++;
            }
        }
        return unlistedRentalProperties;
    }

    // Function to get all the rental properties of a landlord (listed and unlisted)
    function getLandlordRentalProperties(
        address landlord
    ) public view returns (rentalProperty[] memory) {
        rentalProperty[] memory landlordRentalProperties = new rentalProperty[](
            getNumLandlordRentalProperties(landlord)
        );
        uint256 index = 0;
        for (uint256 i = 0; i < numRentalProperty; i++) {
            if (rentalProperties[i].landlord == landlord) {
                landlordRentalProperties[index] = rentalProperties[i];
                index++;
            }
        }
        return landlordRentalProperties;
    }

    // Function to get all the listed rental properties of a landlord
    function getLandlordListedRentalProperties(
        address landlord
    ) public view returns (rentalProperty[] memory) {
        rentalProperty[]
            memory landlordListedRentalProperties = new rentalProperty[](
                getNumLandlordListedRentalProperties(landlord)
            );
        uint256 index = 0;
        for (uint256 i = 0; i < numRentalProperty; i++) {
            if (rentalProperties[i].landlord == landlord) {
                if (rentalProperties[i].isListed == true) {
                    landlordListedRentalProperties[index] = rentalProperties[i];
                    index++;
                }
            }
        }
        return landlordListedRentalProperties;
    }

    // Function to get all the unlisted rental properties of a landlord
    function getLandlordUnlistedRentalProperties(
        address landlord
    ) public view returns (rentalProperty[] memory) {
        rentalProperty[]
            memory landlordUnlistedRentalProperties = new rentalProperty[](
                getNumLandlordUnlistedRentalProperties(landlord)
            );
        uint256 index = 0;
        for (uint256 i = 0; i < numRentalProperty; i++) {
            if (rentalProperties[i].landlord == landlord) {
                if (rentalProperties[i].isListed == false) {
                    landlordUnlistedRentalProperties[index] = rentalProperties[
                        i
                    ];
                    index++;
                }
            }
        }
        return landlordUnlistedRentalProperties;
    }

    // Function to get payment id of a rental property
    function getPaymentId(
        uint256 rentalPropertyId
    ) public view validRentalPropertyId(rentalPropertyId) returns (uint256) {
        return rentalProperties[rentalPropertyId].paymentId;
    }

    // ################################################### SETTER METHODS ################################################### //

    // Function to set the address of the RentalMarketplace contract
    // Only the owner of the contract can call this function
    // Mainly used for access control
    function setRentalMarketplaceAddress(address _rentalMarketplaceAddress)
        public
        onlyOwner
    {
        rentalMarketplaceAddress = _rentalMarketplaceAddress;
    }

    // Function to update details of a rental property
    function updateRentalProperty(
        uint256 rentalPropertyId,
        string memory newLocation,
        string memory newPostalCode,
        string memory newUnitNumber,
        PropertyType newPropertyType,
        string memory newDescription,
        uint256 newNumOfTenants,
        uint256 newRentalPrice,
        uint256 newLeaseDuration
    )
        public
        landlordOnly(rentalPropertyId)
        validRentalPropertyId(rentalPropertyId)
        validUpdateStatus(rentalPropertyId)
    {   

        // Reason for using require statements here instead of modifiers is to avoid "CompilerError: Stack too deep, try removing local variables"
        // The EVM imposes a limit of 16 local variables, including function parameters and return variables.
        // require new number of tenants to be greater than 0 
        require(newNumOfTenants > 0, "Number of tenants must be greater than 0");
        // require new rental price to be greater than 0
        require(newRentalPrice > 0, "Rental Price must be greater than 0");
        // require new lease duration to be greater than 0
        require(newLeaseDuration > 0, "Lease Duration must be greater than 0");

        // update rental property details
        rentalProperties[rentalPropertyId].location = newLocation;
        rentalProperties[rentalPropertyId].postalCode = newPostalCode;
        rentalProperties[rentalPropertyId].unitNumber = newUnitNumber;
        rentalProperties[rentalPropertyId].propertyType = newPropertyType;
        rentalProperties[rentalPropertyId].description = newDescription;
        rentalProperties[rentalPropertyId].numOfTenants = newNumOfTenants;
        rentalProperties[rentalPropertyId].rentalPrice = newRentalPrice;
        rentalProperties[rentalPropertyId].leaseDuration = newLeaseDuration;

        // Emit event for Rental Property details update
        emit RentalPropertyUpdateDetails(
            rentalPropertyId,
            newLocation,
            newPostalCode,
            newUnitNumber,
            newPropertyType,
            newDescription,
            newNumOfTenants,
            newRentalPrice,
            newLeaseDuration
        );
    }

    // Function to set the new update status of a rental property
    // Not restricted to landlord as this function is used in RentalMarketplace to set the update status to false when there are tenants applications
    function setUpdateStatus(
        uint256 rentalPropertyId,
        bool newUpdateStatus
    ) public validRentalPropertyId(rentalPropertyId) onlyRentalMarketplace() {
        rentalProperties[rentalPropertyId].updateStatus = newUpdateStatus;
    }

    // Function to set the new listed status of a rental property
    // Not restricted to landlord as this function is used in RentalMarketplace to set the listed status to true when the rental property is listed
    function setListedStatus(
        uint256 rentalPropertyId,
        bool newListedStatus
    ) public validRentalPropertyId(rentalPropertyId) onlyRentalMarketplace() {
        rentalProperties[rentalPropertyId].isListed = newListedStatus;
    }

    // Function to increment the number of listed rental properties
    // Not restricted to landlord as this function is used in RentalMarketplace to increment the number of listed rental properties
    function incrementListedRentalProperty() public onlyRentalMarketplace() {
        numListedRentalProperty++;
    }

    // Function to decrement the number of listed rental properties
    // Not restricted to landlord as this function is used in RentalMarketplace to decrement the number of listed rental properties
    function decrementListedRentalProperty() public onlyRentalMarketplace() {
        numListedRentalProperty--;
    }

    // Function to set a payment id to the rental property
    // Not restricted to landlord as this function is used in RentalMarketplace to keep track of protection fee payment/refund
    function setPaymentId(
        uint256 rentalPropertyId,
        uint256 newPaymentId
    ) public validRentalPropertyId(rentalPropertyId) onlyRentalMarketplace() {
        rentalProperties[rentalPropertyId].paymentId = newPaymentId;
    }

    // ################################################### DELETE METHOD ################################################### //

    // Function to delete a rental property
    function deleteRentalProperty(
        uint256 rentalPropertyId
    )
        public
        landlordOnly(rentalPropertyId)
        validRentalPropertyId(rentalPropertyId)
        validUpdateStatus(rentalPropertyId)
    {
        // delete rental property from rentalProperties map
        delete rentalProperties[rentalPropertyId];
        // emit event for Rental Property deletion
        emit RentalPropertyDeleted(rentalPropertyId);
    }
}
