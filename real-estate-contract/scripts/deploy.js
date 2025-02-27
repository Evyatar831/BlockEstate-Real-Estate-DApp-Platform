async function main() {
  try {
      const RealEstateContract = await ethers.getContractFactory("RealEstateContract");
      
      console.log('Deploying RealEstateContract...');
      const realEstate = await RealEstateContract.deploy();
      
      
      await realEstate.waitForDeployment();
      
      
      const address = await realEstate.getAddress();
      
      console.log('RealEstateContract deployed to:', address);
      
      
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


main()
  .then(() => process.exit(0))
  .catch((error) => {
      console.error(error);
      process.exit(1);
  });