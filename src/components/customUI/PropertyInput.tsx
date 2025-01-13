import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PropertyInputProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
}

const PropertyInput: React.FC<PropertyInputProps> = ({ id, label, value, onChange }) => {
    return (
        <div className='flex space-x-2 items-center rounded-md border border-input pl-2 w-24'>
            <Label className="text-xs" htmlFor={id}>{label}</Label>
            <Input 
                id={id} 
                placeholder={label} 
                value={value} 
                onChange={e => onChange(e.target.value)}
                className='w-16 h-8 border-none shadow-none pl-0 mb-0.5 focus-visible:ring-transparent' 
            />
        </div>
    );
};

export default PropertyInput;