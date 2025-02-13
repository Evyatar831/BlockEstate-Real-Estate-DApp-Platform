import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Alert, AlertDescription } from './components/ui/alert';
import { Building, Wallet, Plus, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { Textarea } from './components/ui/textarea';
import { ScrollArea } from './components/ui/scroll-area';
import ContractDetails from './components/ui/ContractDetails';
import { initializeWeb3, initializeContract, connectWallet, switchToHardhatNetwork, formatPrice, validatePropertyData } from './utilsApp/web3';
import { displayErrorMessage } from './utilsApp/errors';



const RealEstateApp = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [account, setAccount] = useState('');
    const [contract, setContract] = useState(null);
    const [web3Instance, setWeb3Instance] = useState(null);
    const [properties, setProperties] = useState([]);
    const [error, setError] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('Initializing...');
    const [newProperty, setNewProperty] = useState({
        id: '',
        title: '',
        description: '',
        location: '',
        price: '',
        documents: []
    });

    const loadProperties = async (contractInstance = contract) => {
        try {
            if (!contractInstance) throw new Error('Contract not initialized');
            const results = await contractInstance.methods.getAllProperties().call();
            setProperties(results || []);
        } catch (err) {
            setError(displayErrorMessage(err, 'Failed to load properties'));
        }
    };

    const handleAccountChange = async (accounts) => {
        if (accounts.length > 0) {
            setAccount(accounts[0]);
            await loadProperties(contract);
        } else {
            setAccount('');
            setProperties([]);
            setError('Please connect your wallet');
        }
    };

    const handleChainChange = () => {
        window.location.reload();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewProperty(prev => ({
            ...prev,
            [name]: value
        }));
    };
   
   

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsProcessing(true);
        setError('');

        try {
            if (!contract || !account || !web3Instance) {
                throw new Error('Please ensure your wallet is connected');
            }

            validatePropertyData(newProperty);
            const priceInWei = web3Instance.utils.toWei(newProperty.price, 'ether');

            await contract.methods.createProperty(
                newProperty.id,
                newProperty.title,
                newProperty.description,
                priceInWei,
                newProperty.location,
                []
            ).send({
                from: account,
                gas: 500000
            });

            await loadProperties();
            setNewProperty({
                id: '',
                title: '',
                description: '',
                location: '',
                price: '',
                documents: []
            });
        } catch (err) {
            setError(displayErrorMessage(err, 'Property Creation Error'));
        } finally {
            setIsProcessing(false);
        }
    };


    const handlePurchase = async (propertyId) => {
        setIsProcessing(true);
        setError('');
    
        try {
            if (!contract || !account) {
                throw new Error('Please connect your wallet first');
            }
    
            const property = properties.find(p => p.id === propertyId);
            if (!property) {
                throw new Error('Property not found');
            }
    
            // Check if property is active
            if (!property.isActive) {
                throw new Error('Property is not available for purchase');
            }
    
            // Check if sender is not the owner
            if (property.owner.toLowerCase() === account.toLowerCase()) {
                throw new Error('You cannot purchase your own property');
            }
    
            const contractId = `${propertyId}-${Date.now()}`;
    
            // Convert price to string to avoid BigInt issues
            const propertyPrice = property.price.toString();
            
            // Log transaction details for debugging
            console.log('Transaction details:', {
                contractId,
                propertyId,
                price: propertyPrice,
                from: account
            });
    
            const transaction = await contract.methods
                .createContract(contractId, propertyId)
                .send({
                    from: account,
                    value: propertyPrice,
                    gas: 500000,
                    gasPrice: await web3Instance.eth.getGasPrice()
                });
    
            console.log('Transaction successful:', transaction);
            await loadProperties();
            setError('Purchase completed successfully!');
            
        } catch (err) {
            console.error('Detailed purchase error:', err);
            if (err.message.includes('insufficient funds')) {
                setError('You do not have enough funds to complete this purchase');
            } else if (err.message.includes('Property is not available')) {
                setError('This property is not available for purchase');
            } else if (err.message.includes('own property')) {
                setError('You cannot purchase your own property');
            } else {
                setError('Failed to complete purchase. Please check your wallet and try again.');
            }
        } finally {
            setIsProcessing(false);
        }
    };
   



    const initializeBlockchain = async () => {
        setIsLoading(true);
        setError('');
        
        try {
            setConnectionStatus('Initializing Web3...');
            const web3 = await initializeWeb3();
            setWeb3Instance(web3);
    
            // Get accounts after web3 initialization
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
            console.error('Initialization error:', err);
            setError(displayErrorMessage(err, 'Initialization Error'));
            setConnectionStatus('Connection failed');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            await initializeBlockchain();
            if (window.ethereum) {
                window.ethereum.on('chainChanged', () => {
                    window.location.reload();
                });
                
                window.ethereum.on('accountsChanged', handleAccountChange);
            }
        };
        init();
        
        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountChange);
                window.ethereum.removeListener('chainChanged', handleChainChange);
            }
        };
    }, []);


    



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
                        <h1 className="text-2xl font-bold">Real Estate DApp</h1>
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
                                //onClick={connectWallet}
                                onClick={async () => {
                                    try {
                                        const { address, web3Instance } = await connectWallet();
                                        setAccount(address);
                                        setWeb3Instance(web3Instance);
                                        await loadProperties(contract);
                                    } catch (err) {
                                        setError(err.message);
                                    }
                                }}

                                ///////
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

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            List New Property
                        </h2>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                name="id"
                                placeholder="Property ID"
                                value={newProperty.id}
                                onChange={handleInputChange}
                                required
                                disabled={isProcessing}
                            />
                            <Input
                                name="title"
                                placeholder="Property Title"
                                value={newProperty.title}
                                onChange={handleInputChange}
                                required
                                disabled={isProcessing}
                            />
                            <Textarea
                                name="description"
                                placeholder="Property Description"
                                value={newProperty.description}
                                onChange={handleInputChange}
                                required
                                disabled={isProcessing}
                                className="min-h-[100px]"
                            />
                            <Input
                                name="location"
                                placeholder="Location"
                                value={newProperty.location}
                                onChange={handleInputChange}
                                required
                                disabled={isProcessing}
                            />
                            <Input
                                name="price"
                                type="number"
                                step="0.01"
                                placeholder="Price (ETH)"
                                value={newProperty.price}
                                onChange={handleInputChange}
                                required
                                disabled={isProcessing}
                            />
                            <Button 
                                type="submit" 
                                disabled={isProcessing || !contract}
                                className="w-full"
                            >
                                {isProcessing ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Processing...
                                    </div>
                                ) : 'List Property'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

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
                                        <Card key={index} className="p-4 hover:shadow-lg transition-shadow duration-200">
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
                                                        onClick={() => handlePurchase(property.id)}
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
export { RealEstateApp };  // Named export
export default RealEstateApp;