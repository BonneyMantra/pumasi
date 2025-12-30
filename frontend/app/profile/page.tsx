'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAccount, useConnect } from '@/lib/web3';
import { useTranslation } from '@/lib/i18n';

export default function MyProfilePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();

  // Redirect to profile page when address is available
  useEffect(() => {
    if (address) {
      router.replace(`/profile/${address}`);
    }
  }, [address, router]);

  // Show loading while checking connection
  if (address) {
    return (
      <div className="container max-w-md mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 space-y-4">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show connect wallet prompt if not connected
  return (
    <div className="container max-w-md mx-auto py-8 px-4">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto p-4 bg-sky/10 rounded-full w-fit mb-4">
            <Wallet className="h-8 w-8 text-sky" />
          </div>
          <CardTitle>{t('profileWallet.title')}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {t('profileWallet.message')}
          </p>
          <Button
            className="bg-sky hover:bg-sky/90"
            onClick={() => connect()}
          >
            {t('profileWallet.connect')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
