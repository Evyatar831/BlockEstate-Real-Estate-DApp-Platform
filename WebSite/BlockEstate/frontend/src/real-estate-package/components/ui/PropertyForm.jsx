import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import {  Loader2, ChevronDown, Image as ImageIcon } from 'lucide-react';
import {
    validatePropertyField,
    sanitizeAndValidateInput
} from '../../utilsApp/security';
import { uploadImage, createStorageReference } from '../../services/storageService';

const ISRAELI_CITIES = [
    'Jerusalem', 'Tel Aviv', 'Haifa', 'Rishon LeZion',
    'Petah Tikva', 'Ashdod', 'Netanya', 'Beer Sheva',
    'Holon', 'Bnei Brak'
];

const PropertyForm = ({ onSubmit, contract, isProcessing, web3Instance, account }) => {
    const [showCities, setShowCities] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [property, setProperty] = useState({
        id: '',
        title: '',
        description: '',
        location: '',
        price: '',
        image: null,
        imageStorageInfo: null
    });
    const [imagePreview, setImagePreview] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const validateForm = () => {
        const errors = {};
        const fields = ['id', 'title', 'description', 'location', 'price'];
        
        fields.forEach(field => {
            const error = validatePropertyField(field, property[field]);
            if (error) errors[field] = error;
        });

        if (!property.location || !ISRAELI_CITIES.includes(property.location)) {
            errors.location = 'Please select a valid city';
        }

        const price = parseFloat(property.price);
        if (isNaN(price) || price <= 0 || price > 1000000) {
            errors.price = 'Price must be between 0 and 1,000,000 ETH';
        }

        return errors;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        let sanitizedValue = sanitizeAndValidateInput(
            value, 
            name === 'price' ? 'number' : 
            name === 'description' ? 'multiline' : 'text',
            name === 'id' ? 50 : 
            name === 'title' ? 60 : 
            name === 'description' ? 280 : undefined
        );

        
        if (name === 'description') {
            const lines = value.split('\n');
            if (lines.length > 4) {
                sanitizedValue = lines.slice(0, 4).join('\n');
            }
            if (sanitizedValue.length > 280) {
                sanitizedValue = sanitizedValue.substring(0, 280);
            }
        }

        
        if (name === 'price') {
            const numValue = parseFloat(sanitizedValue);
            if (numValue > 1000000) return;
            sanitizedValue = !isNaN(numValue) ? numValue.toString() : '';
        }

        setProperty(prev => ({
            ...prev,
            [name]: sanitizedValue
        }));

        
        if (formErrors[name]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const optimizeImage = async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    
                    let width = img.width;
                    let height = img.height;
                    const maxDimension = 800;

                    if (width > maxDimension || height > maxDimension) {
                        if (width > height) {
                            height = (height / width) * maxDimension;
                            width = maxDimension;
                        } else {
                            width = (width / height) * maxDimension;
                            height = maxDimension;
                        }
                    }

                    
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    
                    
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);

                    
                    const compressedData = canvas.toDataURL('image/jpeg', 0.7);
                    
                    
                    if (compressedData.length > 137000) { // ~100KB
                        reject(new Error('Image is too large after compression'));
                    } else {
                        resolve(compressedData);
                    }
                };
                img.onerror = reject;
                img.src = reader.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            if (file.size > 5242880) { // 5MB limit
                throw new Error('Image size should not exceed 5MB');
            }

            setIsUploadingImage(true);
            
            
            const optimizedImage = await optimizeImage(file);
            
            setImagePreview(optimizedImage);
            
            
            const storageInfo = await uploadImage(optimizedImage);
            
            
            setProperty(prev => ({
                ...prev,
                image: optimizedImage,
                imageStorageInfo: storageInfo
            }));
            
           
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.image;
                return newErrors;
            });
        } catch (error) {
            setFormErrors(prev => ({
                ...prev,
                image: error.message || 'Failed to process image'
            }));
            setProperty(prev => ({ ...prev, image: null, imageStorageInfo: null }));
            setImagePreview('');
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting || isProcessing || isUploadingImage) return;

        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setIsSubmitting(true);

        try {
            if (!web3Instance || !account || !contract) {
                throw new Error('Please connect your wallet first');
            }

            const priceInWei = web3Instance.utils.toWei(property.price.toString(), 'ether');
            
            
            const documents = [];
            if (property.imageStorageInfo) {
                const storageRef = createStorageReference(property.imageStorageInfo);
                documents.push(storageRef);
            }

            const propertyData = {
                id: property.id.trim(),
                title: property.title.trim(),
                description: property.description.trim(),
                location: property.location.trim(),
                price: priceInWei,
                documents: documents
            };

            await onSubmit(propertyData);

            
            setProperty({
                id: '',
                title: '',
                description: '',
                location: '',
                price: '',
                image: null,
                imageStorageInfo: null
            });
            setImagePreview('');
            setFormErrors({});
        } catch (error) {
            setFormErrors(prev => ({
                ...prev,
                submit: error.message
            }));
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const selectCity = (city) => {
        if (ISRAELI_CITIES.includes(city)) {
            setProperty(prev => ({
                ...prev,
                location: city
            }));
            setShowCities(false);
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.location;
                return newErrors;
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Input
                    name="id"
                    placeholder="Property ID"
                    value={property.id}
                    onChange={handleInputChange}
                    required
                    disabled={isProcessing || isSubmitting || isUploadingImage}
                    className={formErrors.id ? 'border-red-500' : ''}
                    maxLength={50}
                />
                {formErrors.id && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.id}</p>
                )}
            </div>

            <div>
                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-gray-50 transition-colors">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="property-image"
                        disabled={isProcessing || isSubmitting || isUploadingImage}
                    />
                    <label
                        htmlFor="property-image"
                        className="cursor-pointer flex flex-col items-center"
                    >
                        {isUploadingImage ? (
                            <div className="flex flex-col items-center">
                                <Loader2 className="h-12 w-12 animate-spin text-gray-400 mb-2" />
                                <span className="text-sm text-gray-600">Uploading to IPFS...</span>
                            </div>
                        ) : imagePreview ? (
                            <div className="relative">
                                <img
                                    src={imagePreview}
                                    alt="Property preview"
                                    className="max-h-48 object-contain mb-2 rounded-lg"
                                />
                                {property.imageStorageInfo?.storageType === 'ipfs' && (
                                    <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-bl-lg rounded-tr-lg">
                                        IPFS
                                    </span>
                                )}
                            </div>
                        ) : (
                            <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                        )}
                        <span className="text-sm text-gray-600">
                            {imagePreview ? 'Change image' : 'Upload property image (max 5MB)'}
                        </span>
                        {property.imageStorageInfo?.storageType === 'ipfs' && (
                            <span className="text-xs text-blue-600 mt-1">
                                CID: {property.imageStorageInfo.cid.substring(0, 20)}...
                            </span>
                        )}
                    </label>
                </div>
                {formErrors.image && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.image}</p>
                )}
            </div>

            <div>
                <Input
                    name="title"
                    placeholder="Property Title (English Only)"
                    value={property.title}
                    onChange={handleInputChange}
                    required
                    disabled={isProcessing || isSubmitting || isUploadingImage}
                    className={formErrors.title ? 'border-red-500' : ''}
                    maxLength={100}
                />
                {formErrors.title && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
                )}
            </div>

            <div>
                <Textarea
                    name="description"
                    placeholder="Property Description (English Only)"
                    value={property.description}
                    onChange={handleInputChange}
                    required
                    disabled={isProcessing || isSubmitting || isUploadingImage}
                    className={`min-h-[100px] resize-none ${formErrors.description ? 'border-red-500' : ''}`}
                    rows={4}
                    maxLength={280}
                    onKeyDown={(e) => {
                        const lines = e.target.value.split('\n');
                        if (e.key === 'Enter' && lines.length >= 4) {
                            e.preventDefault();
                        }
                    }}
                />
                {formErrors.description && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
                )}
            </div>

            <div className="relative">
                <div
                    className="relative cursor-pointer"
                    onClick={() => !isProcessing && !isSubmitting && !isUploadingImage && setShowCities(!showCities)}
                >
                    <Input
                        name="location"
                        placeholder="Select Location"
                        value={property.location}
                        readOnly
                        required
                        disabled={isProcessing || isSubmitting || isUploadingImage}
                        className={formErrors.location ? 'border-red-500' : ''}
                    />
                    <ChevronDown className="absolute right-3 top-3 h-4 w-4" />
                </div>
                {showCities && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                        {ISRAELI_CITIES.map((city) => (
                            <div
                                key={city}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => selectCity(city)}
                            >
                                {city}
                            </div>
                        ))}
                    </div>
                )}
                {formErrors.location && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.location}</p>
                )}
            </div>

            <div>
                <Input
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1000000"
                    placeholder="Price (ETH)"
                    value={property.price}
                    onChange={handleInputChange}
                    required
                    disabled={isProcessing || isSubmitting || isUploadingImage}
                    className={formErrors.price ? 'border-red-500' : ''}
                />
                {formErrors.price && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.price}</p>
                )}
            </div>

            {formErrors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {formErrors.submit}
                </div>
            )}

            <Button 
                type="submit" 
                disabled={isProcessing || isSubmitting || isUploadingImage || !contract}
                className="w-full"
            >
                {isProcessing || isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                    </div>
                ) : isUploadingImage ? (
                    <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading Image...
                    </div>
                ) : 'List Property'}
            </Button>
        </form>
    );
};

export default PropertyForm;