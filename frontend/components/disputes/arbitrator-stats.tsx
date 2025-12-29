'use client';

import { formatEther } from 'viem';
import { Gavel, TrendingUp, Coins, CheckCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Arbitrator } from '@/lib/types/dispute';
import { useTranslation } from '@/lib/i18n';

interface ArbitratorStatsProps {
  arbitrator: Arbitrator;
}

export function ArbitratorStats({ arbitrator }: ArbitratorStatsProps) {
  const { t } = useTranslation();

  const stats = [
    {
      icon: <Gavel className="h-5 w-5 text-violet" />,
      label: t('arbitratorStats.casesHandled'),
      value: arbitrator.casesHandled.toString(),
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-green" />,
      label: t('arbitratorStats.accuracy'),
      value: `${arbitrator.accuracyRate}%`,
    },
    {
      icon: <Coins className="h-5 w-5 text-yellow" />,
      label: t('arbitratorStats.totalEarnings'),
      value: `${formatEther(arbitrator.earnings)} VERY`,
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-sky" />,
      label: t('arbitratorStats.staking'),
      value: `${formatEther(arbitrator.stake)} VERY`,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('arbitratorStats.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="space-y-1">
              <div className="flex items-center gap-2">
                {stat.icon}
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-lg font-semibold">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('arbitratorStats.accuracy')}</span>
            <span className="font-medium">{arbitrator.accuracyRate}%</span>
          </div>
          <Progress value={arbitrator.accuracyRate} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {t('arbitratorStats.bonusInfo')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
