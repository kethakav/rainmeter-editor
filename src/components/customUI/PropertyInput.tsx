import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface PropertyInputProps {
    id: string;
    label: string;
    icon?: LucideIcon;
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

const PropertyInput: React.FC<PropertyInputProps> = ({ id, label, icon: Icon, value, onChange, className }) => {
    return (
        <TooltipProvider>
            <div className={`flex space-x-2 items-center rounded-md border border-input pl-2 w-24 ${className}`}>
            {Icon ? (
                <div>
                    <Tooltip>
                        <TooltipTrigger>
                            <Icon className="text-xs h-3.5 w-3.5 mt-1.5" />
                        </TooltipTrigger>
                        <TooltipContent>{label}</TooltipContent>
                    </Tooltip>
                </div>
            ) : (
                <Label className="text-xs" htmlFor={id}>{label}</Label>
            )}
            <Input 
                id={id} 
                placeholder={label} 
                value={value} 
                onChange={e => onChange(e.target.value)}
                className='w-16 h-8 border-none shadow-none pl-0 mb-0.5 focus-visible:ring-transparent' 
            />
        </div>
        </TooltipProvider>
        
    );
};

export default PropertyInput;