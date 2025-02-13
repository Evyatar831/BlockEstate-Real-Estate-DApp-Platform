// DEPLOYMENT  for  smart contract

//Environment Setup
//First, navigate to the smart contract directory and install the required dependencies:

cd real-estate-contract
npm install



//TERMINAL A- deploy test blockchain
cd "C:\Users\evyatar\Documents\Smart contract\real-estate-contract"
npx hardhat node


//TERMINAL B-  deploy -RealEstateContract
cd "C:\Users\evyatar\Documents\Smart contract\real-estate-contract"
npx hardhat run scripts/deploy.js --network localhost

// FRONTEND-   run real estate app only
cd "C:\Users\evyatar\Documents\Smart contract\real-estate-contract\frontend"
npm run dev