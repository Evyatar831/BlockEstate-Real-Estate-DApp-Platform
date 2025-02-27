import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../real-estate-package/components/ui/card';
import { Button } from '../real-estate-package/components/ui/button';
import { Alert, AlertDescription } from '../real-estate-package/components/ui/alert';
import WalletConnectionError from '../real-estate-package/components/ui/WalletConnectionError';
import PropertyForm from '../real-estate-package/components/ui/PropertyForm';

import { 
    Building, 
    Wallet, 
    ArrowLeft, 
    AlertCircle, 
    Loader2 
} from 'lucide-react';

import { 
    initializeWeb3, 
    initializeContract, 
    connectWallet, 
    switchToHardhatNetwork
} from '../real-estate-package/utilsApp/web3';

import { displayErrorMessage } from '../real-estate-package/utilsApp/errors';

const RealEstateApp = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [account, setAccount] = useState('');
    const [contract, setContract] = useState(null);
    const [web3Instance, setWeb3Instance] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('Initializing...');
    const [walletConnectionRequired, setWalletConnectionRequired] = useState(false);
    const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(!!window.ethereum);
    const [connectionPending, setConnectionPending] = useState(false);

    const initializeBlockchain = async () => {
        setIsLoading(true);
        setError('');
        setConnectionPending(false);
        
        try {
            
            if (!window.ethereum) {
                setIsMetaMaskInstalled(false);
                setWalletConnectionRequired(true);
                setIsLoading(false);
                return;
            }

            setConnectionStatus('Initializing Web3...');
            const web3 = await initializeWeb3();
            setWeb3Instance(web3);

            const accounts = await web3.eth.getAccounts();
            if (accounts.length > 0) {
                setAccount(accounts[0]);
            } else {
                
                setWalletConnectionRequired(true);
                setIsLoading(false);
                return;
            }

            setConnectionStatus('Checking network...');
            try {
                const chainId = await web3.eth.getChainId();
                
                if (chainId !== 31337) {
                    setConnectionStatus('Switching to Hardhat network...');
                    await switchToHardhatNetwork();
                }
            } catch (networkError) {
                console.error('Network error:', networkError);
                
            }

            setConnectionStatus('Initializing contract...');
            try {
                const contractInstance = await initializeContract(web3);
                setContract(contractInstance);
                setConnectionStatus('Connected');
            } catch (contractError) {
                console.error('Contract initialization error:', contractError);
                setError('Could not connect to smart contract. Please ensure Hardhat is running and the contract is deployed correctly.');
            }
            
        } catch (err) {
            console.error('Initialization error:', err);
            
            // Check if error is related to wallet connection
            if (err.code === -32002 || 
                (err.message && (
                  err.message.includes('already pending') ||
                  err.message.includes('Request already pending')
                ))
            ) {
                setConnectionPending(true);
                setWalletConnectionRequired(true);
            } else if (err.message && (
                err.message.includes('MetaMask') || 
                err.message.includes('wallet') || 
                err.message.includes('connect')
            )) {
                setWalletConnectionRequired(true);
            } else {
                setError(displayErrorMessage(err, 'Initialization Error'));
            }
            
            setConnectionStatus('Connection failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePropertySubmit = async (propertyData) => {
        setIsProcessing(true);
        setError('');
        setSuccess('');
    
        try {
            if (!contract || !account || !web3Instance) {
                throw new Error('Please connect your wallet before listing a property');
            }
    
            
            if (!propertyData || typeof propertyData !== 'object') {
                throw new Error('Invalid property data provided');
            }
    
           
            const properties = await contract.methods.getAllProperties().call();
            const propertyExists = properties.some(prop => 
                prop && prop.id && prop.id.toLowerCase() === propertyData.id.toLowerCase()
            );
    
            if (propertyExists) {
                throw new Error(`Property ID "${propertyData.id}" already exists. Please choose a unique identifier.`);
            }
    
            try {
                console.log('Submitting property with documents:', propertyData.documents);
                
                
                await contract.methods.createProperty(
                    propertyData.id,
                    propertyData.title,
                    propertyData.description || '',
                    propertyData.price,
                    propertyData.location,
                    propertyData.documents || []
                ).send({
                    from: account,
                    gas: 2000000
                });
        
                setSuccess('Property listed successfully!');
            } catch (err) {
                
                if (err.message.includes('Property ID already exists')) {
                    throw new Error(`Property ID "${propertyData.id}" is already registered on the blockchain. Please choose a different ID.`);
                } else if (err.message.includes('insufficient funds')) {
                    throw new Error('Your wallet has insufficient funds to complete this transaction. Please check your balance.');
                } else if (err.message.includes('gas')) {
                    throw new Error('Transaction failed due to gas estimation. Please try again with a different price or contact support.');
                } else if (err.message.includes('user denied')) {
                    throw new Error('Transaction was cancelled. Please try again if you want to list your property.');
                } else {
                    throw new Error(`Failed to list property: ${err.message}`);
                }
            }
    
        } catch (err) {
            console.error('Property listing error:', err);
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConnectWallet = async () => {
        try {
            setConnectionPending(false);
            const address = await connectWallet();
            setAccount(address);
            setWalletConnectionRequired(false);
            
            
            setIsLoading(true);
            await initializeBlockchain();
        } catch (err) {
            console.error('Connection error:', err);
            
            
            if (err.code === -32002 || 
                (err.message && (
                    err.message.includes('already pending') ||
                    err.message.includes('Request already pending') ||
                    err.message.includes('timed out')
                ))
            ) {
                setConnectionPending(true);
            } else {
                setError(displayErrorMessage(err, 'Wallet Connection Error'));
            }
        }
    };

    useEffect(() => {
        initializeBlockchain();
        
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', () => window.location.reload());
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', () => window.location.reload());
            }
        };
    }, []);

    const handleAccountsChanged = async (accounts) => {
        if (accounts.length > 0) {
            setAccount(accounts[0]);
            setWalletConnectionRequired(false);
            setConnectionPending(false);
        } else {
            setAccount('');
            setWalletConnectionRequired(true);
        }
    };

    
    const handleBackClick = (e) => {
        e.preventDefault();
        window.location.href = '/menu';
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-4 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Connecting to Blockchain</h2>
                    <p className="text-gray-600">{connectionStatus}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 min-h-screen">
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <Button 
                                onClick={handleBackClick}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Menu
                            </Button>
                            <h1 className="text-2xl font-bold">List New Property</h1>
                        </div>
                        {!walletConnectionRequired && (
                            <div className="text-sm font-medium text-gray-700">
                                Connected: {account.slice(0, 6)}...{account.slice(-4)}
                            </div>
                        )}
                    </div>
                </CardHeader>
            </Card>

            {error && !walletConnectionRequired && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="ml-2">{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="mb-6 bg-green-50 border-green-200">
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
            )}

            {walletConnectionRequired && (
                <WalletConnectionError 
                    onConnect={handleConnectWallet}
                    isMetaMaskInstalled={isMetaMaskInstalled}
                />
            )}

            {!walletConnectionRequired && (
                <Card className="mb-6">
                    <CardHeader>
                        <h2 className="text-xl font-semibold">Property Details</h2>
                    </CardHeader>
                    <CardContent>
                        <PropertyForm 
                            onSubmit={handlePropertySubmit}
                            contract={contract}
                            isProcessing={isProcessing}
                            web3Instance={web3Instance}
                            account={account}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default RealEstateApp;