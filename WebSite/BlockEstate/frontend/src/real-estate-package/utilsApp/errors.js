


// Property data validation
export const validatePropertyFormData = (property) => {
    const errors = {};
    
    // ID validation
    if (!property.id || !property.id.trim()) {
        errors.id = 'Property ID is required';
    } else if (property.id.length < 3) {
        errors.id = 'Property ID must be at least 3 characters long';
    } else if (!/^[a-zA-Z0-9-]+$/.test(property.id)) {
        errors.id = 'Property ID can only contain letters, numbers, and hyphens';
    }

    // Title validation
    if (!property.title || !property.title.trim()) {
        errors.title = 'Title is required';
    } else if (property.title.includes('\n')) {
        errors.title = 'Title must be a single line';
    } else if (property.title.length > 100) {
        errors.title = 'Title cannot exceed 100 characters';
    }

    // Description validation
    if (property.description) {
        const descriptionLines = property.description.split('\n').length;
        if (descriptionLines > 4) {
            errors.description = 'Description cannot exceed 4 lines';
        } else if (property.description.length > 500) {
            errors.description = 'Description cannot exceed 500 characters';
        }
    }

    // Location validation
    const validCities = [
        'Jerusalem', 'Tel Aviv', 'Haifa', 'Rishon LeZion',
        'Petah Tikva', 'Ashdod', 'Netanya', 'Beer Sheva',
        'Holon', 'Bnei Brak'
    ];
    
    if (!property.location) {
        errors.location = 'Location is required';
    } else if (!validCities.includes(property.location)) {
        errors.location = 'Please select a valid city from the list';
    }

    // Price validation
    if (!property.price) {
        errors.price = 'Price is required';
    } else {
        const price = parseFloat(property.price);
        if (isNaN(price)) {
            errors.price = 'Please enter a valid number';
        } else if (price <= 0) {
            errors.price = 'Price must be greater than 0';
        } else if (price > 1000000) {
            errors.price = 'Price exceeds maximum allowed value';
        }
    }

    return errors;
};

// Gas calculation and validation
export const calculatePropertyPurchaseGas = async (contract, propertyId, contractId, account, value) => {
    try {
        const gasEstimate = await contract.methods
            .createContract(contractId, propertyId)
            .estimateGas({
                from: account,
                value: value
            });

        return Math.ceil(gasEstimate * 1.2); // Add 20% buffer
    } catch (error) {
        if (error.message.includes('Property must be verified')) {
            throw new Error('This property must be verified before purchase');
        }
        throw new Error('Failed to estimate gas for the transaction');
    }
};

// Transaction validation
export const validateTransaction = async (web3, account, value) => {
    try {
        const balance = await web3.eth.getBalance(account);
        const gasPrice = await web3.eth.getGasPrice();
        const estimatedGas = '500000'; // Safe estimate
        
        const totalCost = web3.utils.toBN(value).add(
            web3.utils.toBN(gasPrice).mul(web3.utils.toBN(estimatedGas))
        );
        
        if (web3.utils.toBN(balance).lt(totalCost)) {
            throw new Error('Insufficient funds for transaction and gas fees');
        }
        
        return {
            gasPrice,
            estimatedGas
        };
    } catch (error) {
        throw new Error(`Transaction validation failed: ${error.message}`);
    }
};

// Property validation 
export const validatePropertyData = async (property, contract) => {
    // Basic data presence checks
    if (!property.id?.trim()) {
        throw new Error('Property ID is required');
    }
    if (!property.title?.trim()) {
        throw new Error('Property title is required');
    }
    if (!property.location?.trim()) {
        throw new Error('Property location is required');
    }
    if (!property.price || isNaN(property.price) || parseFloat(property.price) <= 0) {
        throw new Error('Please enter a valid price greater than 0');
    }

    try {
        // Check for existing property
        if (contract) {
            const properties = await contract.methods.getAllProperties().call();
            const exists = properties.some(p => p.id === property.id);
            if (exists) {
                throw new Error('Property ID already exists');
            }
        }

        // Validate price format
        const price = parseFloat(property.price);
        if (price > 1000000) {
            throw new Error('Price cannot exceed 1,000,000 ETH');
        }

        // Validate description length
        if (property.description) {
            const lines = property.description.split('\n');
            if (lines.length > 4) {
                throw new Error('Description cannot exceed 4 lines');
            }
        }

        return true;
    } catch (error) {
        throw new Error(error.message || 'Failed to validate property data');
    }
};

// Web3 error handling
export const handleWeb3Error = (error, context = '') => {
    let errorMessage = 'An unexpected error occurred.';
    
    if (typeof error === 'string') {
        errorMessage = error;
    } else if (error.message) {
        if (error.message.includes('Internal JSON-RPC error')) {
            if (error.message.includes('insufficient funds')) {
                errorMessage = 'Your wallet has insufficient funds to complete this transaction.';
            } else if (error.message.includes('gas required exceeds allowance')) {
                errorMessage = 'The transaction requires more gas than currently allowed. Please try with a lower price.';
            } else if (error.message.includes('nonce too low')) {
                errorMessage = 'Transaction sequence error: Please reset your MetaMask account or wait for pending transactions.';
            } else {
                errorMessage = 'A network error occurred. Please check your connection and try again.';
            }
        } else if (error.message.includes('User denied')) {
            errorMessage = 'Transaction was cancelled by the user.';
        } else if (error.message.includes('MetaMask')) {
            errorMessage = 'Please ensure MetaMask is installed and unlocked.';
        }
    }
    
    return {
        message: errorMessage,
        context: context,
        originalError: error
    };
};

// Display error message
export const displayErrorMessage = (error, context = '') => {
    const processedError = handleWeb3Error(error, context);
    console.error(`${processedError.context}: `, processedError.originalError);
    return processedError.message;
};