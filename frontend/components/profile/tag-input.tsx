'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface TagInputProps {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  variant?: 'secondary' | 'outline';
}

export function TagInput({
  label,
  placeholder,
  values,
  onChange,
  disabled,
  variant = 'secondary',
}: TagInputProps) {
  const [newValue, setNewValue] = useState('');

  const addValue = () => {
    if (newValue.trim() && !values.includes(newValue.trim())) {
      onChange([...values, newValue.trim()]);
      setNewValue('');
    }
  };

  const removeValue = (value: string) => {
    onChange(values.filter((v) => v !== value));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addValue())}
          disabled={disabled}
        />
        <Button type="button" variant="outline" size="icon" onClick={addValue} disabled={disabled}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {values.map((value) => (
          <Badge key={value} variant={variant} className="gap-1">
            {value}
            <X className="h-3 w-3 cursor-pointer" onClick={() => removeValue(value)} />
          </Badge>
        ))}
      </div>
    </div>
  );
}
