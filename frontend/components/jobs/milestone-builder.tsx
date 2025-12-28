'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import { CalendarIcon, GripVertical, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export interface Milestone {
  id: string;
  title: string;
  amount: string;
  deadline: Date | undefined;
}

interface MilestoneBuilderProps {
  milestones: Milestone[];
  onChange: (milestones: Milestone[]) => void;
  totalBudget: string;
  jobDeadline?: Date;
}

export function MilestoneBuilder({
  milestones,
  onChange,
  totalBudget,
  jobDeadline,
}: MilestoneBuilderProps) {
  const { t, locale } = useTranslation();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalAllocated = milestones.reduce(
    (sum, m) => sum + (parseFloat(m.amount) || 0),
    0
  );
  const budgetNum = parseFloat(totalBudget) || 0;
  const remaining = budgetNum - totalAllocated;
  const isBalanced = Math.abs(remaining) < 0.001;

  useEffect(() => {
    const newErrors: Record<string, string> = {};

    milestones.forEach((m) => {
      if (!m.title.trim()) {
        newErrors[`${m.id}-title`] = t('milestoneBuilder.titleRequired');
      }
      if (!m.amount || parseFloat(m.amount) <= 0) {
        newErrors[`${m.id}-amount`] = t('milestoneBuilder.amountRequired');
      }
      if (!m.deadline) {
        newErrors[`${m.id}-deadline`] = t('milestoneBuilder.deadlineRequired');
      } else if (jobDeadline && m.deadline > jobDeadline) {
        newErrors[`${m.id}-deadline`] = t('milestoneBuilder.deadlineBeforeJob');
      }
    });

    if (!isBalanced && milestones.length > 0) {
      newErrors['total'] = remaining > 0
        ? t('milestoneBuilder.unallocated', { amount: remaining.toFixed(2) })
        : t('milestoneBuilder.exceeded', { amount: Math.abs(remaining).toFixed(2) });
    }

    setErrors(newErrors);
  }, [milestones, budgetNum, isBalanced, remaining, jobDeadline, t]);

  const addMilestone = () => {
    const newMilestone: Milestone = {
      id: `ms-${Date.now()}`,
      title: '',
      amount: '',
      deadline: undefined,
    };
    onChange([...milestones, newMilestone]);
  };

  const removeMilestone = (id: string) => {
    onChange(milestones.filter((m) => m.id !== id));
  };

  const updateMilestone = (id: string, field: keyof Milestone, value: string | Date | undefined) => {
    onChange(
      milestones.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newMilestones = [...milestones];
    const [dragged] = newMilestones.splice(draggedIndex, 1);
    newMilestones.splice(index, 0, dragged);
    onChange(newMilestones);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">{t('milestoneBuilder.title')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('milestoneBuilder.totalBudget', { amount: budgetNum.toFixed(2) })}
          </p>
        </div>
        <div className={cn('text-sm font-medium', isBalanced ? 'text-green-500' : 'text-destructive')}>
          {isBalanced ? t('milestoneBuilder.balanced') : errors['total'] || ''}
        </div>
      </div>

      <div className="space-y-3">
        {milestones.map((milestone, index) => (
          <Card
            key={milestone.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              'cursor-move transition-opacity',
              draggedIndex === index && 'opacity-50'
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center pt-2 text-muted-foreground">
                  <GripVertical className="h-5 w-5" />
                  <span className="text-sm font-medium ml-1">{index + 1}</span>
                </div>

                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Title */}
                    <div className="md:col-span-2">
                      <Label className="sr-only">{t('milestoneBuilder.milestoneTitle')}</Label>
                      <Input
                        placeholder={t('milestoneBuilder.milestoneTitlePlaceholder')}
                        value={milestone.title}
                        onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                        className={cn(errors[`${milestone.id}-title`] && 'border-destructive')}
                      />
                    </div>

                    {/* Amount */}
                    <div className="relative">
                      <Label className="sr-only">{t('milestoneBuilder.amount')}</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        min={0}
                        step="0.1"
                        value={milestone.amount}
                        onChange={(e) => updateMilestone(milestone.id, 'amount', e.target.value)}
                        className={cn('pr-14', errors[`${milestone.id}-amount`] && 'border-destructive')}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        VERY
                      </span>
                    </div>
                  </div>

                  {/* Deadline */}
                  <div className="flex items-center gap-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            'justify-start text-left font-normal',
                            !milestone.deadline && 'text-muted-foreground',
                            errors[`${milestone.id}-deadline`] && 'border-destructive'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {milestone.deadline ? (
                            format(milestone.deadline, 'PP', { locale: locale === 'ko' ? ko : enUS })
                          ) : (
                            <span>{t('milestoneBuilder.selectDeadline')}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={milestone.deadline}
                          onSelect={(date) => updateMilestone(milestone.id, 'deadline', date)}
                          disabled={(date) => {
                            if (date <= new Date()) return true;
                            if (jobDeadline && date > jobDeadline) return true;
                            return false;
                          }}
                        />
                      </PopoverContent>
                    </Popover>

                    {errors[`${milestone.id}-deadline`] && (
                      <span className="text-xs text-destructive">
                        {errors[`${milestone.id}-deadline`]}
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeMilestone(milestone.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={addMilestone}
      >
        <Plus className="mr-2 h-4 w-4" />
        {t('milestoneBuilder.addMilestone')}
      </Button>

      {remaining > 0 && milestones.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          {t('milestoneBuilder.remainingBudget', { amount: remaining.toFixed(2) })}
        </p>
      )}
    </div>
  );
}

export function validateMilestones(
  milestones: Milestone[],
  totalBudget: string,
  jobDeadline?: Date,
  t?: (key: string, params?: Record<string, string | number>) => string
): string[] {
  const errors: string[] = [];
  const budgetNum = parseFloat(totalBudget) || 0;

  if (milestones.length === 0) {
    errors.push(t?.('milestoneBuilder.validation.atLeastOne') || 'At least one milestone required');
    return errors;
  }

  const totalAllocated = milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
  if (Math.abs(budgetNum - totalAllocated) > 0.001) {
    errors.push(t?.('milestoneBuilder.validation.totalMismatch') || 'Milestone total must match budget');
  }

  milestones.forEach((m, i) => {
    if (!m.title.trim()) errors.push(t?.('milestoneBuilder.validation.milestoneTitle', { number: i + 1 }) || `Milestone ${i + 1}: Title required`);
    if (!m.amount || parseFloat(m.amount) <= 0) errors.push(t?.('milestoneBuilder.validation.milestoneAmount', { number: i + 1 }) || `Milestone ${i + 1}: Amount required`);
    if (!m.deadline) errors.push(t?.('milestoneBuilder.validation.milestoneDeadline', { number: i + 1 }) || `Milestone ${i + 1}: Deadline required`);
    else if (jobDeadline && m.deadline > jobDeadline) {
      errors.push(t?.('milestoneBuilder.validation.milestoneAfterJob', { number: i + 1 }) || `Milestone ${i + 1}: Deadline after job deadline`);
    }
  });

  return errors;
}
