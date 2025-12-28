'use client';

import { useState, useRef } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ipfsToHttp } from '@/lib/web3/ipfs';

interface ImageUploadProps {
  value?: string; // IPFS hash
  onChange: (file: File | null) => void;
  variant: 'avatar' | 'cover';
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  variant,
  className,
  disabled,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const imageUrl = preview || (value ? ipfsToHttp(value) : null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    onChange(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const isAvatar = variant === 'avatar';

  return (
    <div
      className={cn(
        'relative group cursor-pointer',
        isAvatar ? 'w-24 h-24 rounded-full' : 'w-full h-32 rounded-lg',
        isDragging && 'ring-2 ring-sky ring-offset-2',
        className
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt={isAvatar ? 'Avatar' : 'Cover'}
            className={cn(
              'w-full h-full object-cover',
              isAvatar ? 'rounded-full' : 'rounded-lg'
            )}
          />
          {!disabled && (
            <div
              className={cn(
                'absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center',
                isAvatar ? 'rounded-full' : 'rounded-lg'
              )}
            >
              <Camera className="h-6 w-6 text-white" />
            </div>
          )}
          {!disabled && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); handleRemove(); }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </>
      ) : (
        <div
          className={cn(
            'w-full h-full border-2 border-dashed border-border flex flex-col items-center justify-center bg-muted/50',
            isAvatar ? 'rounded-full' : 'rounded-lg'
          )}
        >
          <Camera className="h-6 w-6 text-muted-foreground mb-1" />
          <span className="text-xs text-muted-foreground">
            {isAvatar ? 'Avatar' : 'Cover Image'}
          </span>
        </div>
      )}
    </div>
  );
}
