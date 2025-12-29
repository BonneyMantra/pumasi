'use client';

import { useMemo } from 'react';
import { formatEther, parseEther } from 'viem';
import { CheckCircle, Loader2, AlertCircle, Wallet, ArrowRight } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAccount, useBalance } from '@/lib/web3';
import { usePlatformFee } from '@/lib/hooks/use-job-escrow';
import { JOB_CATEGORY_LABELS, JobCategory } from '@/lib/types/job';
import { Milestone } from './milestone-builder';
import { useTranslation } from '@/lib/i18n';
import { ko, enUS } from 'date-fns/locale';

interface JobSummary {
  title: string;
  category: JobCategory;
  description: string;
  budget: string;
  deadline: Date;
  paymentType: 'full' | 'milestone';
  milestones?: Milestone[];
}

interface EscrowDepositProps {
  jobSummary: JobSummary;
  onDeposit: () => Promise<void>;
  onBack: () => void;
  isProcessing: boolean;
  txHash?: `0x${string}` | null;
  isSuccess: boolean;
  error?: string | null;
}

type DepositStep = 'review' | 'pending' | 'success' | 'error';

export function EscrowDeposit({
  jobSummary,
  onDeposit,
  onBack,
  isProcessing,
  txHash,
  isSuccess,
  error,
}: EscrowDepositProps) {
  const { t, locale } = useTranslation();
  const { isConnected, address } = useAccount();
  const { balance } = useBalance();
  const { feePercentage, isLoading: feeLoading } = usePlatformFee();

  const step: DepositStep = useMemo(() => {
    if (isSuccess) return 'success';
    if (error) return 'error';
    if (isProcessing || txHash) return 'pending';
    return 'review';
  }, [isSuccess, error, isProcessing, txHash]);

  const budgetNum = parseFloat(jobSummary.budget) || 0;
  const platformFee = (budgetNum * (feePercentage || 3)) / 100;
  const totalAmount = budgetNum + platformFee;

  const hasEnoughBalance = useMemo(() => {
    if (!balance) return false;
    try {
      const requiredWei = parseEther(totalAmount.toString());
      return balance >= requiredWei;
    } catch {
      return false;
    }
  }, [balance, totalAmount]);

  const handleDeposit = async () => {
    if (!isConnected || !hasEnoughBalance) return;
    await onDeposit();
  };

  return (
    <div className="space-y-6">
      {/* Job Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('escrowDeposit.jobSummary')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{t('escrowDeposit.title')}</p>
              <p className="font-medium">{jobSummary.title}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('escrowDeposit.category')}</p>
              <p className="font-medium">{JOB_CATEGORY_LABELS[jobSummary.category]}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('escrowDeposit.deadline')}</p>
              <p className="font-medium">
                {jobSummary.deadline.toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('escrowDeposit.paymentType')}</p>
              <p className="font-medium">
                {jobSummary.paymentType === 'full' ? t('escrowDeposit.fullPayment') : t('escrowDeposit.milestonePayment')}
              </p>
            </div>
          </div>

          {jobSummary.paymentType === 'milestone' && jobSummary.milestones && (
            <>
              <Separator />
              <div>
                <p className="text-muted-foreground text-sm mb-2">{t('escrowDeposit.milestones')}</p>
                <div className="space-y-2">
                  {jobSummary.milestones.map((m, i) => (
                    <div key={m.id} className="flex justify-between text-sm">
                      <span>
                        {i + 1}. {m.title}
                      </span>
                      <span className="font-medium">{m.amount} VERY</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('escrowDeposit.depositTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('escrowDeposit.jobBudget')}</span>
              <span>{budgetNum.toFixed(2)} VERY</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t('escrowDeposit.platformFee', { percentage: feeLoading ? '...' : feePercentage })}
              </span>
              <span>{platformFee.toFixed(2)} VERY</span>
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>{t('escrowDeposit.totalAmount')}</span>
              <span className="text-sky">{totalAmount.toFixed(2)} VERY</span>
            </div>
          </div>

          {/* Balance Check */}
          {isConnected && balance !== undefined && (
            <div
              className={cn(
                'flex items-center gap-2 text-sm p-3 rounded-md',
                hasEnoughBalance ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'
              )}
            >
              {hasEnoughBalance ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span>
                {t('escrowDeposit.balance')}: {balance ? parseFloat(formatEther(balance)).toFixed(4) : '0'} VERY
                {!hasEnoughBalance && ` (${t('escrowDeposit.insufficientBalance')})`}
              </span>
            </div>
          )}

          {/* Status Messages */}
          {step === 'pending' && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                {txHash ? t('escrowDeposit.confirmingTx') : t('escrowDeposit.uploadingAndProcessing')}
                {txHash && (
                  <span className="block font-mono text-xs mt-1 truncate">
                    TX: {txHash}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {step === 'success' && (
            <Alert className="border-green-500 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500">
                {t('escrowDeposit.successMessage')}
                {txHash && (
                  <span className="block font-mono text-xs mt-1 truncate">
                    TX: {txHash}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {step === 'error' && error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isProcessing}
          className="flex-1"
        >
          {t('common.back')}
        </Button>

        {!isConnected ? (
          <Button disabled className="flex-1">
            <Wallet className="mr-2 h-4 w-4" />
            {t('escrowDeposit.walletRequired')}
          </Button>
        ) : step === 'success' ? (
          <Button className="flex-1 bg-green-500 hover:bg-green-600">
            <CheckCircle className="mr-2 h-4 w-4" />
            {t('escrowDeposit.completed')}
          </Button>
        ) : (
          <Button
            onClick={handleDeposit}
            disabled={!hasEnoughBalance || isProcessing}
            className="flex-1 bg-sky hover:bg-sky/90"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.processing')}
              </>
            ) : (
              <>
                {t('escrowDeposit.depositButton')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
