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
    const platformFee = 25; // 0.25%

    beforeEach(async function () {
        [owner, seller, buyer] = await ethers.getSigners();
        const RealEstateContract = await ethers.getContractFactory("RealEstateContract");
        contract = await RealEstateContract.deploy();
        await contract.waitForDeployment();
    });

    describe("Property Creation", function () {
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
            ).to.be.revertedWith("Property ID already exists");
        });

        it("should not allow creating a property with empty fields", async function () {
            const price = ethers.parseEther("100");

            await expect(
                contract.connect(seller).createProperty(
                    "",
                    propertyTitle,
                    "Description",
                    price,
                    "Location",
                    []
                )
            ).to.be.revertedWith("Invalid property ID");

            await expect(
                contract.connect(seller).createProperty(
                    propertyId,
                    "",
                    "Description",
                    price,
                    "Location",
                    []
                )
            ).to.be.revertedWith("Title cannot be empty");

            await expect(
                contract.connect(seller).createProperty(
                    propertyId,
                    propertyTitle,
                    "Description",
                    price,
                    "",
                    []
                )
            ).to.be.revertedWith("Location cannot be empty");
        });

        it("should not allow creating a property with zero price", async function () {
            await expect(
                contract.connect(seller).createProperty(
                    propertyId,
                    propertyTitle,
                    "Description",
                    0,
                    "Location",
                    []
                )
            ).to.be.revertedWith("Price must be greater than 0");
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
            ).to.be.revertedWith("Only property owner can perform this action");
        });

        it("should not allow updating to zero price", async function () {
            await expect(
                contract.connect(seller).updateProperty(
                    propertyId,
                    0,
                    true
                )
            ).to.be.revertedWith("Price must be greater than 0");
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
            expect(contractDetails.status).to.equal("Created");

            const property = await contract.properties(propertyId);
            expect(property.owner).to.equal(buyer.address);
            expect(property.isActive).to.be.false;
        });

        it("should transfer payment to seller with platform fee deduction", async function () {
            const initialSellerBalance = await ethers.provider.getBalance(seller.address);
            const initialContractOwnerBalance = await ethers.provider.getBalance(owner.address);
            
            await contract.connect(buyer).createContract(
                contractId,
                propertyId,
                { value: propertyPrice }
            );

            const finalSellerBalance = await ethers.provider.getBalance(seller.address);
            const finalContractOwnerBalance = await ethers.provider.getBalance(owner.address);
            
            // Calculate expected fee and seller amount
            const expectedFee = (propertyPrice * BigInt(platformFee)) / BigInt(10000);
            const expectedSellerAmount = propertyPrice - expectedFee;
            
            // Check that seller received the correct amount (property price minus fee)
            expect(finalSellerBalance - initialSellerBalance).to.equal(expectedSellerAmount);
            
            // Check that contract owner received the fee
            expect(finalContractOwnerBalance - initialContractOwnerBalance).to.equal(expectedFee);
        });

        it("should not allow purchase of inactive property", async function () {
            await contract.connect(seller).updateProperty(
                propertyId,
                propertyPrice,
                false
            );
            
            await expect(
                contract.connect(buyer).createContract(
                    contractId,
                    propertyId,
                    { value: propertyPrice }
                )
            ).to.be.revertedWith("Property is not available for purchase");
        });

        it("should not allow owner to purchase their own property", async function () {
            await expect(
                contract.connect(seller).createContract(
                    contractId,
                    propertyId,
                    { value: propertyPrice }
                )
            ).to.be.revertedWith("Property owner cannot purchase their own property");
        });

        it("should not allow incorrect payment amount", async function () {
            const incorrectPrice = ethers.parseEther("90");
            
            await expect(
                contract.connect(buyer).createContract(
                    contractId,
                    propertyId,
                    { value: incorrectPrice }
                )
            ).to.be.revertedWith("Payment amount must match property price");
        });

        it("should not allow duplicate contract ID", async function () {
            await contract.connect(buyer).createContract(
                contractId,
                propertyId,
                { value: propertyPrice }
            );
            
            // Create another property
            const newPropertyId = "PROP002";
            await contract.connect(seller).createProperty(
                newPropertyId,
                "Another Property",
                "Description",
                propertyPrice,
                "Location",
                []
            );
            
            await expect(
                contract.connect(buyer).createContract(
                    contractId,
                    newPropertyId,
                    { value: propertyPrice }
                )
            ).to.be.revertedWith("Contract ID already exists");
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

    describe("Platform Fee Management", function () {
        it("should allow owner to update platform fee", async function () {
            const newFee = 50; // 0.5%
            await contract.connect(owner).updatePlatformFee(newFee);
            
            const updatedFee = await contract.platformFee();
            expect(updatedFee).to.equal(newFee);
        });
        
        it("should not allow non-owner to update platform fee", async function () {
            await expect(
                contract.connect(seller).updatePlatformFee(50)
            ).to.be.revertedWith("Only contract owner can call this function");
        });
        
        it("should not allow fee greater than 10%", async function () {
            await expect(
                contract.connect(owner).updatePlatformFee(1001)
            ).to.be.revertedWith("Fee cannot exceed 10%");
        });
        
        it("should allow owner to withdraw platform fees", async function () {
            // First create a property and purchase it to generate platform fees
            const propertyPrice = ethers.parseEther("100");
            
            await contract.connect(seller).createProperty(
                propertyId,
                propertyTitle,
                "Description",
                propertyPrice,
                "Location",
                []
            );
            
            // Send some ETH to the contract to simulate fees
            await owner.sendTransaction({
                to: await contract.getAddress(),
                value: ethers.parseEther("1")
            });
            
            const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
            const contractBalance = await ethers.provider.getBalance(await contract.getAddress());
            
            const tx = await contract.connect(owner).withdrawPlatformFees();
            const receipt = await tx.wait();
            
            // Calculate gas used
            const gasUsed = receipt.gasUsed * receipt.gasPrice;
            
            const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
            
            // Owner should receive all contract balance minus gas fees
            expect(finalOwnerBalance).to.be.closeTo(
                initialOwnerBalance + contractBalance - gasUsed,
                ethers.parseEther("0.0001") // Allow for small rounding errors
            );
        });
        
        it("should not allow non-owner to withdraw fees", async function () {
            await expect(
                contract.connect(seller).withdrawPlatformFees()
            ).to.be.revertedWith("Only contract owner can call this function");
        });
        
        it("should revert when trying to withdraw zero fees", async function () {
            await expect(
                contract.connect(owner).withdrawPlatformFees()
            ).to.be.revertedWith("No fees to withdraw");
        });
    });
});