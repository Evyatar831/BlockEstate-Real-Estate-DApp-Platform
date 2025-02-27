import React, { useState, useEffect } from 'react';
import { parseStorageReference, getImageUrl } from '../../services/storageService';
import { ImageIcon } from 'lucide-react';

const PropertyImage = ({ storageReference, alt, className = '' }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const defaultPropertyImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23CBD5E0' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'%3E%3C/path%3E%3Cpolyline points='9 22 9 12 15 12 15 22'%3E%3C/polyline%3E%3C/svg%3E";
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

                
                
                let url = storageInfo.url;
                
                
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
                console.warn('NOTE: Image loading failures may be related to localStorage limitations. Images stored via localStorage are not shared between different browsers or private browsing sessions.');
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        loadImage();
    }, [storageReference]);

    if (isLoading) {
        return (
            <div className={`flex flex-col items-center justify-center bg-gray-50 ${className}`}>
            <img 
                src={defaultPropertyImage} 
                alt={alt || 'Property image'} 
                className="w-16 h-16 opacity-70"
            />
            <p className="text-xs text-gray-400 mt-2">Image not available</p>
    
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