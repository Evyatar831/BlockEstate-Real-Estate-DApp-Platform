import React, { memo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../../components/ui/dialog";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { FileText, Clock, MapPin, DollarSign, User, Hash, Image as ImageIcon } from 'lucide-react';
import PropertyImage from './PropertyImage';

const ContractDetails = memo(({ property, formatPrice }) => {
    const PropertyInfo = ({ icon: Icon, label, value }) => (
        <div className="flex items-start gap-3 p-2 rounded-lg bg-white">
            <Icon className="h-5 w-5 mt-0.5 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
                <p className="font-semibold text-gray-700">{label}</p>
                <p className="text-gray-600 break-all">{value}</p>
            </div>
        </div>
    );


    const displayPrice = () => {
        
        if (typeof property.price === 'string') {
            return `${property.price} ETH`;
        } else if (property.price && typeof formatPrice === 'function') {
            
            return `${formatPrice(property.price)} ETH`;
        } else {
            
            return 'Price not available';
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button   variant="link" className="text-blue-600 hover:text-blue-800 p-0 h-auto font-normal">
                    <FileText className="h-4 w-4 mr-1" />
                    View Details
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-gray-50">
                <DialogHeader>
                    <DialogTitle className="text-xl text-gray-900 break-words">{property.title}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] overflow-auto">
                    <div className="space-y-6 p-4">
                        { }
                        {property.mainImage && (
                            <Card className="p-4 overflow-hidden">
                                <h3 className="font-semibold text-lg text-gray-900 mb-4">Property Image</h3>
                                <div className="h-64 w-full rounded-lg overflow-hidden">
                                    <PropertyImage 
                                        storageReference={property.mainImage}
                                        alt={property.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </Card>
                        )}

                        <Card className="p-6 shadow-sm">
                            <h3 className="font-semibold text-lg text-gray-900 mb-4">Property Information</h3>
                            <div className="space-y-4 ">
                                <PropertyInfo
                                    icon={Hash}
                                    label="Property ID"
                                    value={property.id}
                                />
                                <PropertyInfo
                                    icon={MapPin}
                                    label="Location"
                                    value={property.location}
                                />
                                <PropertyInfo
                                    icon={DollarSign}
                                    label="Price"
                                    value={displayPrice()}
                                />
                                <PropertyInfo
                                    icon={User}
                                    label="Owner"
                                    value={property.owner}
                                />
                                <PropertyInfo
                                    icon={Clock}
                                    label="Listed Date"
                                    value={new Date(Number(property.createdAt) * 1000).toLocaleString()}
                                />
                            </div>
                        </Card>

                        <Card className="p-6 shadow-sm">
                            <h3 className="font-semibold text-lg text-gray-900 mb-4">Property Description</h3>
                            <p className="text-gray-600 whitespace-normal break-words ">{property.description}</p>
                        </Card>

                        { }
                        {property.documents && property.documents.length > 1 && (
                            <Card className="p-6 shadow-sm">
                                <h3 className="font-semibold text-lg text-gray-900 mb-4">Additional Documents</h3>
                                <ul className="space-y-2">
                                    {property.documents.slice(1).map((doc, index) => (
                                        <li key={index} className="text-gray-600 flex items-center">
                                            <FileText className="h-4 w-4 mr-2 text-blue-500" />
                                            <span className="truncate">
                                                {doc.includes(':') ? doc.split(':')[0] + ':' + doc.split(':')[1].substring(0, 10) + '...' : doc}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
});

ContractDetails.displayName = 'ContractDetails';

export default ContractDetails;