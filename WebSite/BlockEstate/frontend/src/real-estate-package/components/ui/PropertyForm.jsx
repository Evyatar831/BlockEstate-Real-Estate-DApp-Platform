import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from './card';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import { Plus, Loader2, ChevronDown } from 'lucide-react';
import {
    sanitizeInput,
    validateSecurity,
    validateFormSecurity,
    validatePropertyField,
    sanitizeAndValidateInput
} from '../../utilsApp/security';

const ISRAELI_CITIES = [
    'Jerusalem', 'Tel Aviv', 'Haifa', 'Rishon LeZion',
    'Petah Tikva', 'Ashdod', 'Netanya', 'Beer Sheva',
    'Holon', 'Bnei Brak'
];

const PropertyForm = ({ onSubmit, contract, isProcessing }) => {
    const [showCities, setShowCities] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [property, setProperty] = useState({
        id: '',
        title: '',
        description: '',
        location: '',
        price: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        let sanitizedValue = sanitizeAndValidateInput(value, 
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
        }

        setProperty(prev => ({
            ...prev,
            [name]: sanitizedValue
        }));

        const error = validatePropertyField(name, sanitizedValue);
        setFormErrors(prev => ({
            ...prev,
            [name]: error
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const fieldErrors = {};
        Object.entries(property).forEach(([field, value]) => {
            const error = validatePropertyField(field, value);
            if (error) fieldErrors[field] = error;
        });

        const securityErrors = validateFormSecurity(property);
        const allErrors = { ...fieldErrors, ...securityErrors };

        if (Object.keys(allErrors).length > 0) {
            setFormErrors(allErrors);
            return;
        }

        try {
            const sanitizedProperty = {
                id: validateSecurity(property.id, 'id'),
                title: validateSecurity(property.title, 'title'),
                description: validateSecurity(property.description, 'description'),
                location: property.location,
                price: validateSecurity(property.price, 'price')
            };

            await onSubmit(sanitizedProperty);

            setProperty({
                id: '',
                title: '',
                description: '',
                location: '',
                price: ''
            });
            setFormErrors({});
        } catch (error) {
            setFormErrors({
                submit: sanitizeInput(error.message) || 'An error occurred during submission'
            });
        }
    };

    const selectCity = (city) => {
        if (ISRAELI_CITIES.includes(city)) {
            setProperty(prev => ({
                ...prev,
                location: city
            }));
            setShowCities(false);
            setFormErrors(prev => ({
                ...prev,
                location: ''
            }));
        }
    };

    return (
        <Card>
            <CardHeader>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    List New Property
                </h2>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Input
                            name="id"
                            placeholder="Property ID (letters, numbers, hyphens only)"
                            value={property.id}
                            onChange={handleInputChange}
                            required
                            disabled={isProcessing}
                            className={formErrors.id ? 'border-red-500' : ''}
                            maxLength={50}
                        />
                        {formErrors.id && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.id}</p>
                        )}
                    </div>

                    <div>
                        <Input
                            name="title"
                            placeholder="Property Title"
                            value={property.title}
                            onChange={handleInputChange}
                            required
                            disabled={isProcessing}
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
                            placeholder="Property Description (4 lines maximum)"
                            value={property.description}
                            onChange={handleInputChange}
                            required
                            disabled={isProcessing}
                            className={`min-h-[100px] resize-none ${formErrors.description ? 'border-red-500' : ''}`}
                            rows={4}
                            maxLength={400}
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
                            onClick={() => !isProcessing && setShowCities(!showCities)}
                        >
                            <Input
                                name="location"
                                placeholder="Select Location"
                                value={property.location}
                                readOnly
                                required
                                disabled={isProcessing}
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
                            disabled={isProcessing}
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
    );
};

export default PropertyForm;