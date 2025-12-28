'use client';

import { useMemo, useState } from 'react';
import { Filter, SortAsc, SortDesc } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApplicationCard, ApplicationCardSkeleton } from './application-card';
import { Application, ApplicationStatus } from '@/lib/types/application';
import { ShinroeScore } from '@/lib/types/shinroe';
import { useTranslation } from '@/lib/i18n';

interface ApplicationsListProps {
  applications: Application[];
  isLoading?: boolean;
  isClient?: boolean;
  shinroeScores?: Record<string, ShinroeScore>;
  shinroeScoresLoading?: boolean;
  onAccept?: (applicationId: string) => void;
  onReject?: (applicationId: string) => void;
}

export function ApplicationsList({
  applications,
  isLoading = false,
  isClient = false,
  shinroeScores = {},
  shinroeScoresLoading = false,
  onAccept,
  onReject,
}: ApplicationsListProps) {
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const { t } = useTranslation();

  const statusOptions = [
    { value: 'all', label: t('applicationsList.filter.all') },
    { value: 'pending', label: t('applicationStatus.pending') },
    { value: 'accepted', label: t('applicationStatus.accepted') },
    { value: 'rejected', label: t('applicationStatus.rejected') },
  ];

  const sortOptions = [
    { value: 'date-desc', label: t('applicationsList.sort.newest') },
    { value: 'date-asc', label: t('applicationsList.sort.oldest') },
    { value: 'score-desc', label: t('applicationsList.sort.trustHighest') },
    { value: 'score-asc', label: t('applicationsList.sort.trustLowest') },
  ];

  const filteredAndSorted = useMemo(() => {
    let result = [...applications];

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter((app) => app.status === statusFilter);
    }

    // Sort
    const [sortField, sortOrder] = sortBy.split('-');
    result.sort((a, b) => {
      if (sortField === 'date') {
        return sortOrder === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt;
      }
      if (sortField === 'score') {
        const scoreA = shinroeScores[a.freelancer.toLowerCase()]?.score ?? 0;
        const scoreB = shinroeScores[b.freelancer.toLowerCase()]?.score ?? 0;
        return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
      }
      return 0;
    });

    return result;
  }, [applications, statusFilter, sortBy, shinroeScores]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <ApplicationsListSkeleton />
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('applicationsList.noApplicants')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as ApplicationStatus | 'all')}
        >
          <SelectTrigger className="w-[140px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t('applicationsList.filter.status')} />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px]">
            {sortBy.includes('desc') ? (
              <SortDesc className="h-4 w-4 mr-2" />
            ) : (
              <SortAsc className="h-4 w-4 mr-2" />
            )}
            <SelectValue placeholder={t('applicationsList.filter.sort')} />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <p className="text-sm text-muted-foreground self-center ml-auto">
          {t('applicationsList.count', { count: filteredAndSorted.length })}
        </p>
      </div>

      {/* Applications Grid */}
      {filteredAndSorted.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t('applicationsList.noFilterMatch')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAndSorted.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              freelancerScore={shinroeScores[application.freelancer.toLowerCase()]}
              freelancerScoreLoading={shinroeScoresLoading}
              isClient={isClient}
              onAccept={onAccept}
              onReject={onReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationsListSkeleton() {
  return (
    <>
      <div className="flex gap-3">
        <div className="h-10 w-[140px] bg-muted rounded-md animate-pulse" />
        <div className="h-10 w-[160px] bg-muted rounded-md animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <ApplicationCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
