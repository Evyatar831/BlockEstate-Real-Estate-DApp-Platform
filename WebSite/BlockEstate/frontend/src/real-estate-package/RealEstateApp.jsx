import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Alert, AlertDescription } from './components/ui/alert';
import { Building, Wallet, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { ScrollArea } from './components/ui/scroll-area';
import ContractDetails from './components/ui/ContractDetails';
import PropertyForm from './components/ui/PropertyForm';

// Web3 Utilities
import { 
    initializeWeb3, 
    initializeContract, 
    connectWallet, 
    switchToHardhatNetwork, 
    formatPrice,
    checkPropertyAvailability
} from './utilsApp/web3';

// Error Handling Utilities
import { 
    validatePropertyData,
    validateTransaction,
    calculatePropertyPurchaseGas,
    displayErrorMessage,
    validatePropertyFormData
} from './utilsApp/errors';

const RealEstateApp = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [account, setAccount] = useState('');
    const [contract, setContract] = useState(null);
    const [web3Instance, setWeb3Instance] = useState(null);
    const [properties, setProperties] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('Initializing...');

    const initializeBlockchain = async () => {
        setIsLoading(true);
        setError('');
        
        try {
            setConnectionStatus('Initializing Web3...');
            const web3 = await initializeWeb3();
            setWeb3Instance(web3);

            const accounts = await web3.eth.getAccounts();
            if (accounts.length > 0) {
                setAccount(accounts[0]);
            }

            setConnectionStatus('Checking network...');
            const chainId = await web3.eth.getChainId();
            
            if (chainId !== 31337) {
                setConnectionStatus('Switching to Hardhat network...');
                await switchToHardhatNetwork();
            }

            setConnectionStatus('Initializing contract...');
            const contractInstance = await initializeContract(web3);
            setContract(contractInstance);
            
            await loadProperties(contractInstance);
            setConnectionStatus('Connected');
            
        } catch (err) {
            setError(displayErrorMessage(err, 'Initialization Error'));
            setConnectionStatus('Connection failed');
        } finally {
            setIsLoading(false);
        }
    };

    const loadProperties = async (contractInstance = contract) => {
        try {
            if (!contractInstance) throw new Error('Contract not initialized');
            const results = await contractInstance.methods.getAllProperties().call();
            setProperties(results || []);
        } catch (err) {
            setError(displayErrorMessage(err, 'Failed to load properties'));
        }
    };
    const handlePropertySubmit = async (propertyData) => {
        console.log('Starting property submission:', propertyData);
        setIsProcessing(true);
        setError('');
        setSuccess('');
    
        try {
            if (!contract || !account || !web3Instance) {
                throw new Error('Please ensure your wallet is connected');
            }
    
            // Validate property data
            await validatePropertyData(propertyData, contract);
    
            // Convert price to Wei with proper BigInt handling
            const priceString = propertyData.price.toString();
            const priceInWei = web3Instance.utils.toWei(priceString, 'ether');
            
            // Ensure price is handled as string to avoid BigInt mixing
            const transaction = await contract.methods.createProperty(
                propertyData.id,
                propertyData.title,
                propertyData.description,
                priceInWei.toString(), // Convert to string to avoid BigInt mixing
                propertyData.location,
                []
            ).send({
                from: account,
                gas: 500000,
                gasPrice: (await web3Instance.eth.getGasPrice()).toString() // Convert gas price to string
            });
    
            console.log('Transaction successful:', transaction);
            await loadProperties();
            setSuccess(`Property listed successfully! Transaction hash: ${transaction.transactionHash}`);
        } catch (err) {
            console.error('Property submission error:', err);
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePurchase = async (propertyId) => {
        setIsProcessing(true);
        setError('');
        setSuccess('');
    
        try {
            if (!contract || !account || !web3Instance) {
                throw new Error('Please ensure your wallet is connected');
            }
    
            const allProperties = await contract.methods.getAllProperties().call();
            const property = allProperties.find(p => p.id === propertyId);
            
            if (!property) {
                throw new Error('Property not found');
            }
    
            if (!property.isActive) {
                throw new Error('This property is no longer available for purchase');
            }
    
            if (property.owner.toLowerCase() === account.toLowerCase()) {
                throw new Error('You cannot purchase your own property');
            }
    
            // Ensure we have a valid price value
            if (!property.price) {
                throw new Error('Invalid property price');
            }
    
            const contractId = `${propertyId}-${Date.now()}`;
            const propertyPrice = property.price.toString();
            
            // Check balance using Web3's utils
            const balance = await web3Instance.eth.getBalance(account);
            const balanceInEther = web3Instance.utils.fromWei(balance, 'ether');
            const priceInEther = web3Instance.utils.fromWei(propertyPrice, 'ether');
            
            if (Number(balanceInEther) < Number(priceInEther)) {
                throw new Error('Insufficient funds to complete this purchase');
            }
    
            // Execute the purchase transaction
            const transaction = await contract.methods
                .createContract(contractId, propertyId)
                .send({
                    from: account,
                    value: propertyPrice,
                    gas: '500000',
                    gasPrice: await web3Instance.eth.getGasPrice()
                });
    
            console.log('Purchase transaction successful:', transaction);
            await loadProperties();
            setSuccess(`Purchase completed successfully! Transaction hash: ${transaction.transactionHash}`);
            
        } catch (err) {
            console.error('Purchase error:', err);
            setError(err.message || 'Failed to complete purchase. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            await initializeBlockchain();
        };
        
        init();
        
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
            await loadProperties(contract);
        } else {
            setAccount('');
            setProperties([]);
            setError('Please connect your wallet');
        }
    };

    // Render loading state
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
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold">Real Estate Marketplace</h1>
                        <div className="flex gap-2">
                            <Button 
                                onClick={() => loadProperties()} 
                                disabled={!contract || isProcessing}
                                className="flex items-center gap-2"
                            >
                                <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                            <Button 
                                onClick={async () => {
                                    try {
                                        const address = await connectWallet();
                                        setAccount(address);
                                        await loadProperties(contract);
                                    } catch (err) {
                                        setError(displayErrorMessage(err, 'Wallet Connection Error'));
                                    }
                                }}
                                disabled={isProcessing}
                                className="flex items-center gap-2"
                            >
                                <Wallet className="h-4 w-4" />
                                {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet'}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {error && (
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

            <div className="grid md:grid-cols-2 gap-6">
                <PropertyForm 
                    onSubmit={handlePropertySubmit}
                    contract={contract}
                    isProcessing={isProcessing}
                />

                <Card className="h-[calc(100vh-12rem)]">
                    <CardHeader>
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Building className="h-5 w-5" />
                            Listed Properties
                        </h2>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[calc(100vh-16rem)]">
                            <div className="space-y-4 p-6">
                                {properties.length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">
                                        <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No properties listed yet</p>
                                        <p className="text-sm mt-2">Create your first property listing to get started</p>
                                    </div>
                                ) : (
                                    properties.map((property, index) => (
                                        <PropertyCard
                                            key={index}
                                            property={property}
                                            account={account}
                                            onPurchase={handlePurchase}
                                            isProcessing={isProcessing}
                                            web3Instance={web3Instance}
                                            formatPrice={formatPrice}
                                        />
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const PropertyCard = ({ property, account, onPurchase, isProcessing, web3Instance, formatPrice }) => {
    return (
        <Card className="p-4 hover:shadow-lg transition-shadow duration-200">
            <div className="space-y-3">
                <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg">{property.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        property.isActive 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                    }`}>
                        {property.isActive ? 'Active' : 'Sold'}
                    </span>
                </div>
                
                <div className="text-sm space-y-2">
                    <p className="text-gray-600 italic">{property.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="font-medium text-gray-600">Location</p>
                            <p>{property.location}</p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-600">Price</p>
                            <p>{formatPrice(web3Instance, property.price)} ETH</p>
                        </div>
                    </div>

                    <div>
                        <p className="font-medium text-gray-600">Owner</p>
                        <p className="truncate text-xs">{property.owner}</p>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        <p className="text-xs text-gray-500">
                            Listed: {new Date(Number(property.createdAt) * 1000).toLocaleDateString()}
                        </p>
                        <ContractDetails 
                            property={property}
                            formatPrice={(price) => formatPrice(web3Instance, price)}
                        />
                    </div>
                </div>

                {property.isActive && property.owner.toLowerCase() !== account.toLowerCase() && (
                    <Button 
                        onClick={() => onPurchase(property.id)}
                        disabled={isProcessing}
                        className="w-full mt-4"
                        variant="outline"
                    >
                        {isProcessing ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing Purchase...
                            </div>
                        ) : 'Purchase Property'}
                    </Button>
                )}
            </div>
        </Card>
    );
};

export default RealEstateApp;