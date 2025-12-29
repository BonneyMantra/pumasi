'use client';

import { useState, useEffect } from 'react';
import { Upload, File, X, Loader2, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSubmitDelivery } from '@/lib/hooks/use-job-workflow';
import { useTranslation } from '@/lib/i18n';
import { useDemoData } from '@/lib/hooks/use-demo-data';

interface DeliveryFormProps {
  jobId: string;
  milestoneId?: string;
}

interface FileItem {
  id: string;
  name: string;
  size: number;
  uploading: boolean;
  uri?: string;
}

export function DeliveryForm({ jobId, milestoneId }: DeliveryFormProps) {
  const { t } = useTranslation();
  const demoData = useDemoData();
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const { submit, isSubmitting, isSuccess } = useSubmitDelivery(jobId);

  // Initialize with demo data and update when template changes
  useEffect(() => {
    if (demoData.delivery.description) {
      setDescription(demoData.delivery.description);
      setNotes(demoData.delivery.notes);
    }
  }, [demoData.delivery.description, demoData.delivery.notes]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    for (const file of selectedFiles) {
      const fileItem: FileItem = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        uploading: true,
      };

      setFiles((prev) => [...prev, fileItem]);

      try {
        // Upload to IPFS via local API
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);

        const response = await fetch('/api/ipfs/file', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const result = await response.json();
        setFiles((prev) =>
          prev.map((f) => (f.id === fileItem.id ? { ...f, uploading: false, uri: result.url } : f))
        );
      } catch (error) {
        console.error('IPFS upload error:', error);
        // Remove failed file
        setFiles((prev) => prev.filter((f) => f.id !== fileItem.id));
      }
    }

    // Reset input
    e.target.value = '';
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async () => {
    const fileURIs = files.filter((f) => f.uri).map((f) => f.uri!);
    await submit({
      description,
      fileURIs,
      notes,
      milestoneId,
    });
  };

  const canSubmit = description.trim() && files.length > 0 && !files.some((f) => f.uploading);

  if (isSuccess) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green" />
          <h3 className="text-xl font-semibold mb-2">{t('deliveryForm.successTitle')}</h3>
          <p className="text-muted-foreground">{t('deliveryForm.successMessage')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('deliveryForm.title')}</CardTitle>
        <CardDescription>{t('deliveryForm.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">{t('deliveryForm.descriptionLabel')}</Label>
          <Textarea
            id="description"
            placeholder={t('deliveryForm.descriptionPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label>{t('deliveryForm.filesLabel')}</Label>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              {t('deliveryForm.dragOrClick')}
            </p>
            <Input
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <Button variant="outline" asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                {t('deliveryForm.selectFiles')}
              </label>
            </Button>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2 mt-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <File className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-sky" />
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 text-green" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">{t('deliveryForm.notesLabel')}</Label>
          <Textarea
            id="notes"
            placeholder={t('deliveryForm.notesPlaceholder')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        {/* Submit Button */}
        <Button
          className="w-full bg-sky hover:bg-sky/90"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('deliveryForm.submitting')}
            </>
          ) : (
            t('deliveryForm.submitButton')
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
