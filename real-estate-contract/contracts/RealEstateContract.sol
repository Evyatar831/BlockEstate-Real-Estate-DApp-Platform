// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract RealEstateContract {
    
    struct Property {
        string id;              
        string title;           
        string description;     
        uint256 price;         
        string location;        
        address owner;          
        string[] documents;     
        bool isActive;          
        uint256 createdAt;    
       
    }

    struct Contract {
        string propertyId;     
        address buyer;         
        address seller;        
        uint256 value;        
        uint256 createdAt;    
        bool isCompleted;     
        string status;        
    }

    mapping(string => Property) public properties;
    mapping(string => Contract) public contracts;
    string[] public propertyIds;
    mapping(address => bool) public verifiedUsers;
    address public owner;
    uint256 public platformFee;

    event PropertyListed(
        string indexed id,
        string title,
        string location,
        uint256 price,
        address indexed owner,
        uint256 timestamp
    );

    event PropertyUpdated(
        string indexed id,
        uint256 newPrice,
        bool isActive,
        uint256 timestamp
    );

    event PropertySold(
        string indexed propertyId,
        string contractId,
        address indexed buyer,
        address indexed seller,
        uint256 value,
        uint256 timestamp
    );

    event PaymentTransferred(
        string indexed contractId,
        address indexed buyer,
        address indexed seller,
        uint256 value,
        uint256 timestamp
    );

    event PropertyVerified(
        string indexed propertyId,
        address verifier,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can call this function");
        _;
    }

    modifier propertyExists(string memory _propertyId) {
        require(properties[_propertyId].owner != address(0), "Property does not exist");
        _;
    }

    modifier onlyPropertyOwner(string memory _propertyId) {
        require(properties[_propertyId].owner == msg.sender, "Only property owner can perform this action");
        _;
    }

    modifier validPrice(uint256 _price) {
        require(_price > 0, "Price must be greater than 0");
        _;
    }

    
    constructor() {
        owner = msg.sender;
        platformFee = 25; 
    }

    
    function createProperty(
        string memory _id,
        string memory _title,
        string memory _description,
        uint256 _price,
        string memory _location,
        string[] memory _documents
    ) public validPrice(_price) {
        require(bytes(_id).length > 0, "Invalid property ID");
        require(properties[_id].owner == address(0), "Property ID already exists");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_location).length > 0, "Location cannot be empty");

        properties[_id] = Property({
            id: _id,
            title: _title,
            description: _description,
            price: _price,
            location: _location,
            owner: msg.sender,
            documents: _documents,
            isActive: true,
            createdAt: block.timestamp
            
        });

        propertyIds.push(_id);

        emit PropertyListed(
            _id,
            _title,
            _location,
            _price,
            msg.sender,
            block.timestamp
        );
    }

    function createContract(
        string memory _contractId,
        string memory _propertyId
    ) 
    public payable propertyExists(_propertyId) {
        Property storage property = properties[_propertyId];
        require(property.isActive, "Property is not available for purchase");
        require(property.owner != msg.sender, "Property owner cannot purchase their own property");
        require(msg.value == property.price, "Payment amount must match property price");
        require(contracts[_contractId].buyer == address(0), "Contract ID already exists");
       
        
        uint256 fee = (msg.value * platformFee) / 10000;
        uint256 sellerAmount = msg.value - fee;
        
        
        address payable seller = payable(property.owner);

        
        contracts[_contractId] = Contract({
            propertyId: _propertyId,
            buyer: msg.sender,
            seller: seller,
            value: msg.value,
            createdAt: block.timestamp,
            isCompleted: false,
            status: "Created"
        });

        
        property.owner = msg.sender;
        property.isActive = false;

        
        (bool feeSuccess,) = payable(owner).call{value: fee}("");
        require(feeSuccess, "Platform fee transfer failed");

        (bool paymentSuccess,) = seller.call{value: sellerAmount}("");
        require(paymentSuccess, "Payment transfer to seller failed");

        
        emit PropertySold(
            _propertyId,
            _contractId,
            msg.sender,
            seller,
            msg.value,
            block.timestamp
        );

        emit PaymentTransferred(
            _contractId,
            msg.sender,
            seller,
            sellerAmount,
            block.timestamp
        );
    }

    
    function updateProperty(
        string memory _propertyId,
        uint256 _newPrice,
        bool _isActive
    ) public onlyPropertyOwner(_propertyId) propertyExists(_propertyId) validPrice(_newPrice) {
        Property storage property = properties[_propertyId];
        property.price = _newPrice;
        property.isActive = _isActive;

        emit PropertyUpdated(
            _propertyId,
            _newPrice,
            _isActive,
            block.timestamp
        );
    }

   

    
    function getAllProperties() public view returns (Property[] memory) {
        Property[] memory allProperties = new Property[](propertyIds.length);
        
        for (uint i = 0; i < propertyIds.length; i++) {
            allProperties[i] = properties[propertyIds[i]];
        }
        
        return allProperties;
    }

    function getActiveProperties() public view returns (Property[] memory) {
        uint256 activeCount = 0;
        
        for (uint i = 0; i < propertyIds.length; i++) {
            if (properties[propertyIds[i]].isActive) {
                activeCount++;
            }
        }
        
        Property[] memory activeProperties = new Property[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint i = 0; i < propertyIds.length; i++) {
            if (properties[propertyIds[i]].isActive) {
                activeProperties[currentIndex] = properties[propertyIds[i]];
                currentIndex++;
            }
        }
        
        return activeProperties;
    }

    
    function updatePlatformFee(uint256 _newFee) public onlyOwner {
        require(_newFee <= 1000, "Fee cannot exceed 10%");
        platformFee = _newFee;
    }

    function withdrawPlatformFees() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success,) = payable(owner).call{value: balance}("");
        require(success, "Fee withdrawal failed");
    }

    
    receive() external payable {}
}