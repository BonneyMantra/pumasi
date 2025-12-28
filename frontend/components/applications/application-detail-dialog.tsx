'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { User, ExternalLink, Clock, FileText, Link as LinkIcon } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Application, APPLICATION_STATUS_VARIANT } from '@/lib/types/application';
import { useTranslation } from '@/lib/i18n';

interface ApplicationDetailDialogProps {
  application: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept?: () => void;
  onReject?: () => void;
}

export function ApplicationDetailDialog({
  application,
  open,
  onOpenChange,
  onAccept,
  onReject,
}: ApplicationDetailDialogProps) {
  const { t } = useTranslation();

  if (!application) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="font-mono text-base">
                {application.freelancer.slice(0, 6)}...{application.freelancer.slice(-4)}
              </span>
              <Badge
                variant={APPLICATION_STATUS_VARIANT[application.status]}
                className="ml-2"
              >
                {t(`jobDetailPage.applications.status.${application.status}`)}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Applied Date */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {t('jobDetailPage.applications.appliedAt')}{' '}
              {format(new Date(application.createdAt * 1000), 'MMM d, yyyy h:mm a')}
            </span>
          </div>

          {/* Cover Letter */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-sky" />
              {t('applicationDetail.coverLetter')}
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm whitespace-pre-wrap">
                {application.coverLetter || t('applicationDetail.noCoverLetter')}
              </p>
            </div>
          </div>

          {/* Proposed Timeline */}
          {application.proposedTimeline && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-sky" />
                {t('applicationDetail.proposedTimeline')}
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm">{application.proposedTimeline}</p>
              </div>
            </div>
          )}

          {/* Portfolio Links */}
          {application.portfolioLinks && application.portfolioLinks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <LinkIcon className="h-4 w-4 text-sky" />
                {t('applicationDetail.portfolioLinks')}
              </div>
              <div className="space-y-2">
                {application.portfolioLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-sky hover:underline bg-muted/50 rounded-lg p-3"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {link}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* IPFS Metadata Link */}
          {application.proposalURI && (
            <div className="pt-2 border-t">
              <a
                href={application.proposalURI.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-3 w-3" />
                {t('applicationDetail.viewOnIpfs')}
              </a>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Link href={`/profile/${application.freelancer}`} className="flex-1">
              <Button variant="outline" className="w-full">
                <User className="h-4 w-4 mr-2" />
                {t('applicationDetail.viewProfile')}
              </Button>
            </Link>
            {application.status === 'pending' && onAccept && onReject && (
              <>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={onAccept}
                >
                  {t('jobDetailPage.applications.accept')}
                </Button>
                <Button variant="outline" className="flex-1" onClick={onReject}>
                  {t('jobDetailPage.applications.reject')}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
