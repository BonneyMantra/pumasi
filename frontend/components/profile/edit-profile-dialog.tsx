'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ImageUpload } from './image-upload';
import { VeryChatVerification } from './verychat-verification';
import { TagInput } from './tag-input';
import { ProfileMetadata, ProfileFormData, SaveProfileResult } from '@/lib/types/profile';
import { useTranslation } from '@/lib/i18n';
import { toast } from 'sonner';
import { storeVerification, clearStoredVerification, getStoredVerification } from '@/lib/services/verychat-storage';
import { useAccount, useChainId } from '@/lib/web3';
import { getExplorerTxUrl } from '@/lib/utils/explorer';
import { demoProfileDefaults } from './profile-form-defaults';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metadata: ProfileMetadata | null;
  onSave: (data: ProfileFormData, avatar?: File, cover?: File) => Promise<SaveProfileResult>;
  isSaving: boolean;
}

export function EditProfileDialog({
  open,
  onOpenChange,
  metadata,
  onSave,
  isSaving,
}: EditProfileDialogProps) {
  const { t } = useTranslation();
  const { address } = useAccount();
  const chainId = useChainId();
  const d = demoProfileDefaults;
  const storedVerification = address ? getStoredVerification(address) : null;

  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: metadata?.displayName || d.displayName,
    bio: metadata?.bio || d.bio,
    title: metadata?.title || d.title,
    location: metadata?.location || d.location,
    website: metadata?.website || d.website,
    skills: metadata?.skills?.length ? metadata.skills : d.skills,
    languages: metadata?.languages?.length ? metadata.languages : d.languages,
    hourlyRate: metadata?.hourlyRate ?? d.hourlyRate,
    availability: metadata?.availability || d.availability,
    socials: Object.keys(metadata?.socials || {}).length ? metadata!.socials : d.socials,
    verychatHandle: metadata?.verychatHandle || storedVerification?.handleId,
    verychatVerified: metadata?.verychatVerified || !!storedVerification,
    verychatVerifiedAt: metadata?.verychatVerifiedAt || storedVerification?.verifiedAt,
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.displayName.trim()) {
      toast.error(t('editProfile.nameRequired'));
      return;
    }
    try {
      const result = await onSave(formData, avatarFile || undefined, coverFile || undefined);
      if (result.txHash && chainId) {
        const explorerUrl = getExplorerTxUrl(chainId, result.txHash);
        toast.success(t('editProfile.saved'), {
          action: {
            label: t('common.viewTx'),
            onClick: () => window.open(explorerUrl, '_blank'),
          },
        });
      } else {
        toast.success(t('editProfile.saved'));
      }
      onOpenChange(false);
    } catch {
      toast.error(t('editProfile.saveFailed'));
    }
  };

  const handleVeryChatVerified = (handleId: string) => {
    if (!address) return;
    if (handleId) {
      // Store in localStorage immediately
      storeVerification(address, handleId);
      setFormData((p) => ({
        ...p,
        verychatHandle: handleId,
        verychatVerified: true,
        verychatVerifiedAt: Math.floor(Date.now() / 1000),
      }));
    } else {
      // Clear verification
      clearStoredVerification(address);
      setFormData((p) => ({
        ...p,
        verychatHandle: undefined,
        verychatVerified: false,
        verychatVerifiedAt: undefined,
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{t('editProfile.title')}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Images Section */}
            <div className="space-y-4">
              <Label>{t('editProfile.images')}</Label>
              <div className="relative">
                <ImageUpload
                  value={metadata?.coverImageHash}
                  onChange={setCoverFile}
                  variant="cover"
                  disabled={isSaving}
                />
                <div className="absolute -bottom-6 left-4">
                  <ImageUpload
                    value={metadata?.avatarHash}
                    onChange={setAvatarFile}
                    variant="avatar"
                    disabled={isSaving}
                  />
                </div>
              </div>
              <div className="h-8" /> {/* Spacer for avatar overlap */}
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">{t('editProfile.displayName')} *</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData((p) => ({ ...p, displayName: e.target.value }))}
                  placeholder={t('editProfile.displayNamePlaceholder')}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">{t('editProfile.jobTitle')}</Label>
                <Input
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  placeholder={t('editProfile.jobTitlePlaceholder')}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">{t('editProfile.bio')}</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))}
                placeholder={t('editProfile.bioPlaceholder')}
                rows={3}
                disabled={isSaving}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">{t('editProfile.location')}</Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                  placeholder={t('editProfile.locationPlaceholder')}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">{t('editProfile.website')}</Label>
                <Input
                  id="website"
                  value={formData.website || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, website: e.target.value }))}
                  placeholder="https://..."
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* Availability & Rate */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('editProfile.availability')}</Label>
                <Select
                  value={formData.availability}
                  onValueChange={(v) => setFormData((p) => ({ ...p, availability: v as any }))}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">{t('editProfile.availableNow')}</SelectItem>
                    <SelectItem value="busy">{t('editProfile.busy')}</SelectItem>
                    <SelectItem value="unavailable">{t('editProfile.unavailable')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">{t('editProfile.hourlyRate')}</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  value={formData.hourlyRate || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, hourlyRate: Number(e.target.value) || undefined }))}
                  placeholder="50"
                  disabled={isSaving}
                />
              </div>
            </div>

            <TagInput
              label={t('editProfile.skills')}
              placeholder={t('editProfile.addSkill')}
              values={formData.skills}
              onChange={(skills) => setFormData((p) => ({ ...p, skills }))}
              disabled={isSaving}
              variant="secondary"
            />

            <TagInput
              label={t('editProfile.languages')}
              placeholder={t('editProfile.addLanguage')}
              values={formData.languages}
              onChange={(languages) => setFormData((p) => ({ ...p, languages }))}
              disabled={isSaving}
              variant="outline"
            />

            {/* Social Links */}
            <div className="space-y-2">
              <Label>{t('editProfile.socials')}</Label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Twitter @handle"
                  value={formData.socials?.twitter || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, socials: { ...p.socials, twitter: e.target.value } }))}
                  disabled={isSaving}
                />
                <Input
                  placeholder="GitHub username"
                  value={formData.socials?.github || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, socials: { ...p.socials, github: e.target.value } }))}
                  disabled={isSaving}
                />
                <Input
                  placeholder="LinkedIn URL"
                  value={formData.socials?.linkedin || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, socials: { ...p.socials, linkedin: e.target.value } }))}
                  disabled={isSaving}
                />
                <Input
                  placeholder="Telegram @handle"
                  value={formData.socials?.telegram || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, socials: { ...p.socials, telegram: e.target.value } }))}
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* VeryChat Verification */}
            <div className="space-y-2 p-4 rounded-lg border border-border bg-muted/30">
              <VeryChatVerification
                currentHandle={formData.verychatHandle}
                isVerified={formData.verychatVerified}
                onVerified={handleVeryChatVerified}
                disabled={isSaving}
              />
            </div>
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="bg-sky hover:bg-sky/90">
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('editProfile.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
