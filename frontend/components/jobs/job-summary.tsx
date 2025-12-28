'use client';

import { format, formatDistanceToNow } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import { Calendar, Clock, User, Wallet } from 'lucide-react';
import { formatEther } from 'viem';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Job, JOB_CATEGORY_LABELS } from '@/lib/types/job';
import { useTranslation } from '@/lib/i18n';

interface JobSummaryProps {
  job: Job;
}

export function JobSummary({ job }: JobSummaryProps) {
  const { t, locale } = useTranslation();
  const deadlineDate = new Date(job.deadline * 1000);
  const createdDate = new Date(job.createdAt * 1000);
  const isExpired = deadlineDate < new Date();
  const dateLocale = locale === 'ko' ? ko : enUS;
  const dateFormat = locale === 'ko' ? 'yyyy년 M월 d일' : 'MMM d, yyyy';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('jobSummary.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Badge variant="outline" className="mb-3">
            {JOB_CATEGORY_LABELS[job.category]}
          </Badge>
          <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InfoItem
            icon={<Wallet className="h-5 w-5 text-sky" />}
            label={t('jobSummary.budget')}
            value={`${formatEther(job.budget)} VERY`}
          />
          <InfoItem
            icon={<Clock className="h-5 w-5 text-muted-foreground" />}
            label={t('jobSummary.deadline')}
            value={format(deadlineDate, dateFormat, { locale: dateLocale })}
            highlight={isExpired}
          />
          <InfoItem
            icon={<Calendar className="h-5 w-5 text-muted-foreground" />}
            label={t('jobSummary.createdAt')}
            value={format(createdDate, dateFormat, { locale: dateLocale })}
          />
          <InfoItem
            icon={<Clock className="h-5 w-5 text-muted-foreground" />}
            label={t('jobSummary.timeRemaining')}
            value={
              isExpired
                ? t('jobSummary.expired')
                : formatDistanceToNow(deadlineDate, { locale: locale === 'ko' ? ko : enUS, addSuffix: true })
            }
            highlight={isExpired}
          />
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-border">
          <ParticipantInfo label={t('jobSummary.client')} address={job.client} />
          {job.freelancer && <ParticipantInfo label={t('jobSummary.freelancer')} address={job.freelancer} />}
        </div>
      </CardContent>
    </Card>
  );
}

function InfoItem({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`font-semibold ${highlight ? 'text-destructive' : ''}`}>{value}</p>
      </div>
    </div>
  );
}

function ParticipantInfo({ label, address }: { label: string; address: string }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-10 w-10">
        <AvatarFallback>
          <User className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-mono text-sm">
          {address.slice(0, 6)}...{address.slice(-4)}
        </p>
      </div>
    </div>
  );
}
