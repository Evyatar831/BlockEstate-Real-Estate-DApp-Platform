// src/components/RealEstateIntegration.jsx
import React, { useEffect } from 'react';
import RealEstateApp from '../real-estate-package/RealEstateApp';
import { useNavigate } from 'react-router-dom';
import { Alert , AlertDescription } from '../real-estate-package/components/ui/alert';


import { Card, CardHeader, CardContent } from '../real-estate-package/components//ui/card';

import { AlertCircle, Building } from 'lucide-react';

const RealEstateIntegration = () => {
    const navigate = useNavigate();
    const isAuthenticated = localStorage.getItem('access');

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }

        if (!window.ethereum) {
            console.error('MetaMask is not installed');
            return;
        }

        // Verify Hardhat node connection
        fetch('http://127.0.0.1:8545')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Hardhat node is not running');
                }
            })
            .catch(error => {
                console.error('Failed to connect to Hardhat node:', error);
            });
    }, [isAuthenticated, navigate]);

    if (!window.ethereum) {
        return (
            <div className="container mx-auto p-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        MetaMask is not installed. Please install MetaMask to use this feature.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <Card className="mb-6 shadow-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Building className="h-6 w-6" />
                                <h1 className="text-2xl font-bold">Real Estate DApp</h1>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
                
                <div className="mt-6">
                    <RealEstateApp />
                </div>
            </div>
        </div>
    );
};

export default RealEstateIntegration;