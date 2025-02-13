// src/utils/errors.js
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

export const displayErrorMessage = (error, context = '') => {
    const processedError = handleWeb3Error(error, context);
    console.error(`${processedError.context}: `, processedError.originalError);
    return processedError.message;
};