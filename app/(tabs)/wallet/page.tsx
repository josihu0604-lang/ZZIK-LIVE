'use client';

import { useEffect, useState } from 'react';
import AuthGate from '@/components/auth/AuthGate';
import BottomTabBar from '@/components/navigation/BottomTabBar';
import { LoadingState } from '@/components/states/LoadingState';
import { track } from '@/lib/analytics';
import { Icon } from '@/components/ui/Icon';

interface WalletSummary {
  points: number;
  vouchers: number;
  expiringSoon: number;
  totalSaved: number;
  expiringItems: Array<{
    id: string;
    name: string;
    daysLeft: number;
    type: 'voucher' | 'offer';
  }>;
}

export default function WalletPage() {
  const [walletData, setWalletData] = useState<WalletSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load wallet data
    const loadWallet = async () => {
      // In production, fetch from API
      await new Promise((resolve) => setTimeout(resolve, 800));

      const data: WalletSummary = {
        points: 1200,
        vouchers: 3,
        expiringSoon: 1,
        totalSaved: 45000,
        expiringItems: [
          {
            id: 'v1',
            name: 'Seongsu Cafe 20% Off',
            daysLeft: 2,
            type: 'voucher',
          },
        ],
      };

      setWalletData(data);
      setIsLoading(false);

      track('wallet_view', {
        vouchers: data.vouchers,
        points: data.points,
        expiring_soon: data.expiringSoon,
      });
    };

    loadWallet();
  }, []);

  if (isLoading || !walletData) {
    return (
      <AuthGate>
        <main style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
          <LoadingState label="Loading wallet..." />
        </main>
        <BottomTabBar />
      </AuthGate>
    );
  }

  return (
    <AuthGate>
      <main style={{ flex: 1, overflow: 'auto' }} aria-label="Wallet">
        <section className="zzik-page">
          <header className="zzik-col" style={{ marginBottom: '24px' }}>
            <h1 className="h2">
              <Icon name="wallet" size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              My Wallet
            </h1>
            <p className="body-small text-muted">Points and vouchers earned through triple verification</p>
          </header>

          {/* Points and Vouchers Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            <div className="card" style={{ padding: '20px' }}>
              <div className="zzik-col" style={{ gap: '4px' }}>
                <div className="caption text-muted">Points</div>
                <div className="display-medium" style={{ fontSize: '28px', fontVariantNumeric: 'tabular-nums' }}>
                  {walletData.points.toLocaleString()}
                </div>
                <div className="caption text-success">
                  +120 today
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <div className="zzik-col" style={{ gap: '4px' }}>
                <div className="caption text-muted">Vouchers</div>
                <div className="display-medium" style={{ fontSize: '28px' }}>
                  {walletData.vouchers}
                </div>
                <div className="caption text-warning">
                  {walletData.expiringSoon} expiring soon
                </div>
              </div>
            </div>
          </div>

          {/* Total Saved */}
          <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="caption text-muted">Total Saved</div>
                <div className="h3 text-primary">
                  ₩{walletData.totalSaved.toLocaleString()}
                </div>
              </div>
              <Icon name="dollar-sign" size={32} className="text-primary" />
            </div>
          </div>

          {/* Expiring Soon */}
          {walletData.expiringItems.length > 0 && (
            <div>
              <h2 className="h4" style={{ marginBottom: '12px' }}>
                <Icon name="clock" size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Expiring Soon
              </h2>
              <div className="grid" style={{ gap: '8px' }}>
                {walletData.expiringItems.map((item) => (
                  <div key={item.id} className="card" style={{ padding: '12px 16px' }}>
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <div>
                        <div className="body">{item.name}</div>
                        <div className="caption text-muted">
                          {item.type === 'voucher' ? 'Voucher' : 'Offer'}
                        </div>
                      </div>
                      <div
                        className={`caption font-semibold ${item.daysLeft <= 2 ? 'text-danger' : 'text-warning'}`}
                      >
                        D-{item.daysLeft}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid" style={{ gap: '12px', marginTop: '24px' }}>
            <button className="btn primary">
              <Icon name="gift" size={18} style={{ marginRight: '8px' }} />
              Use Points
            </button>
            <button className="btn ghost">
              <Icon name="list" size={18} style={{ marginRight: '8px' }} />
              View History
            </button>
          </div>
        </section>
      </main>
      <BottomTabBar />
    </AuthGate>
  );
}
