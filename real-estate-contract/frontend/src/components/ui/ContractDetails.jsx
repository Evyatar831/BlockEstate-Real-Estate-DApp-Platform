import React, { memo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { ExternalLink, FileText, Clock, MapPin, DollarSign, User } from 'lucide-react';

const ContractDetails = memo(({ property, formatPrice }) => {
    const PropertyInfo = ({ icon: Icon, label, value }) => (
        <div className="flex items-start gap-2">
            <Icon className="h-4 w-4 mt-1 text-gray-500" />
            <div>
                <p className="font-medium">{label}</p>
                <p className="text-sm text-gray-600 break-all">{value}</p>
            </div>
        </div>
    );

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="link" className="text-blue-600 hover:text-blue-800 p-0 h-auto font-normal">
                    <FileText className="h-4 w-4 mr-1" />
                    View Details
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl">{property.title}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] overflow-auto">
                    <div className="space-y-6 p-4">
                        <Card className="p-4">
                            <h3 className="font-semibold text-lg mb-4">Property Information</h3>
                            <div className="space-y-4">
                                <PropertyInfo
                                    icon={FileText}
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
                                    value={`${formatPrice(property.price)} ETH`}
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

                        <Card className="p-4">
                            <h3 className="font-semibold text-lg mb-4">Property Description</h3>
                            <p className="text-gray-600 whitespace-pre-wrap">{property.description}</p>
                        </Card>

                        {property.documents && property.documents.length > 0 && (
                            <Card className="p-4">
                                <h3 className="font-semibold text-lg mb-4">Documents</h3>
                                <ul className="space-y-2">
                                    {property.documents.map((doc, index) => (
                                        <li key={index} className="text-sm text-gray-600">
                                            {doc}
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