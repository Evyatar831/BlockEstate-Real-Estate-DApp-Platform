async function main() {
  try {
      // Get the contract factory
      const RealEstateContract = await ethers.getContractFactory("RealEstateContract");
      
      // Deploy the contract
      console.log('Deploying RealEstateContract...');
      const realEstate = await RealEstateContract.deploy();
      
      // Wait for deployment to complete
      await realEstate.waitForDeployment();
      
      // Get the contract address
      const address = await realEstate.getAddress();
      
      console.log('RealEstateContract deployed to:', address);
      
      // Verify the deployment
      const deployedCode = await ethers.provider.getCode(address);
      if (deployedCode === '0x') {
          throw new Error('Contract deployment failed - no code at address');
      }
      
      return { success: true, address };
  } catch (error) {
      console.error('Deployment failed:', error);
      process.exit(1);
  }
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
      console.error(error);
      process.exit(1);
  });