import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../real-estate-package/components/ui/card';
import { Button } from '../real-estate-package/components/ui/button';
import { Alert, AlertDescription } from '../real-estate-package/components/ui/alert';
import { ScrollArea } from '../real-estate-package/components/ui/scroll-area';
import PropertyImage from '../real-estate-package/components/ui/PropertyImage';
import ContractDetails from '../real-estate-package/components/ui/ContractDetails';
import WalletConnectionError from '../real-estate-package/components/ui/WalletConnectionError';
import {
    Building,
    ArrowLeft,
    AlertCircle,
    Loader2,
    Wallet,
    DollarSign,
    MapPin,
    Home,
    Clock,
    Hash
} from 'lucide-react';

import { 
    initializeWeb3, 
    initializeContract, 
    connectWallet,
    formatPrice 
} from '../real-estate-package/utilsApp/web3';

import { displayErrorMessage } from '../real-estate-package/utilsApp/errors';

const PurchasedProperties = () => {
    const navigate = useNavigate();
    const [purchasedProperties, setPurchasedProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [account, setAccount] = useState('');
    const [web3Instance, setWeb3Instance] = useState(null);
    const [contract, setContract] = useState(null);
    const [walletConnectionRequired, setWalletConnectionRequired] = useState(false);
    const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(!!window.ethereum);
    const [connectionPending, setConnectionPending] = useState(false);

    const initializeAndLoadProperties = async () => {
        try {
            setIsLoading(true);
            setError('');
            setConnectionPending(false);
            
            
            if (!window.ethereum) {
                setIsMetaMaskInstalled(false);
                setWalletConnectionRequired(true);
                setIsLoading(false);
                return;
            }
            
            const web3 = await initializeWeb3();
            setWeb3Instance(web3);
            
            const contractInstance = await initializeContract(web3);
            setContract(contractInstance);

            const accounts = await web3.eth.getAccounts();
            if (accounts.length > 0) {
                setAccount(accounts[0]);
                await loadPurchasedProperties(accounts[0], web3, contractInstance);
            } else {
                
                setWalletConnectionRequired(true);
                setIsLoading(false);
                return;
            }
        } catch (err) {
            console.error('Initialization error:', err);
            
            
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

            } else if (err.message && (
                err.message.includes('Contract not found') || 
                err.message.includes('contract') ||
                err.message.includes('Contract initialization error')
            )) {
                setError('Could not connect to smart contract. Please ensure Hardhat is running and the contract is deployed correctly.');
            }
            else {
                setError(displayErrorMessage(err, 'Initialization Error'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    
    const formatPriceValue = (web3Instance, priceInWei) => {
        if (!web3Instance || !priceInWei) return '0';
        try {
            return parseFloat(
                web3Instance.utils.fromWei(priceInWei.toString(), 'ether')
            ).toFixed(2);
        } catch (error) {
            console.error('Price formatting error:', error);
            return '0';
        }
    };

    const loadPurchasedProperties = async (currentAccount, web3, contractInstance) => {
        try {
            
            const allProperties = await contractInstance.methods.getAllProperties().call();
            
            
            const purchased = allProperties
                .filter(prop => 
                    
                    prop.owner.toLowerCase() === currentAccount.toLowerCase() &&
                    
                    !prop.isActive
                )
                .map(prop => {
                    
                    let mainImage = null;
                    if (prop.documents && prop.documents.length > 0) {
                        
                        mainImage = prop.documents[0];
                    }
                    
                    
                    return {
                        ...prop,
                        price: formatPriceValue(web3, prop.price),
                        mainImage,
                        purchaseDate: new Date(Number(prop.createdAt) * 1000).toLocaleDateString()
                    };
                });
            
            setPurchasedProperties(purchased);
        } catch (err) {
            console.error('Error loading purchased properties:', err);
            setError('Failed to load your purchased properties');
        }
    };

    const handleConnectWallet = async () => {
        try {
            setConnectionPending(false);
            const address = await connectWallet();
            setAccount(address);
            setWalletConnectionRequired(false);
            setIsLoading(true);
            await loadPurchasedProperties(address, web3Instance, contract);
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
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        initializeAndLoadProperties();
        
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', () => window.location.reload());
        }
        
        return () => {
            if (window.ethereum) {
                window.ethereum.removeAllListeners('accountsChanged');
                window.ethereum.removeAllListeners('chainChanged');
            }
        };
    }, []);

    const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
            setAccount(accounts[0]);
            setWalletConnectionRequired(false);
            setConnectionPending(false);
            if (web3Instance && contract) {
                loadPurchasedProperties(accounts[0], web3Instance, contract);
            }
        } else {
            setAccount('');
            setPurchasedProperties([]);
            setWalletConnectionRequired(true);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-4 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Loading Your Properties</h2>
                    <p className="text-gray-600">Please wait while we fetch your purchased properties</p>
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
                                onClick={() => navigate('/menu')} 
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Menu
                            </Button>
                            <h1 className="text-2xl font-bold">My Purchased Properties</h1>
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

            {walletConnectionRequired && (
                <WalletConnectionError 
                    onConnect={handleConnectWallet}
                    isMetaMaskInstalled={isMetaMaskInstalled}
                />
            )}

            {!walletConnectionRequired && (
                <Card>
                    <CardContent className="p-6">
                        <ScrollArea className="h-[calc(100vh-240px)]">
                            {purchasedProperties.length === 0 ? (
                                <div className="text-center py-8">
                                    <Home className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-600">You haven't purchased any properties yet</p>
                                    <Button 
                                        onClick={() => navigate('/buy-property')}
                                        className="mt-4"
                                    >
                                        Browse Available Properties
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {purchasedProperties.map((property, index) => (
                                        <Card key={index} className="hover:shadow-lg transition-shadow overflow-hidden">
                                            <div className="aspect-video bg-gray-100 relative">
                                                {property.mainImage ? (
                                                    <PropertyImage 
                                                        storageReference={property.mainImage} 
                                                        alt={property.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full">
                                                        <Building className="h-12 w-12 text-gray-300" />
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                                                    Purchased
                                                </div>
                                            </div>
                                            <CardContent className="p-4">
                                                <h3 className="font-semibold text-lg mb-2 break-words">{property.title}</h3>
                                                <div className="flex items-center mb-2">
                                                    <Hash className="h-4 w-4 text-gray-500 mr-1" />
                                                    <span className="text-sm text-gray-500 break-words">ID: {property.id}</span>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <MapPin className="h-4 w-4 mr-2" />
                                                        {property.location}
                                                    </div>
                                                    <div className="flex items-center text-sm font-medium">
                                                        <DollarSign className="h-4 w-4 mr-2" />
                                                        {property.price} ETH
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <Clock className="h-4 w-4 mr-2" />
                                                        Purchased: {property.purchaseDate}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 mt-4">
                                                    <ContractDetails 
                                                        property={property} 
                                                        formatPrice={(price) => formatPriceValue(web3Instance, price)} 
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default PurchasedProperties;