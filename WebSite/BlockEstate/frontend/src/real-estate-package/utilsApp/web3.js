
import Web3 from 'web3';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract';

export const initializeWeb3 = async () => {
    if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to use this application.');
    }

    try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        return new Web3(window.ethereum);
    } catch (error) {
        console.error('Web3 initialization error:', error);
        if (error.code === 4001) {
            throw new Error('Please connect your wallet to use this application');
        }
        throw error;
    }
};

export const initializeContract = async (web3) => {
    if (!web3) {
        throw new Error('Web3 instance is required');
    }
    
    try {
        const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
        
        
        const code = await web3.eth.getCode(CONTRACT_ADDRESS);
        if (code === '0x' || code === '0x0') {
            throw new Error('Contract not found at the specified address');
        }
        
        
        if (!contract.methods.createProperty) {
            throw new Error('Contract does not contain required methods');
        }
        
        return contract;
    } catch (error) {
        console.error('Contract initialization error:', error);
        throw new Error(`Failed to initialize contract: ${error.message}`);
    }
};



export const connectWallet = async () => {
    if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
    }

    try {
        
        if (window.ethereum._metamask && window.ethereum._metamask.isUnlocked) {
            const isUnlocked = await window.ethereum._metamask.isUnlocked();
            if (!isUnlocked) {
                throw new Error('MetaMask is locked. Please unlock it first.');
            }
        }

        
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timed out. Please check if MetaMask popup is open.')), 3000)
        );
        
        
        const accountsPromise = window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        
        
        const accounts = await Promise.race([accountsPromise, timeoutPromise]);

        if (!accounts || accounts.length === 0) {
            throw new Error('No accounts found. Please unlock MetaMask.');
        }

        return accounts[0];
    } catch (error) {
        console.error('Wallet connection error:', error);
        
        
        if (error.code === 4001) {
            throw new Error('Connection rejected. Please approve the connection request in MetaMask.');
        } else if (error.code === -32002) {
            throw new Error('Request already pending. Please check MetaMask extension.');
        } else if (error.message.includes('already pending')) {
            throw new Error('Request already pending. Please check MetaMask extension.');
        } else if (error.message.includes('timed out')) {
            throw new Error('Connection timed out. Please check if MetaMask popup is open and respond to it.');
        }
        
        throw new Error('Failed to connect wallet: ' + error.message);
    }
};

export const switchToHardhatNetwork = async () => {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: Web3.utils.toHex(31337) }]
        });
    } catch (switchError) {
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: Web3.utils.toHex(31337),
                        chainName: 'Hardhat Local Network',
                        nativeCurrency: {
                            name: 'ETH',
                            symbol: 'ETH',
                            decimals: 18
                        },
                        rpcUrls: ['http://127.0.0.1:8545'],
                        blockExplorerUrls: null
                    }]
                });
            } catch (addError) {
                throw new Error('Failed to add Hardhat network to MetaMask. Please try again.');
            }
        } else {
            throw new Error('Failed to switch to Hardhat network. Please make sure Hardhat is running.');
        }
    }
};

export const formatPrice = (web3Instance, priceInWei) => {
    if (!web3Instance || !priceInWei) return '0';
    try {
        return web3Instance.utils.fromWei(priceInWei.toString(), 'ether');
    } catch (error) {
        console.error('Price formatting error:', error);
        return '0';
    }
};

export const checkPropertyAvailability = async (propertyId, contract) => {
    try {
        
        const allProperties = await contract.methods.getAllProperties().call();
        
        
        const property = allProperties.find(p => p.id === propertyId);
        
        if (!property) {
            throw new Error('Property not found');
        }

        return {
            exists: true,
            isActive: property.isActive,
            owner: property.owner
        };
    } catch (error) {
        console.error('Property availability check error:', error);
        throw new Error('Failed to check property availability');
    }
};