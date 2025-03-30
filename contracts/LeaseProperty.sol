// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LeaseProperty {
    enum PropertyType {
        HDB,
        Condo,
        Landed,
        Other
    }

    struct leaseProperty {
        uint256 leasePropertyId;
        string location;
        string postalCode;
        string unitNumber;
        PropertyType propertyType;
        string description;
        uint256 numOfTenants;
        uint256 leasePrice;
        uint256 leaseDuration;
        address landlord;
        bool updateStatus;
        bool isListed;
        uint256 paymentId;
    }

    uint256 private numLeaseProperty = 0;
    uint256 private numListedLeaseProperty = 0;
    mapping(uint256 => leaseProperty) private leaseProperties;

    address private owner;

    address private leaseMarketplaceAddress;

    constructor() {
        owner = msg.sender;
    }

    event LeasePropertyCreated(
        uint256 leasePropertyId,
        string location,
        string postalCode,
        string unitNumber,
        PropertyType propertyType,
        string description,
        uint256 numOfTenants,
        uint256 leasePrice,
        uint256 leaseDuration,
        address landlord
    );

    event LeasePropertyUpdateDetails(
        uint256 leasePropertyId,
        string newLocation,
        string newPostalCode,
        string newUnitNumber,
        PropertyType newPropertyType,
        string newDescription,
        uint256 newNumOfTenants,
        uint256 newLeasePrice,
        uint256 newLeaseDuration
    );

    event LeasePropertyDeleted(uint256 leasePropertyId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    modifier onlyLeaseMarketplace() {
        require(
            msg.sender == leaseMarketplaceAddress,
            "Only LeaseMarketplace can call this function"
        );
        _;
    }

    modifier landlordOnly(uint256 leasePropertyId) {
        require(
            leaseProperties[leasePropertyId].landlord == msg.sender,
            "Only the landlord can call this function"
        );
        _;
    }

    modifier validLeasePropertyId(uint256 leasePropertyId) {
        require(
            leasePropertyId < numLeaseProperty,
            "Invalid lease property id"
        );
        _;
    }

    modifier validNumOfTenants(uint256 numOfTenants) {
        require(numOfTenants > 0, "Number of tenants must be greater than 0");
        _;
    }

    modifier validLeasePrice(uint256 leasePrice) {
        require(leasePrice > 0, "Lease Price must be greater than 0");
        _;
    }

    modifier validLeaseDuration(uint256 leaseDuration) {
        require(leaseDuration > 0, "Lease Duration must be greater than 0");
        _;
    }

    modifier validUpdateStatus(uint256 leasePropertyId) {
        require(
            leaseProperties[leasePropertyId].updateStatus == true,
            "Lease Property cannot be updated or deleted"
        );
        _;
    }

    function addLeaseProperty(
        string memory _location,
        string memory _postalCode,
        string memory _unitNumber,
        PropertyType _propertyType,
        string memory _description,
        uint256 _numOfTenants,
        uint256 _leasePrice,
        uint256 _leaseDuration
    )
        public
        validNumOfTenants(_numOfTenants)
        validLeasePrice(_leasePrice)
        validLeaseDuration(_leaseDuration)
        returns (uint256)
    {
        leaseProperty memory newLeaseProperty = leaseProperty(
            numLeaseProperty,
            _location,
            _postalCode,
            _unitNumber,
            _propertyType,
            _description,
            _numOfTenants,
            _leasePrice,
            _leaseDuration,
            msg.sender,
            true,
            false,
            0
        );

        uint256 newLeasePropertyId = numLeaseProperty++;
        leaseProperties[newLeasePropertyId] = newLeaseProperty;

        emit LeasePropertyCreated(
            newLeasePropertyId,
            _location,
            _postalCode,
            _unitNumber,
            _propertyType,
            _description,
            _numOfTenants,
            _leasePrice,
            _leaseDuration,
            msg.sender
        );

        return newLeasePropertyId;
    }

    function getLeaseProperty(
        uint256 leasePropertyId
    )
        public
        view
        validLeasePropertyId(leasePropertyId)
        returns (leaseProperty memory)
    {
        return leaseProperties[leasePropertyId];
    }

    function getLocation(
        uint256 leasePropertyId
    )
        public
        view
        validLeasePropertyId(leasePropertyId)
        returns (string memory)
    {
        return leaseProperties[leasePropertyId].location;
    }

    function getPostalCode(
        uint256 leasePropertyId
    )
        public
        view
        validLeasePropertyId(leasePropertyId)
        returns (string memory)
    {
        return leaseProperties[leasePropertyId].postalCode;
    }

    function getUnitNumber(
        uint256 leasePropertyId
    )
        public
        view
        validLeasePropertyId(leasePropertyId)
        returns (string memory)
    {
        return leaseProperties[leasePropertyId].unitNumber;
    }

    function getPropertyType(
        uint256 leasePropertyId
    ) public view validLeasePropertyId(leasePropertyId) returns (PropertyType) {
        return leaseProperties[leasePropertyId].propertyType;
    }

    function getDescription(
        uint256 leasePropertyId
    )
        public
        view
        validLeasePropertyId(leasePropertyId)
        returns (string memory)
    {
        return leaseProperties[leasePropertyId].description;
    }

    function getNumOfTenants(
        uint256 leasePropertyId
    ) public view validLeasePropertyId(leasePropertyId) returns (uint256) {
        return leaseProperties[leasePropertyId].numOfTenants;
    }

    function getLeasePrice(
        uint256 leasePropertyId
    ) public view validLeasePropertyId(leasePropertyId) returns (uint256) {
        return leaseProperties[leasePropertyId].leasePrice;
    }

    function getLeaseDuration(
        uint256 leasePropertyId
    ) public view validLeasePropertyId(leasePropertyId) returns (uint256) {
        return leaseProperties[leasePropertyId].leaseDuration;
    }

    function getLandlord(
        uint256 leasePropertyId
    ) public view validLeasePropertyId(leasePropertyId) returns (address) {
        return leaseProperties[leasePropertyId].landlord;
    }

    function getUpdateStatus(
        uint256 leasePropertyId
    ) public view validLeasePropertyId(leasePropertyId) returns (bool) {
        return leaseProperties[leasePropertyId].updateStatus;
    }

    function getListedStatus(
        uint256 leasePropertyId
    ) public view validLeasePropertyId(leasePropertyId) returns (bool) {
        return leaseProperties[leasePropertyId].isListed;
    }

    function getNumLeaseProperty() public view returns (uint256) {
        return numLeaseProperty;
    }

    function getNumListedLeaseProperty() public view returns (uint256) {
        return numListedLeaseProperty;
    }

    function getNumUnlistedLeaseProperty() public view returns (uint256) {
        return numLeaseProperty - numListedLeaseProperty;
    }

    function getNumLandlordLeaseProperties(
        address landlord
    ) public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < numLeaseProperty; i++) {
            if (leaseProperties[i].landlord == landlord) {
                count++;
            }
        }
        return count;
    }

    function getNumLandlordListedLeaseProperties(
        address landlord
    ) public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < numLeaseProperty; i++) {
            if (leaseProperties[i].landlord == landlord) {
                if (leaseProperties[i].isListed == true) {
                    count++;
                }
            }
        }
        return count;
    }

    function getNumLandlordUnlistedLeaseProperties(
        address landlord
    ) public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < numLeaseProperty; i++) {
            if (leaseProperties[i].landlord == landlord) {
                if (leaseProperties[i].isListed == false) {
                    count++;
                }
            }
        }
        return count;
    }

    function getAllLeaseProperties()
        public
        view
        returns (leaseProperty[] memory)
    {
        leaseProperty[] memory allLeaseProperties = new leaseProperty[](
            numLeaseProperty
        );
        for (uint256 i = 0; i < numLeaseProperty; i++) {
            allLeaseProperties[i] = leaseProperties[i];
        }
        return allLeaseProperties;
    }

    function getAllListedLeaseProperties()
        public
        view
        returns (leaseProperty[] memory)
    {
        leaseProperty[] memory listedLeaseProperties = new leaseProperty[](
            numListedLeaseProperty
        );
        uint256 index = 0;
        for (uint256 i = 0; i < numLeaseProperty; i++) {
            if (leaseProperties[i].isListed == true) {
                listedLeaseProperties[index] = leaseProperties[i];
                index++;
            }
        }
        return listedLeaseProperties;
    }

    function getAllUnlistedLeaseProperties()
        public
        view
        returns (leaseProperty[] memory)
    {
        leaseProperty[] memory unlistedLeaseProperties = new leaseProperty[](
            numLeaseProperty - numListedLeaseProperty
        );
        uint256 index = 0;
        for (uint256 i = 0; i < numLeaseProperty; i++) {
            if (leaseProperties[i].isListed == false) {
                unlistedLeaseProperties[index] = leaseProperties[i];
                index++;
            }
        }
        return unlistedLeaseProperties;
    }

    function getLandlordLeaseProperties(
        address landlord
    ) public view returns (leaseProperty[] memory) {
        leaseProperty[] memory landlordLeaseProperties = new leaseProperty[](
            getNumLandlordLeaseProperties(landlord)
        );
        uint256 index = 0;
        for (uint256 i = 0; i < numLeaseProperty; i++) {
            if (leaseProperties[i].landlord == landlord) {
                landlordLeaseProperties[index] = leaseProperties[i];
                index++;
            }
        }
        return landlordLeaseProperties;
    }

    function getLandlordListedLeaseProperties(
        address landlord
    ) public view returns (leaseProperty[] memory) {
        leaseProperty[]
            memory landlordListedLeaseProperties = new leaseProperty[](
                getNumLandlordListedLeaseProperties(landlord)
            );
        uint256 index = 0;
        for (uint256 i = 0; i < numLeaseProperty; i++) {
            if (leaseProperties[i].landlord == landlord) {
                if (leaseProperties[i].isListed == true) {
                    landlordListedLeaseProperties[index] = leaseProperties[i];
                    index++;
                }
            }
        }
        return landlordListedLeaseProperties;
    }

    function getLandlordUnlistedLeaseProperties(
        address landlord
    ) public view returns (leaseProperty[] memory) {
        leaseProperty[]
            memory landlordUnlistedLeaseProperties = new leaseProperty[](
                getNumLandlordUnlistedLeaseProperties(landlord)
            );
        uint256 index = 0;
        for (uint256 i = 0; i < numLeaseProperty; i++) {
            if (leaseProperties[i].landlord == landlord) {
                if (leaseProperties[i].isListed == false) {
                    landlordUnlistedLeaseProperties[index] = leaseProperties[i];
                    index++;
                }
            }
        }
        return landlordUnlistedLeaseProperties;
    }

    function getPaymentId(
        uint256 leasePropertyId
    ) public view validLeasePropertyId(leasePropertyId) returns (uint256) {
        return leaseProperties[leasePropertyId].paymentId;
    }

    function setLeaseMarketplaceAddress(
        address _leaseMarketplaceAddress
    ) public onlyOwner {
        leaseMarketplaceAddress = _leaseMarketplaceAddress;
    }

    function updateLeaseProperty(
        uint256 leasePropertyId,
        string memory newLocation,
        string memory newPostalCode,
        string memory newUnitNumber,
        PropertyType newPropertyType,
        string memory newDescription,
        uint256 newNumOfTenants,
        uint256 newLeasePrice,
        uint256 newLeaseDuration
    )
        public
        landlordOnly(leasePropertyId)
        validLeasePropertyId(leasePropertyId)
        validUpdateStatus(leasePropertyId)
    {
        require(
            newNumOfTenants > 0,
            "Number of tenants must be greater than 0"
        );

        require(newLeasePrice > 0, "Lease Price must be greater than 0");

        require(newLeaseDuration > 0, "Lease Duration must be greater than 0");

        leaseProperties[leasePropertyId].location = newLocation;
        leaseProperties[leasePropertyId].postalCode = newPostalCode;
        leaseProperties[leasePropertyId].unitNumber = newUnitNumber;
        leaseProperties[leasePropertyId].propertyType = newPropertyType;
        leaseProperties[leasePropertyId].description = newDescription;
        leaseProperties[leasePropertyId].numOfTenants = newNumOfTenants;
        leaseProperties[leasePropertyId].leasePrice = newLeasePrice;
        leaseProperties[leasePropertyId].leaseDuration = newLeaseDuration;

        emit LeasePropertyUpdateDetails(
            leasePropertyId,
            newLocation,
            newPostalCode,
            newUnitNumber,
            newPropertyType,
            newDescription,
            newNumOfTenants,
            newLeasePrice,
            newLeaseDuration
        );
    }

    function setUpdateStatus(
        uint256 leasePropertyId,
        bool newUpdateStatus
    ) public validLeasePropertyId(leasePropertyId) onlyLeaseMarketplace {
        leaseProperties[leasePropertyId].updateStatus = newUpdateStatus;
    }

    function setListedStatus(
        uint256 leasePropertyId,
        bool newListedStatus
    ) public validLeasePropertyId(leasePropertyId) onlyLeaseMarketplace {
        leaseProperties[leasePropertyId].isListed = newListedStatus;
    }

    function incrementListedLeaseProperty() public onlyLeaseMarketplace {
        numListedLeaseProperty++;
    }

    function decrementListedLeaseProperty() public onlyLeaseMarketplace {
        numListedLeaseProperty--;
    }

    function setPaymentId(
        uint256 leasePropertyId,
        uint256 newPaymentId
    ) public validLeasePropertyId(leasePropertyId) onlyLeaseMarketplace {
        leaseProperties[leasePropertyId].paymentId = newPaymentId;
    }

    function deleteLeaseProperty(
        uint256 leasePropertyId
    )
        public
        landlordOnly(leasePropertyId)
        validLeasePropertyId(leasePropertyId)
        validUpdateStatus(leasePropertyId)
    {
        delete leaseProperties[leasePropertyId];

        emit LeasePropertyDeleted(leasePropertyId);
    }
}
