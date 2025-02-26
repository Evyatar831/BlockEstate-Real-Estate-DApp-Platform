import React from 'react';
import { AlertCircle, Wallet, Eye, RefreshCcw } from 'lucide-react';
import { Alert, AlertDescription } from './alert';
import { Button } from './button';
import { cn } from '../../lib/utils';


let connectionAttemptInProgress = false;

const WalletConnectionError = ({
  onConnect,
  isMetaMaskInstalled = !!window.ethereum,
  className
}) => {
  const [connectionPending, setConnectionPending] = React.useState(false);

  const handleConnectWallet = async () => {
    
    if (connectionAttemptInProgress) {
      setConnectionPending(true);
      return;
    }
    
    try {
      connectionAttemptInProgress = true;
      await onConnect();
    } catch (err) {
      
      if (err.message && (
        err.message.includes('Request of type requestPermissions already pending') ||
        err.message.includes('already processing') ||
        err.message.includes('Request already pending')
      )) {
        setConnectionPending(true);
      }
    } finally {
      
      setTimeout(() => {
        connectionAttemptInProgress = false;
      }, 1000);
    }
  };

  const openMetaMaskExtension = () => {
   
    
    
    try {
      
      if (window.ethereum && window.ethereum.isMetaMask) {
        
        if (window.ethereum._metamask && typeof window.ethereum._metamask.openPopup === 'function') {
          window.ethereum._metamask.openPopup();
          return;
        }
      }
      
      
      alert("Please check your browser toolbar for the MetaMask extension icon and click on it to open the pending request.");
      
      
    } catch (error) {
      console.error("Failed to open MetaMask:", error);
      
      alert("Please manually open your MetaMask extension to handle the pending connection request.");
    }
  };

  
  const refreshPage = () => {
    window.location.reload();
  };
  
  return (
    <Alert 
      className={cn(
        "bg-amber-50 border-amber-200 mb-6",
        className
      )}
    >
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
        <div className="flex-1">
          {!isMetaMaskInstalled ? (
            <>
              <h3 className="font-medium text-amber-800 mb-1">MetaMask Not Installed</h3>
              <AlertDescription className="text-amber-700">
                <p className="mb-3">
                  To interact with our blockchain features, you need to install the MetaMask wallet extension.
                </p>
                <div className="flex gap-2 mt-2">
                  <Button 
                    onClick={() => window.open('https://metamask.io/download/', '_blank')}
                    className="bg-amber-600 hover:bg-amber-700 flex items-center gap-2"
                  >
                    <Wallet className="h-4 w-4" />
                    Install MetaMask
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/menu'}
                    className="border-amber-600 text-amber-700 hover:bg-amber-100"
                  >
                    Back to Menu
                  </Button>
                </div>
              </AlertDescription>
            </>
          ) : connectionPending ? (
            <>
              <h3 className="font-medium text-amber-800 mb-1">MetaMask Connection Pending</h3>
              <AlertDescription className="text-amber-700">
                <p className="mb-3">
                  There's already a connection request pending in MetaMask. Please check your MetaMask extension popup.
                </p>
                <div className="flex gap-2 mt-2">
                  <Button 
                    onClick={openMetaMaskExtension}
                    className="bg-amber-600 hover:bg-amber-700 flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Open MetaMask
                  </Button>
                  <Button 
                    onClick={refreshPage}
                    className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Refresh Page
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/menu'}
                    className="border-amber-600 text-amber-700 hover:bg-amber-100"
                  >
                    Back to Menu
                  </Button>
                </div>
              </AlertDescription>
            </>
          ) : (
            <>
              <h3 className="font-medium text-amber-800 mb-1">Wallet Not Connected</h3>
              <AlertDescription className="text-amber-700">
                <p className="mb-3">
                  Please connect your MetaMask wallet to access blockchain features for real estate transactions.
                </p>
                <div className="flex gap-2 mt-2">
                  <Button 
                    onClick={handleConnectWallet}
                    className="bg-amber-600 hover:bg-amber-700 flex items-center gap-2"
                  >
                    <Wallet className="h-4 w-4" />
                    Connect Wallet
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/menu'}
                    className="border-amber-600 text-amber-700 hover:bg-amber-100"
                  >
                    Back to Menu
                  </Button>
                </div>
              </AlertDescription>
            </>
          )}
        </div>
      </div>
    </Alert>
  );
};

export default WalletConnectionError;