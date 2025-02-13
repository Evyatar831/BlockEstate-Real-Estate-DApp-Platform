import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../real-estate-package/components/ui/card';
import { Input } from '../real-estate-package/components/ui/input';
import { Button } from '../real-estate-package/components/ui/button';
import { Alert, AlertDescription } from '../real-estate-package/components/ui/alert';
import { ScrollArea } from '../real-estate-package/components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
    User
} from 'lucide-react';

import { 
    initializeWeb3, 
    initializeContract, 
    connectWallet,
    formatPrice 
} from '../real-estate-package/utilsApp/web3';

import { displayErrorMessage } from '../real-estate-package/utilsApp/errors';

const PropertyListingsPage = () => {
    const navigate = useNavigate();
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

    const initializeAndLoadProperties = async () => {
        try {
            const web3 = await initializeWeb3();
            setWeb3Instance(web3);
            
            const contractInstance = await initializeContract(web3);
            setContract(contractInstance);

            const accounts = await web3.eth.getAccounts();
            if (accounts.length > 0) {
                setAccount(accounts[0]);
            }

            const results = await contractInstance.methods.getAllProperties().call();
            const formattedProperties = results
                .filter(prop => prop.isActive)
                .map(prop => ({
                    ...prop,
                    price: formatPrice(web3, prop.price)
                }));

            setProperties(formattedProperties);
            setFilteredProperties(formattedProperties);
        } catch (err) {
            setError('Failed to load properties. Please try again later.');
            console.error('Property loading error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePurchase = async (property) => {
        if (!account) {
            setError('Please connect your wallet first');
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
    }, []);

    useEffect(() => {
        let filtered = [...properties];

        if (searchTerm) {
            filtered = filtered.filter(property =>
                property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                property.location.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedLocation) {
            filtered = filtered.filter(property =>
                property.location === selectedLocation
            );
        }

        if (priceRange.min) {
            filtered = filtered.filter(property =>
                parseFloat(property.price) >= parseFloat(priceRange.min)
            );
        }
        if (priceRange.max) {
            filtered = filtered.filter(property =>
                parseFloat(property.price) <= parseFloat(priceRange.max)
            );
        }

        setFilteredProperties(filtered);
    }, [properties, searchTerm, selectedLocation, priceRange]);

    const locations = [...new Set(properties.map(prop => prop.location))].sort();

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

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <Card className="max-w-7xl mx-auto">
                <CardHeader>
                    <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
                        <div className="flex items-center gap-4">
                            <Button 
                                onClick={() => navigate('/menu')} 
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Menu
                            </Button>
                            <h1 className="text-2xl font-bold">Available Properties</h1>
                        </div>
                        <Button 
                            onClick={async () => {
                                try {
                                    const address = await connectWallet();
                                    setAccount(address);
                                } catch (err) {
                                    setError('Failed to connect wallet');
                                }
                            }}
                            className="flex items-center gap-2"
                        >
                            <Wallet className="h-4 w-4" />
                            {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet'}
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search properties by title or location..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
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
                                {locations.map(location => (
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
                                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                                />
                                <span>to</span>
                                <Input
                                    type="number"
                                    placeholder="Max Price (ETH)"
                                    value={priceRange.max}
                                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>

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
                                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                                        <Building className="h-12 w-12 text-gray-400" />
                                    </div>
                                    <CardContent className="p-4">
                                        <h3 className="font-semibold text-lg mb-2">{property.title}</h3>
                                        <div className="space-y-2">
                                            <div className="flex items-center text-sm text-gray-500">
                                                <MapPin className="h-4 w-4 mr-2" />
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
                                                    disabled={!account || isPurchasing}
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
            </Card>

            <Dialog open={!!selectedProperty} onOpenChange={() => setSelectedProperty(null)}>
                <DialogContent className="max-w-2xl bg-white max-h-[90vh]">
                    <DialogHeader className="border-b pb-4">
                        <DialogTitle className="text-2xl font-bold text-gray-900">
                            {selectedProperty?.title}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <ScrollArea className="max-h-[calc(90vh-8rem)] px-6">
                        {selectedProperty && (
                            <div className="space-y-6 py-4">
                                <div className="aspect-video bg-blue-50 flex items-center justify-center rounded-lg border border-blue-100">
                                    <Building className="h-20 w-20 text-blue-400" />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <Card className="p-4 bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <MapPin className="h-5 w-5 text-blue-500" />
                                            <div>
                                                <p className="text-sm text-gray-500">Location</p>
                                                <p className="font-medium text-gray-900">{selectedProperty.location}</p>
                                            </div>
                                        </div>
                                    </Card>
                                    
                                    <Card className="p-4 bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <DollarSign className="h-5 w-5 text-green-500" />
                                            <div>
                                                <p className="text-sm text-gray-500">Price</p>
                                                <p className="font-medium text-gray-900">{selectedProperty.price} ETH</p>
                                            </div>
                                        </div>
                                    </Card>
                                    
                                    <Card className="p-4 bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <User className="h-5 w-5 text-purple-500" />
                                            <div>
                                                <p className="text-sm text-gray-500">Owner</p>
                                                <p className="font-medium text-gray-900 break-all">
                                                    {selectedProperty.owner}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                    
                                    <Card className="p-4 bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <Clock className="h-5 w-5 text-orange-500" />
                                            <div>
                                                <p className="text-sm text-gray-500">Listed On</p>
                                                <p className="font-medium text-gray-900">
                                                    {new Date(Number(selectedProperty.createdAt) * 1000).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                                    <div className="text-gray-600 leading-relaxed overflow-y-auto max-h-[200px] pr-2">
                                        {selectedProperty.description}
                                    </div>
                                </div>
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
                                disabled={!account || isPurchasing}
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