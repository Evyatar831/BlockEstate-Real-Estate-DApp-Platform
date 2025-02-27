import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../real-estate-package/components/ui/card';
import { Input } from '../real-estate-package/components/ui/input';
import { Button } from '../real-estate-package/components/ui/button';
import { Alert, AlertDescription } from '../real-estate-package/components/ui/alert';
import { ScrollArea } from '../real-estate-package/components/ui/scroll-area';
import PropertyImage from '../real-estate-package/components/ui/PropertyImage';
import WalletConnectionError from '../real-estate-package/components/ui/WalletConnectionError';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../real-estate-package/components/ui/dialog";
import {
    Building,
    Search,
    MapPin,
    DollarSign,
    ArrowLeft,
    AlertCircle,
    Loader2,
    Wallet,
    Clock,
    User,
    Hash,
    FileText
} from 'lucide-react';

import { 
    initializeWeb3, 
    initializeContract, 
    connectWallet,
    formatPrice 
} from '../real-estate-package/utilsApp/web3';

import { displayErrorMessage } from '../real-estate-package/utilsApp/errors';
import { sanitizeInput, sanitizeAndValidateInput } from '../real-estate-package/utilsApp/security';

const PropertyListingsPage = () => {
    const [properties, setProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [filteredProperties, setFilteredProperties] = useState([]);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [account, setAccount] = useState('');
    const [web3Instance, setWeb3Instance] = useState(null);
    const [contract, setContract] = useState(null);
    const [walletConnectionRequired, setWalletConnectionRequired] = useState(false);
    const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(!!window.ethereum);

    const ISRAELI_CITIES = [
        'Jerusalem', 'Tel Aviv', 'Haifa', 'Rishon LeZion',
        'Petah Tikva', 'Ashdod', 'Netanya', 'Beer Sheva',
        'Holon', 'Bnei Brak'
    ];

    const initializeAndLoadProperties = async () => {
        try {
            
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
            } else {
                
                setWalletConnectionRequired(true);
                setIsLoading(false);
                return;
            }

            const results = await contractInstance.methods.getAllProperties().call();
            const formattedProperties = results
                .filter(prop => prop.isActive) 
                .map(prop => ({
                    ...prop,
                    price: formatPrice(web3, prop.price),
                    mainImage: prop.documents && prop.documents.length > 0 ? prop.documents[0] : null
                }));

            setProperties(formattedProperties);
            setFilteredProperties(formattedProperties);
        } catch (err) {
            console.error('Initialization error:', err);
            
            
            if (
                !window.ethereum || 
                err.code === -32002 || 
                err.code === 4001 ||
                (err.message && (
                    err.message.includes('MetaMask') || 
                    err.message.includes('wallet') || 
                    err.message.includes('connect') ||
                    err.message.includes('account') ||
                    err.message.includes('ethereum') ||
                    err.message.toLowerCase().includes('user denied') ||
                    err.message.includes('network')
                ))
            ) {
                
                setWalletConnectionRequired(true);
                setError(''); 
            } else if (err.message && (
                err.message.includes('Contract not found') || 
                err.message.includes('contract') ||
                err.message.includes('Contract initialization error')
            )) {
                setError('Could not connect to smart contract. Please ensure Hardhat is running and the contract is deployed correctly.');
            } else {
                setError('Failed to load properties. Please try again later.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnectWallet = async () => {
        try {
            const address = await connectWallet();
            setAccount(address);
            setWalletConnectionRequired(false);
            
            setIsLoading(true);
            await initializeAndLoadProperties();
        } catch (err) {
            console.error('Connection error:', err);
            
            
            if (err.code === -32002 || 
                (err.message && (
                    err.message.includes('already pending') ||
                    err.message.includes('Request already pending') ||
                    err.message.includes('timed out')
                ))
            ) {
                
                setWalletConnectionRequired(true);
            } else {
                setError(displayErrorMessage(err, 'Wallet Connection Error'));
            }
            setIsLoading(false);
        }
    };

    const handlePurchase = async (property) => {
        if (!account) {
            setWalletConnectionRequired(true);
            return;
        }

        if (account.toLowerCase() === property.owner.toLowerCase()) {
            setError('You cannot purchase your own property');
            return;
        }

        setIsPurchasing(true);
        setError('');
        setSuccess('');

        try {
            const contractId = `${property.id}-${Date.now()}`;
            const priceInWei = web3Instance.utils.toWei(property.price.toString(), 'ether');

            await contract.methods.createContract(contractId, property.id)
                .send({
                    from: account,
                    value: priceInWei,
                    gas: 500000
                });

            setSuccess('Property purchased successfully!');
            await initializeAndLoadProperties();
            setSelectedProperty(null);
        } catch (err) {
            setError(displayErrorMessage(err, 'Purchase failed'));
        } finally {
            setIsPurchasing(false);
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
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', () => window.location.reload());
            }
        };
    }, []);

    const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
            setAccount(accounts[0]);
            setWalletConnectionRequired(false);
        } else {
            setAccount('');
            setWalletConnectionRequired(true);
        }
    };

    
    const handleSearchChange = (e) => {
        const sanitizedValue = sanitizeAndValidateInput(e.target.value, 'text', 100);
        setSearchTerm(sanitizedValue);
    };

    
    const handlePriceRangeChange = (field, value) => {
        const sanitizedValue = sanitizeAndValidateInput(value, 'number');
        setPriceRange(prev => ({ ...prev, [field]: sanitizedValue }));
    };

    
    useEffect(() => {
        let filtered = [...properties];

        if (searchTerm) {
            const sanitizedSearchTerm = sanitizeInput(searchTerm).toLowerCase();
            filtered = filtered.filter(property =>
                property.title.toLowerCase().includes(sanitizedSearchTerm) ||
                property.location.toLowerCase().includes(sanitizedSearchTerm)
            );
        }

        if (selectedLocation) {
            filtered = filtered.filter(property =>
                property.location === selectedLocation
            );
        }

        if (priceRange.min) {
            const minPrice = parseFloat(priceRange.min);
            if (!isNaN(minPrice)) {
                filtered = filtered.filter(property =>
                    parseFloat(property.price) >= minPrice
                );
            }
        }
        
        if (priceRange.max) {
            const maxPrice = parseFloat(priceRange.max);
            if (!isNaN(maxPrice)) {
                filtered = filtered.filter(property =>
                    parseFloat(property.price) <= maxPrice
                );
            }
        }

        setFilteredProperties(filtered);
    }, [properties, searchTerm, selectedLocation, priceRange]);

    
    const handleBackClick = (e) => {
        e.preventDefault();
        window.location.href = '/menu';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading available properties...</p>
                </div>
            </div>
        );
    }

    
    const PropertyInfo = ({ icon: Icon, label, value }) => (
        <div className="flex items-start gap-3 p-2 rounded-lg bg-white">
            <Icon className="h-5 w-5 mt-0.5 text-blue-600" />
            <div className="flex-1">
                <p className="font-semibold text-gray-700">{label}</p>
                <p className="text-gray-600 break-all">{value}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <Card className="max-w-7xl mx-auto">
                <CardHeader>
                    <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
                        <div className="flex items-center gap-4">
                            <Button 
                                onClick={handleBackClick} 
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Menu
                            </Button>
                            <h1 className="text-2xl font-bold">Available Properties</h1>
                        </div>
                        {!walletConnectionRequired && (
                            <Button 
                                onClick={handleConnectWallet}
                                className="flex items-center gap-2"
                            >
                                <Wallet className="h-4 w-4" />
                                {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet'}
                            </Button>
                        )}
                    </div>

                    {!walletConnectionRequired && (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search properties by title or location (English Only)..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="pl-9"
                                />
                            </div>

                            <div className="flex flex-col md:flex-row gap-4">
                                <select
                                    value={selectedLocation}
                                    onChange={(e) => setSelectedLocation(e.target.value)}
                                    className="flex-1 p-2 border rounded-md"
                                >
                                    <option value="">All Locations</option>
                                    {ISRAELI_CITIES.map(location => (
                                        <option key={location} value={location}>
                                            {location}
                                        </option>
                                    ))}
                                </select>

                                <div className="flex items-center gap-2 flex-1">
                                    <Input
                                        type="number"
                                        placeholder="Min Price (ETH)"
                                        value={priceRange.min}
                                        onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                                    />
                                    <span>to</span>
                                    <Input
                                        type="number"
                                        placeholder="Max Price (ETH)"
                                        value={priceRange.max}
                                        onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </CardHeader>

                {walletConnectionRequired ? (
                    <WalletConnectionError 
                        onConnect={handleConnectWallet}
                        isMetaMaskInstalled={isMetaMaskInstalled}
                    />
                ) : (
                    <CardContent>
                        {error && (
                            <Alert variant="destructive" className="mb-6">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {success && (
                            <Alert className="mb-6 bg-green-50 border-green-200">
                                <AlertDescription className="text-green-800">{success}</AlertDescription>
                            </Alert>
                        )}

                        <ScrollArea className="h-[calc(100vh-300px)]">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredProperties.map((property, index) => (
                                    <Card key={index} className="hover:shadow-lg transition-shadow">
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
                                        </div>
                                        <CardContent className="p-4">
                                            <h3 className="font-semibold text-lg mb-2 line-clamp-2 h-14 break-words ">{property.title}</h3>
                                            <p className="text-sm text-gray-500 mb-2 line-clamp-2 h-14 overflow-hidden break-all" >ID: {property.id}</p>
                                            <div className="space-y-2">
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                                                    {property.location}
                                                </div>
                                                <div className="flex items-center text-sm font-medium">
                                                    <DollarSign className="h-4 w-4 mr-2" />
                                                    {property.price} ETH
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-4">
                                                <Button 
                                                    className="flex-1"
                                                    variant="outline"
                                                    onClick={() => setSelectedProperty(property)}
                                                >
                                                    View Details
                                                </Button>
                                                {account?.toLowerCase() === property.owner.toLowerCase() ? (
                                                    <Button 
                                                        className="flex-1"
                                                        disabled
                                                        variant="secondary"
                                                    >
                                                        Your Property
                                                    </Button>
                                                ) : (
                                                    <Button 
                                                        className="flex-1"
                                                        onClick={() => handlePurchase(property)}
                                                        disabled={isPurchasing}
                                                    >
                                                        {isPurchasing ? 'Processing...' : 'Purchase'}
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {filteredProperties.length === 0 && (
                                <div className="text-center py-12">
                                    <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900">No properties found</h3>
                                    <p className="text-gray-500">Try adjusting your search criteria</p>
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                )}
            </Card>

            <Dialog open={!!selectedProperty} onOpenChange={() => setSelectedProperty(null)}>
                <DialogContent className="max-w-2xl bg-white max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-900 whitespace-normal break-words">
                            {selectedProperty?.title}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <ScrollArea className="max-h-[calc(90vh-8rem)] overflow-auto">
                        {selectedProperty && (
                            <div className="space-y-6 py-4">
                                <div className="aspect-video bg-blue-50 relative rounded-lg border border-blue-100 overflow-hidden">
                                    {selectedProperty.mainImage ? (
                                        <PropertyImage 
                                            storageReference={selectedProperty.mainImage} 
                                            alt={selectedProperty.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <Building className="h-20 w-20 text-blue-300" />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="space-y-4">
                                    { }
                                    <PropertyInfo
                                        icon={Hash}
                                        label="Property ID"
                                        value={selectedProperty.id}
                                        className="break-all"
                                    />
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <PropertyInfo
                                            icon={MapPin}
                                            label="Location"
                                            value={selectedProperty.location}
                                        />
                                        
                                        <PropertyInfo
                                            icon={DollarSign}
                                            label="Price"
                                            value={`${selectedProperty.price} ETH`}
                                        />
                                        
                                        <PropertyInfo
                                            icon={User}
                                            label="Owner"
                                            value={selectedProperty.owner}
                                        />
                                        
                                        <PropertyInfo
                                            icon={Clock}
                                            label="Listed On"
                                            value={new Date(Number(selectedProperty.createdAt) * 1000).toLocaleDateString()}
                                        />
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                                    <div className="text-gray-600 leading-relaxed overflow-y-auto max-h-[200px] pr-2 whitespace-normal break-words">
                                        {selectedProperty.description}
                                    </div>
                                </div>
                                
                                {selectedProperty.documents && selectedProperty.documents.length > 1 && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="font-medium text-gray-900 mb-2">Additional Documents</h3>
                                        <ul className="space-y-2">
                                            {selectedProperty.documents.slice(1).map((doc, idx) => (
                                                <li key={idx} className="text-gray-600 flex items-center">
                                                    <FileText className="h-4 w-4 mr-2 text-blue-500" />
                                                    <span className="truncate">
                                                        {doc.includes(':') ? doc.split(':')[0] + ':' + doc.split(':')[1].substring(0, 10) + '...' : doc}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </ScrollArea>

                    <div className="flex gap-4 pt-4 border-t mt-4 px-6">
                        <Button
                            className="flex-1"
                            variant="outline"
                            onClick={() => setSelectedProperty(null)}
                        >
                            Close
                        </Button>
                        {account?.toLowerCase() === selectedProperty?.owner.toLowerCase() ? (
                            <Button
                                className="flex-1"
                                disabled
                                variant="secondary"
                            >
                                Your Property
                            </Button>
                        ) : (
                            <Button
                                className="flex-1"
                                onClick={() => handlePurchase(selectedProperty)}
                                disabled={isPurchasing}
                            >
                                {isPurchasing ? 'Processing...' : 'Purchase Property'}
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PropertyListingsPage;