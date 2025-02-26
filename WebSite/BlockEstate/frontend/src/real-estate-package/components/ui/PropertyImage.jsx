import React, { useState, useEffect } from 'react';
import { parseStorageReference, getImageUrl } from '../../services/storageService';
import { ImageIcon } from 'lucide-react';

const PropertyImage = ({ storageReference, alt, className = '' }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadImage = async () => {
            if (!storageReference) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                
                const storageInfo = parseStorageReference(storageReference);
                if (!storageInfo) {
                    throw new Error('Invalid storage reference');
                }

                // For IPFS, we can directly use the URL
                // For local storage, we need to retrieve from localStorage
                let url = storageInfo.url;
                
                // If URL is null but we have a valid local storage ID, try to get it directly
                if (!url && storageInfo.storageType === 'local' && storageInfo.id) {
                    console.log('Attempting direct localStorage retrieval for:', storageInfo.id);
                    const localData = localStorage.getItem(storageInfo.id);
                    if (localData) {
                        url = localData;
                    }
                }
                
                if (!url) {
                    throw new Error('Failed to retrieve image URL');
                }
                
                setImageUrl(url);
            } catch (err) {
                console.error('Error loading image:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        loadImage();
    }, [storageReference]);

    if (isLoading) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
                <div className="animate-pulse">
                    <ImageIcon className="h-10 w-10 text-gray-300" />
                </div>
            </div>
        );
    }

    if (error || !imageUrl) {
        return (
            <div className={`flex flex-col items-center justify-center bg-gray-100 rounded-lg ${className}`}>
                <ImageIcon className="h-10 w-10 text-gray-400" />
                <p className="text-xs text-gray-500 mt-2">Image not available</p>
            </div>
        );
    }

    return (
        <img 
            src={imageUrl}
            alt={alt || 'Property image'}
            className={`rounded-lg object-cover ${className}`}
            onError={() => setError('Failed to load image')}
        />
    );
};

export default PropertyImage;