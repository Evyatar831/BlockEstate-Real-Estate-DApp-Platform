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
    DollarSign,
    MapPin,
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
import { 
    parseStorageReference, 
    createStorageReference,
    getImageUrl 
} from '../real-estate-package/services/storageService';


class PropertyTrackingService {
    constructor() {
      this.STORAGE_KEY = 'listed_properties_tracking';
      this.properties = this.load() || {};
    }
    
   
    trackProperty(propertyId, owner, imageReference) {
      if (!propertyId || !owner) return;
      
      
      
      const existingEntry = this.properties[propertyId];
      if (!existingEntry || existingEntry.owner.toLowerCase() === owner.toLowerCase()) {
        this.properties[propertyId] = {
          owner: owner.toLowerCase(),
          imageReference: imageReference,
          listingDate: Date.now(),
          isListing: true 
        };
        this.save();
      }
    }
    
    
    wasListedBy(propertyId, owner) {
      if (!propertyId || !owner) return false;
      
      const data = this.properties[propertyId];
      return data && 
             data.owner && 
             data.owner.toLowerCase() === owner.toLowerCase() && 
             data.isListing === true; 
    }
    
    
    getImageReference(propertyId) {
      if (!propertyId) return null;
      
      const data = this.properties[propertyId];
      return data && data.isListing ? data.imageReference : null;
    }
    
    
    save() {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.properties));
      } catch (err) {
        console.error('Failed to save property tracking data:', err);
      }
    }
    
    
    load() {
      try {
        const storedData = localStorage.getItem(this.STORAGE_KEY);
        return storedData ? JSON.parse(storedData) : {};
      } catch (err) {
        console.error('Failed to load property tracking data:', err);
        return {};
      }
    }
  }


const propertyTracker = new PropertyTrackingService();

const MyListedProperties = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [account, setAccount] = useState('');
    const [contract, setContract] = useState(null);
    const [web3Instance, setWeb3Instance] = useState(null);
    const [myProperties, setMyProperties] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
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

            try {
                const contractInstance = await initializeContract(web3);
                setContract(contractInstance);
                
                if (accounts.length > 0) {
                    await loadMyProperties(accounts[0], web3, contractInstance);
                }
            } catch (contractError) {
                console.error('Contract initialization error:', contractError);
                setError('Could not connect to smart contract. Please ensure Hardhat is running and the contract is deployed correctly.');
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
            } else {
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

    const loadMyProperties = async (currentAccount, web3, contractInstance) => {
        try {
            
            const allProperties = await contractInstance.methods.getAllProperties().call();
            console.log('All blockchain properties:', allProperties.length);
            
            
            
            const myListedProperties = [];
            
            
            
            const currentlyOwnedActiveProperties = allProperties.filter(prop => 
                prop.owner.toLowerCase() === currentAccount.toLowerCase() && 
                prop.isActive === true
            );
            
            
            currentlyOwnedActiveProperties.forEach(prop => {
                const mainImage = prop.documents && prop.documents.length > 0 ? prop.documents[0] : null;
                propertyTracker.trackProperty(prop.id, currentAccount, mainImage);
                myListedProperties.push(prop);
            });
            
            
            
            const soldProperties = allProperties.filter(prop => 
                
                prop.owner.toLowerCase() !== currentAccount.toLowerCase() && 
                propertyTracker.wasListedBy(prop.id, currentAccount)
            );
            
            
            const combinedProperties = [...myListedProperties, ...soldProperties];
            
            
            const processedProperties = await Promise.all(combinedProperties.map(async prop => {
                
                const isSold = prop.owner.toLowerCase() !== currentAccount.toLowerCase() || !prop.isActive;
                
                
                let mainImage = null;
                if (prop.documents && prop.documents.length > 0) {
                    mainImage = prop.documents[0];
                } else {
                    
                    mainImage = propertyTracker.getImageReference(prop.id);
                }
                
                return {
                    ...prop,
                    price: formatPriceValue(web3, prop.price),
                    mainImage,
                    wasListedByMe: true,
                    isSold,
                    
                    originalOwner: isSold ? currentAccount : null
                };
            }));
            
            console.log('My listed properties total:', processedProperties.length);
            
            
            processedProperties.sort((a, b) => {
                
                if (a.isSold !== b.isSold) {
                    return a.isSold ? 1 : -1;
                }
                
                return Number(b.createdAt) - Number(a.createdAt);
            });
            
            setMyProperties(processedProperties);
        } catch (err) {
            console.error('Error loading properties:', err);
            setError('Failed to load your properties. Please try refreshing the page.');
        }
    };

    const handleConnectWallet = async () => {
        try {
            setConnectionPending(false);
            const address = await connectWallet();
            setAccount(address);
            setWalletConnectionRequired(false);
            setIsLoading(true);
            
            if (web3Instance && contract) {
                await loadMyProperties(address, web3Instance, contract);
            } else {
                
                await initializeBlockchain();
            }
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
            if (web3Instance && contract) {
                await loadMyProperties(accounts[0], web3Instance, contract);
            }
        } else {
            setAccount('');
            setMyProperties([]);
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
                    <p className="text-gray-600">Loading your property listings...</p>
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
                            <h1 className="text-2xl font-bold">My Property Listings</h1>
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
                <Card>
                    <CardHeader>
                        <h2 className="text-xl font-semibold">My Property Listings</h2>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[500px]">
                            {myProperties.length === 0 ? (
                                <div className="text-center py-8">
                                    <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-600">No properties listed yet</p>
                                    <Button 
                                        onClick={() => window.location.href = '/sell-property'} 
                                        className="mt-4"
                                    >
                                        List Your First Property
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {myProperties.map((property, index) => {
                                        
                                        const isSold = property.isSold;
                                        
                                        return (
                                            <Card key={index} className="hover:shadow-lg transition-shadow overflow-hidden">
                                                <div className="aspect-video bg-gray-100 relative">
                                                    {property.mainImage ? (
                                                        <>
                                                        <PropertyImage 
                                                            storageReference={property.mainImage} 
                                                            alt={property.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        {isSold && (
                                                            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                                                                Sold
                                                            </div>
                                                        )}
                                                        </>
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full">
                                                            <Building className="h-12 w-12 text-gray-300" />
                                                            <p className="text-sm text-gray-500 ml-2">No image available</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <CardContent className="p-4">
                                                    <h3 className="font-semibold text-lg mb-2 break-words">{property.title}</h3>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center text-sm text-gray-500 break-words">
                                                            <Hash className="h-4 w-4 mr-2" />
                                                            ID: {property.id}
                                                        </div>
                                                        <div className="flex items-center text-sm text-gray-500">
                                                            <MapPin className="h-4 w-4 mr-2" />
                                                            {property.location}
                                                        </div>
                                                        <div className="flex items-center text-sm font-medium">
                                                            <DollarSign className="h-4 w-4 mr-2" />
                                                            {property.price} ETH
                                                        </div>
                                                        {isSold && (
                                                            <div className="flex items-center text-sm text-gray-500">
                                                                <Clock className="h-4 w-4 mr-2" />
                                                                Sold Date: {new Date(Number(property.createdAt) * 1000).toLocaleDateString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2 mt-4">
                                                        <ContractDetails 
                                                            property={{
                                                                ...property,
                                                                
                                                                owner: property.isSold ? 
                                                                    `${property.owner} (Current Owner)` : 
                                                                    property.owner
                                                            }} 
                                                            formatPrice={(price) => formatPriceValue(web3Instance, price)} 
                                                        />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default MyListedProperties;