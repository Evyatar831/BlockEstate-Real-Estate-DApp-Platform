const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("RealEstateContract", function () {
    let contract;
    let owner;
    let seller;
    let buyer;
    const propertyId = "PROP001";
    const propertyTitle = "Luxury Villa";
    const contractId = "CONTRACT001";

    beforeEach(async function () {
        [owner, seller, buyer] = await ethers.getSigners();
        const RealEstateContract = await ethers.getContractFactory("RealEstateContract");
        contract = await RealEstateContract.deploy();
        await contract.waitForDeployment();
    });

    describe("Property Creation", function () {
        it("should emit PropertyListed event on creation", async function () {
            const price = ethers.parseEther("100");
            const location = "Location";
        
            const createPropertyTx = await contract.connect(seller).createProperty(
                propertyId,
                propertyTitle,
                "Description",
                price,
                location,
                []
            );
        
            const receipt = await createPropertyTx.wait();
    const event = receipt.logs[0];
    const eventData = contract.interface.parseLog({ 
        topics: event.topics, 
        data: event.data 
    });
    const args = eventData.args;

    expect(args.id).to.equal(propertyId);
    expect(args.title).to.equal(propertyTitle);
    expect(args.location).to.equal(location);
    expect(args.price).to.equal(price);
    expect(args.owner).to.equal(seller.address);
    expect(args.timestamp).to.be.a('bigint');
        });

        it("should emit PropertyListed event on creation", async function () {
            const price = ethers.parseEther("100");
            const location = "Location";
        
            const createPropertyTx = await contract.connect(seller).createProperty(
                propertyId,
                propertyTitle,
                "Description",
                price,
                location,
                []
            );
        
            const receipt = await createPropertyTx.wait();
            const event = receipt.logs[0];
            const eventData = contract.interface.parseLog({ 
                topics: event.topics, 
                data: event.data 
            });
        
            expect(eventData.args.id).to.equal(propertyId);
            expect(eventData.args.title).to.equal(propertyTitle);
            expect(eventData.args.location).to.equal(location);
            expect(eventData.args.price).to.equal(price);
            expect(eventData.args.owner).to.equal(seller.address);
            expect(eventData.args.timestamp).to.be.greaterThan(0);
        });

        it("should not allow creating a property with an existing ID", async function () {
            const price = ethers.parseEther("100");

            await contract.connect(seller).createProperty(
                propertyId,
                propertyTitle,
                "Description",
                price,
                "Location",
                []
            );

            await expect(
                contract.connect(seller).createProperty(
                    propertyId,
                    "Different Title",
                    "Description",
                    price,
                    "Location",
                    []
                )
            ).to.be.revertedWith("Property already exists");
        });
    });

    describe("Property Updates", function () {
        beforeEach(async function () {
            await contract.connect(seller).createProperty(
                propertyId,
                propertyTitle,
                "Description",
                ethers.parseEther("100"),
                "Location",
                []
            );
        });

        it("should allow owner to update property price and status", async function () {
            const newPrice = ethers.parseEther("150");
            
            await contract.connect(seller).updateProperty(
                propertyId,
                newPrice,
                true
            );

            const property = await contract.properties(propertyId);
            expect(property.price).to.equal(newPrice);
            expect(property.isActive).to.be.true;
        });

        it("should not allow non-owner to update property", async function () {
            await expect(
                contract.connect(buyer).updateProperty(
                    propertyId,
                    ethers.parseEther("150"),
                    true
                )
            ).to.be.revertedWith("Not the property owner");
        });
    });

    describe("Contract Creation and Property Purchase", function () {
        const propertyPrice = ethers.parseEther("100");

        beforeEach(async function () {
            await contract.connect(seller).createProperty(
                propertyId,
                propertyTitle,
                "Description",
                propertyPrice,
                "Location",
                []
            );
        });

        it("should create a contract and transfer property ownership", async function () {
            await contract.connect(buyer).createContract(
                contractId,
                propertyId,
                { value: propertyPrice }
            );

            const contractDetails = await contract.contracts(contractId);
            expect(contractDetails.propertyId).to.equal(propertyId);
            expect(contractDetails.buyer).to.equal(buyer.address);
            expect(contractDetails.seller).to.equal(seller.address);
            expect(contractDetails.value).to.equal(propertyPrice);

            const property = await contract.properties(propertyId);
            expect(property.owner).to.equal(buyer.address);
            expect(property.isActive).to.be.false;
        });

        it("should transfer payment to seller", async function () {
            const initialSellerBalance = await ethers.provider.getBalance(seller.address);
            
            await contract.connect(buyer).createContract(
                contractId,
                propertyId,
                { value: propertyPrice }
            );

            const finalSellerBalance = await ethers.provider.getBalance(seller.address);
            expect(finalSellerBalance - initialSellerBalance).to.equal(propertyPrice);
        });

        it("should not allow incorrect payment amount", async function () {
            const incorrectPrice = ethers.parseEther("90");
            
            await expect(
                contract.connect(buyer).createContract(
                    contractId,
                    propertyId,
                    { value: incorrectPrice }
                )
            ).to.be.revertedWith("Incorrect value sent");
        });
    });

    describe("Property Queries", function () {
        beforeEach(async function () {
            await contract.connect(seller).createProperty(
                "PROP1",
                "Property 1",
                "Description 1",
                ethers.parseEther("100"),
                "Location 1",
                []
            );

            await contract.connect(seller).createProperty(
                "PROP2",
                "Property 2",
                "Description 2",
                ethers.parseEther("200"),
                "Location 2",
                []
            );
        });

        it("should return all properties", async function () {
            const properties = await contract.getAllProperties();
            expect(properties.length).to.equal(2);
            expect(properties[0].id).to.equal("PROP1");
            expect(properties[1].id).to.equal("PROP2");
        });

        it("should return only active properties", async function () {
            await contract.connect(seller).updateProperty(
                "PROP1",
                ethers.parseEther("100"),
                false
            );

            const activeProperties = await contract.getActiveProperties();
            expect(activeProperties.length).to.equal(1);
            expect(activeProperties[0].id).to.equal("PROP2");
        });
    });
});