/**
 * BeeSure — Main Application
 * Traceability & Marketplace Platform
 */

import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { HomeView } from './components/public/HomeView';
import { BeekeeperRegistration } from './components/beekeeper/BeekeeperRegistration';
import { PendingApprovalView } from './components/beekeeper/PendingApprovalView';
import { MyHivesView } from './components/hives/MyHivesView';
import { SpeciesThresholdsEditor } from './components/admin/SpeciesThresholdsEditor';
import { AdminHivesManagement } from './components/admin/AdminHivesManagement';
import { ApiDocsView } from './components/iot/ApiDocsView';
import { AdminApprovalQueue } from './components/admin/AdminApprovalQueue';
import { ActivityLogViewer } from './components/admin/ActivityLogViewer';
import { IdGeneratorsTest } from './components/admin/IdGeneratorsTest';
import { HarvestListView } from './components/harvest/HarvestListView';
import { AdminHarvestPool } from './components/batch/AdminHarvestPool';
import { BatchListView } from './components/batch/BatchListView';
import { LabPortal } from './components/lab/LabPortal';
import { LedgerExplorer } from './components/admin/LedgerExplorer';
import { QRVerifyPage } from './components/public/QRVerifyPage';
import { MarketplaceView } from './components/marketplace/MarketplaceView';
import { ProductDetailModal } from './components/marketplace/ProductDetailModal';
import { CartDrawerModal } from './components/cart/CartDrawerModal';
import { BeekeeperListingsManager } from './components/beekeeper/BeekeeperListingsManager';
import { OrderTrackingView } from './components/orders/OrderTrackingView';
import { PayoutAndTrustLedger } from './components/admin/PayoutAndTrustLedger';
import { AdminAnalyticsView } from './components/admin/AdminAnalyticsView';
import { MarketplaceModeration } from './components/admin/MarketplaceModeration';
import { UserManagementView } from './components/admin/UserManagementView';
import { PlatformSettingsView } from './components/admin/PlatformSettingsView';
import { AdminDataManager } from './components/admin/AdminDataManager';
import { AdminConsoleView } from './components/admin/AdminConsoleView';
import { StateDistrictSearch } from './components/common/StateDistrictSearch';
import { ConsumerAnalyticsView } from './components/consumer/ConsumerAnalyticsView';
import { ConsumerMapView } from './components/consumer/ConsumerMapView';
import { LabAnalyticsView } from './components/lab/LabAnalyticsView';
import { BeeAssistantWidget } from './components/common/BeeAssistantWidget';
import { VoiceTranscriberModal } from './components/common/VoiceTranscriberModal';
import { seedPhase3Data } from './services/seedPhase3';
import { seedPhase4Data } from './services/seedPhase4';
import { CameraCapture, CapturedPhoto } from './components/camera/CameraCapture';
import { QRScanner } from './components/camera/QRScanner';
import { AuthModal } from './components/public/AuthModal';
import { HiveDetailView } from './components/hives/HiveDetailView';
import { extractHiveId, getHiveById } from './services/hiveLookup';
import { Sparkles, CheckCircle, QrCode, AlertCircle, X, ShieldAlert, Cpu } from 'lucide-react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from './firebase/config';
import { HiveRecord, CartItem, HoneyListing } from './types';
import { SAMPLE_DATA_MASTER } from './services/sampleDataMaster';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const MainContent: React.FC = () => {
  const { currentUser, beekeeperProfile, activeRole } = useAuth();
  const { language, t } = useLanguage();

  const [currentTab, setCurrentTab] = useState<string>('marketplace');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [selectedScannedHive, setSelectedScannedHive] = useState<HiveRecord | null>(null);
  const [loadingHiveDetail, setLoadingHiveDetail] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isVoiceTranscriberOpen, setIsVoiceTranscriberOpen] = useState(false);
  const [myHives, setMyHives] = useState<HiveRecord[]>([]);

  // Phase 4 Cart State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('honeychain_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<HoneyListing | null>(null);
  const [verifyPackId, setVerifyPackId] = useState<string | null>(null);

  // Sync cart to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('honeychain_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn(e);
    }
  }, [cart]);

  // Seed Phase 3 and Phase 4 demo data on first launch & check incoming URL parameters
  React.useEffect(() => {
    seedPhase3Data();
    seedPhase4Data();

    // Check URL for direct Hive scan (e.g. Google scan /?hive=H001, /verify/hive/H001)
    const detectedHive = extractHiveId(window.location.href) || new URLSearchParams(window.location.search).get('hive');
    if (detectedHive) {
      setLoadingHiveDetail(true);
      getHiveById(detectedHive)
        .then((hive) => {
          setSelectedScannedHive(hive);
          setCurrentTab('hive-detail');
        })
        .catch((err) => {
          console.warn('Error loading hive from scan URL:', err);
        })
        .finally(() => {
          setLoadingHiveDetail(false);
        });
      return;
    }

    // Check URL parameters for direct pack verification
    const params = new URLSearchParams(window.location.search);
    const pId = params.get('verifyPack') || params.get('packId') || params.get('verify');
    if (pId) {
      setVerifyPackId(pId);
      setCurrentTab('verify-honey');
    }
  }, []);

  // Auto-route to assigned role dashboard on fresh login or role sync
  const lastRoutedKeyRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    // If user arrived via a direct Hive QR scan or honey pack scan, don't override their view
    const params = new URLSearchParams(window.location.search);
    const hasScanParam =
      params.get('hive') ||
      params.get('hiveId') ||
      params.get('verifyPack') ||
      params.get('packId') ||
      window.location.href.includes('/verify/hive/');
    if (hasScanParam || currentTab === 'hive-detail') {
      return;
    }

    if (currentUser?.uid) {
      const routingKey = `${currentUser.uid}_${activeRole}`;
      if (routingKey !== lastRoutedKeyRef.current) {
        lastRoutedKeyRef.current = routingKey;
        if (activeRole === 'ADMIN') {
          setCurrentTab('admin-console');
        } else if (activeRole === 'BEEKEEPER') {
          setCurrentTab('beekeeper-dashboard');
        } else if (activeRole === 'LAB') {
          setCurrentTab('lab-portal');
        } else {
          setCurrentTab('marketplace');
        }
      }
    } else {
      lastRoutedKeyRef.current = null;
    }
  }, [currentUser, activeRole, currentTab]);

  // Role Access Checks & Restrictions
  const ADMIN_ONLY_TABS = [
    'admin-console',
    'admin-queue',
    'admin-analytics',
    'admin-moderation',
    'admin-users',
    'admin-settings',
    'admin-data',
    'admin-hives',
    'species-thresholds',
    'harvest-pool',
    'activity-logs',
    'id-engine',
    'payouts',
  ];

  const BEEKEEPER_ONLY_TABS = [
    'beekeeper-dashboard',
    'beekeeper-register',
    'my-hives',
    'harvests',
    'my-listings',
  ];

  const LAB_ONLY_TABS = [
    'lab-portal',
  ];

  const isAccessDenied = React.useMemo(() => {
    if (!currentUser) {
      return (
        ADMIN_ONLY_TABS.includes(currentTab) ||
        BEEKEEPER_ONLY_TABS.includes(currentTab) ||
        LAB_ONLY_TABS.includes(currentTab)
      );
    }
    if (ADMIN_ONLY_TABS.includes(currentTab) && activeRole !== 'ADMIN') {
      return true;
    }
    if (BEEKEEPER_ONLY_TABS.includes(currentTab) && activeRole !== 'BEEKEEPER' && activeRole !== 'ADMIN') {
      return true;
    }
    if (LAB_ONLY_TABS.includes(currentTab) && activeRole !== 'LAB' && activeRole !== 'ADMIN') {
      return true;
    }
    return false;
  }, [currentUser, currentTab, activeRole]);

  // Redirect to marketplace/home when user signs out or is unauthenticated
  React.useEffect(() => {
    if (!currentUser) {
      if (ADMIN_ONLY_TABS.includes(currentTab) || BEEKEEPER_ONLY_TABS.includes(currentTab) || LAB_ONLY_TABS.includes(currentTab)) {
        setCurrentTab('marketplace');
      }
    }
  }, [currentUser, currentTab]);

  // Cart operations
  const handleAddToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.listingId === item.listingId);
      if (existing) {
        return prev.map((i) =>
          i.listingId === item.listingId
            ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.maxStock) }
            : i
        );
      }
      return [...prev, item];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (listingId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(listingId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.listingId === listingId ? { ...i, quantity: Math.min(quantity, i.maxStock) } : i))
    );
  };

  const handleRemoveItem = (listingId: string) => {
    setCart((prev) => prev.filter((i) => i.listingId !== listingId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Real-time listener for current beekeeper's hives
  React.useEffect(() => {
    if (!beekeeperProfile?.beekeeperId) {
      setMyHives([]);
      return;
    }
    const bkId = beekeeperProfile.beekeeperId;
    const q = query(
      collection(db, 'hives'),
      where('beekeeperId', '==', bkId)
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as HiveRecord)
          .filter((h) => h.beekeeperId === bkId);
        setMyHives(list);
      },
      (err) => {
        console.warn('Notice listening to beekeeper hives (using local/master fallback):', err);
        try {
          const localHives: HiveRecord[] = JSON.parse(localStorage.getItem('hc_local_hives') || '[]');
          const myLocal = localHives.filter((h) => h.beekeeperId === bkId);
          if (myLocal.length > 0) {
            setMyHives(myLocal);
          } else {
            setMyHives(SAMPLE_DATA_MASTER.hives.filter((h: HiveRecord) => h.beekeeperId === bkId));
          }
        } catch {
          setMyHives(SAMPLE_DATA_MASTER.hives.filter((h: HiveRecord) => h.beekeeperId === bkId));
        }
      }
    );
    return () => unsubscribe();
  }, [beekeeperProfile?.beekeeperId]);

  // Scan & Camera results notification banner
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);

  const handleScanSuccess = async (decoded: string) => {
    setScanResult(decoded);

    // 1. Check if scanned QR is a Hive ID or Hive URL (works with Google Lens URL or in-app scanner)
    const detectedHiveId = extractHiveId(decoded);
    if (detectedHiveId) {
      try {
        setLoadingHiveDetail(true);
        const hive = await getHiveById(detectedHiveId);
        setSelectedScannedHive(hive);
        setCurrentTab('hive-detail');

        // Update URL query cleanly so user can share or refresh
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('hive', hive.hiveId);
        window.history.replaceState({}, '', newUrl.toString());
      } catch (err) {
        console.warn('Error displaying scanned hive:', err);
      } finally {
        setLoadingHiveDetail(false);
      }
      return;
    }

    // 2. If scanned decoded contains a BeeSure Pack ID, route immediately to verify-honey
    const packMatch = decoded.match(/HB-\d{4}-[A-Z]{2}-\d{4}-P\d{4}/);
    if (packMatch) {
      setVerifyPackId(packMatch[0]);
      setCurrentTab('verify-honey');
    } else if (decoded.startsWith('HB-') || decoded.includes('verifyPack=')) {
      const urlPack = new URLSearchParams(decoded.split('?')[1] || '').get('verifyPack') || decoded;
      setVerifyPackId(urlPack);
      setCurrentTab('verify-honey');
    }
  };

  const handleCapturePhotos = (photos: CapturedPhoto[]) => {
    setCapturedPhotos(photos);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div key={language} className="min-h-screen flex flex-col bg-linear-to-b from-amber-50/20 via-white to-amber-50/30 text-slate-900 selection:bg-amber-200 selection:text-amber-950">
      {/* Header */}
      <Header
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenCamera={() => setIsCameraOpen(true)}
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        onOpenVoiceTranscriber={() => setIsVoiceTranscriberOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        cartCount={cartCount}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10">
        {isAccessDenied ? (
          <div className="max-w-xl mx-auto my-16 p-8 bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800 rounded-3xl text-center space-y-4 shadow-xl animate-in fade-in">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-red-900 dark:text-red-200">
              {t('access denied — role restricted')}
            </h2>
            <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
              {currentUser
                ? `Your account (${currentUser.email}) is authenticated as a verified ${activeRole}. You do not have permissions to access this screen.`
                : 'Authentication is required to access this dashboard. Please sign in with an authorized role account.'}
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => {
                  if (activeRole === 'ADMIN') setCurrentTab('admin-analytics');
                  else if (activeRole === 'BEEKEEPER') setCurrentTab('beekeeper-dashboard');
                  else if (activeRole === 'LAB') setCurrentTab('lab-portal');
                  else setCurrentTab('marketplace');
                }}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition"
              >
                {t('return to authorized dashboard')}
              </button>
            </div>
          </div>
        ) : (
          <>
        {/* Scanned QR Code Result Notice */}
        {scanResult && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-slate-950">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                  Decoded QR Code:
                </span>
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  {scanResult}
                </span>
              </div>
            </div>
            <button
              onClick={() => setScanResult(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Captured Photos Banner */}
        {capturedPhotos.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2 overflow-hidden">
                {capturedPhotos.map((p, i) => (
                  <img
                    key={i}
                    src={p.dataUrl}
                    alt="Captured"
                    className="inline-block h-10 w-10 rounded-lg object-cover ring-2 ring-white dark:ring-slate-900"
                  />
                ))}
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Camera Test Successful: {capturedPhotos.length} photo(s) captured with JPEG compression
                </span>
                <p className="text-[11px] text-slate-500">
                  Ready for AI disease scans and hive registration in Phase 2.
                </p>
              </div>
            </div>
            <button
              onClick={() => setCapturedPhotos([])}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        <ErrorBoundary fallbackTitle="View Display Notice">
        {/* Phase 4 Marketplace View */}
        {currentTab === 'marketplace' && (
          <MarketplaceView
            onSelectListing={(listing) => setSelectedListing(listing)}
            onAddToCart={handleAddToCart}
            onVerifyPack={(pId) => {
              setVerifyPackId(pId);
              setCurrentTab('verify-honey');
            }}
          />
        )}

        {/* Phase 4 Public QR Verification & Ledger Audit Page */}
        {currentTab === 'verify-honey' && (
          <QRVerifyPage
            initialPackId={verifyPackId || undefined}
            onNavigate={(tab) => setCurrentTab(tab)}
            onSelectHive={async (hId) => {
              setLoadingHiveDetail(true);
              try {
                const hive = await getHiveById(hId);
                setSelectedScannedHive(hive);
                setCurrentTab('hive-detail');
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.set('hive', hive.hiveId);
                window.history.replaceState({}, '', newUrl.toString());
              } catch (err) {
                console.warn('Error selecting hive from verify page:', err);
              } finally {
                setLoadingHiveDetail(false);
              }
            }}
          />
        )}

        {/* Phase 4 Beekeeper Listings Manager */}
        {currentTab === 'my-listings' && (
          <BeekeeperListingsManager
            beekeeperId={beekeeperProfile?.beekeeperId || 'B001'}
            beekeeperName={beekeeperProfile?.name || currentUser?.displayName || 'Beekeeper'}
          />
        )}

        {/* Phase 4 Order Tracking State Machine */}
        {currentTab === 'orders' && (
          <OrderTrackingView
            userRole={activeRole}
            currentUserId={currentUser?.uid}
            onVerifyPack={(pId) => {
              setVerifyPackId(pId);
              setCurrentTab('verify-honey');
            }}
          />
        )}

        {/* Phase 4 Admin Payouts & Trust Score Engine */}
        {currentTab === 'payouts' && <PayoutAndTrustLedger />}

        {currentTab === 'home' && (
          <HomeView
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenQRScanner={() => setIsQRScannerOpen(true)}
            onOpenCamera={() => setIsCameraOpen(true)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {currentTab === 'beekeeper-register' && (
          beekeeperProfile ? (
            <PendingApprovalView
              beekeeper={beekeeperProfile}
              onNavigateToHives={() => setCurrentTab('my-hives')}
            />
          ) : (
            <BeekeeperRegistration onSuccess={() => setCurrentTab('beekeeper-register')} />
          )
        )}

        {currentTab === 'beekeeper-dashboard' && (
          beekeeperProfile ? (
            <PendingApprovalView
              beekeeper={beekeeperProfile}
              onNavigateToHives={() => setCurrentTab('my-hives')}
            />
          ) : (
            <div className="text-center py-12 space-y-4">
              <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
              <h2 className="text-xl font-bold">No Apiary Registered Yet</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Register your apiary with your Madhukranti portal ID and Aadhaar last 4 digits to start receiving verified batch pack QR codes.
              </p>
              <button
                onClick={() => setCurrentTab('beekeeper-register')}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition"
              >
                Start Beekeeper Registration
              </button>
            </div>
          )
        )}

        {currentTab === 'my-hives' && <MyHivesView />}

        {/* Scanned / Direct Hive Detail View (Accessible to all users & Google QR scans) */}
        {currentTab === 'hive-detail' && (
          loadingHiveDetail ? (
            <div className="py-24 text-center space-y-4 max-w-md mx-auto animate-in fade-in">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-600 animate-pulse">
                <Cpu className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Connecting to Apiary IoT Node...</h3>
              <p className="text-xs text-slate-500">Retrieving verified colony species, telemetry charts, and Madhukranti provenance.</p>
            </div>
          ) : selectedScannedHive ? (
            <HiveDetailView
              hive={selectedScannedHive}
              onBack={() => {
                setSelectedScannedHive(null);
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete('hive');
                newUrl.searchParams.delete('hiveId');
                window.history.replaceState({}, '', newUrl.toString());
                if (activeRole === 'BEEKEEPER') {
                  setCurrentTab('my-hives');
                } else {
                  setCurrentTab('marketplace');
                }
              }}
            />
          ) : (
            <div className="text-center py-20 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Hive Identifier Not Found</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Please make sure the QR sticker is scanned clearly, or try searching the ID in the verification portal.
              </p>
              <button
                onClick={() => setCurrentTab('marketplace')}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow transition"
              >
                Back to Marketplace
              </button>
            </div>
          )
        )}

        {currentTab === 'harvests' && (
          <HarvestListView
            beekeeperId={beekeeperProfile?.beekeeperId || 'B001'}
            beekeeperName={beekeeperProfile?.name || currentUser?.displayName || 'Beekeeper'}
            beekeeperState={beekeeperProfile?.state || 'UP'}
            hives={myHives}
            onSelectBatch={(bId) => {
              setSelectedBatchId(bId);
              setCurrentTab('batches');
            }}
          />
        )}

        {currentTab === 'harvest-pool' && (
          <AdminHarvestPool
            onBatchCreated={(bId) => {
              setSelectedBatchId(bId);
              setCurrentTab('batches');
            }}
          />
        )}

        {currentTab === 'batches' && (
          <BatchListView
            initialSelectedBatchId={selectedBatchId}
            onSelectBatch={(bId) => setSelectedBatchId(bId)}
            beekeeperId={beekeeperProfile?.beekeeperId}
          />
        )}

        {currentTab === 'lab-portal' && (
          <LabPortal
            currentUserId={currentUser?.uid}
            userRole={activeRole}
          />
        )}

        {currentTab === 'admin-console' && (
          <AdminConsoleView
            initialSubTab="hives-queue"
            onNavigateTab={(t) => setCurrentTab(t)}
          />
        )}

        {currentTab === 'admin-queue' && (
          <AdminConsoleView
            initialSubTab="hives-queue"
            onNavigateTab={(t) => setCurrentTab(t)}
          />
        )}

        {currentTab === 'admin-analytics' && (
          <AdminConsoleView
            initialSubTab="analytics"
            onNavigateTab={(t) => setCurrentTab(t)}
          />
        )}

        {currentTab === 'admin-data' && (
          <AdminConsoleView
            initialSubTab="data-manager"
            onNavigateTab={(t) => setCurrentTab(t)}
          />
        )}

        {currentTab === 'admin-hives' && (
          <AdminConsoleView
            initialSubTab="hives-fleet"
            onNavigateTab={(t) => setCurrentTab(t)}
          />
        )}

        {currentTab === 'admin-users' && (
          <AdminConsoleView
            initialSubTab="users"
            onNavigateTab={(t) => setCurrentTab(t)}
          />
        )}

        {currentTab === 'admin-settings' && (
          <AdminConsoleView
            initialSubTab="settings"
            onNavigateTab={(t) => setCurrentTab(t)}
          />
        )}

        {currentTab === 'admin-moderation' && (
          <AdminConsoleView
            initialSubTab="moderation"
            onNavigateTab={(t) => setCurrentTab(t)}
          />
        )}

        {currentTab === 'payouts' && (
          <AdminConsoleView
            initialSubTab="payouts"
            onNavigateTab={(t) => setCurrentTab(t)}
          />
        )}

        {currentTab === 'activity-logs' && (
          <AdminConsoleView
            initialSubTab="activity-logs"
            onNavigateTab={(t) => setCurrentTab(t)}
          />
        )}

        {currentTab === 'ledger-explorer' && <LedgerExplorer />}

        {currentTab === 'species-thresholds' && <SpeciesThresholdsEditor />}

        {currentTab === 'api-docs' && <ApiDocsView />}

        {currentTab === 'id-engine' && <IdGeneratorsTest />}

        {/* Search by State / District (Accessible to Consumer, Admin, and Lab) */}
        {currentTab === 'search-region' && (
          <StateDistrictSearch
            role={activeRole}
            onSelectBatch={(bId) => {
              setSelectedBatchId(bId);
              setCurrentTab('batches');
            }}
          />
        )}

        {/* Consumer Dedicated Honey Map */}
        {currentTab === 'consumer-map' && (
          <ConsumerMapView
            onNavigateToMarketplace={() => setCurrentTab('marketplace')}
            onSelectBatch={(bId) => {
              setSelectedBatchId(bId);
              setCurrentTab('batches');
            }}
          />
        )}

        {/* Consumer Dedicated Purity Analytics & AI Insights */}
        {currentTab === 'consumer-analytics' && (
          <ConsumerAnalyticsView
            onNavigateToMarketplace={() => setCurrentTab('marketplace')}
            onAddToCart={handleAddToCart}
            onSelectBatch={(bId) => {
              setSelectedBatchId(bId);
              setCurrentTab('batches');
            }}
          />
        )}

        {/* Lab Dedicated Analytics & Quality Trends */}
        {currentTab === 'lab-analytics' && (
          <LabAnalyticsView
            labId="LAB_CBRTI_PUNE"
            initialTab="charts"
          />
        )}
        </ErrorBoundary>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 BeeSure — Direct Beekeeper-to-Consumer Traceability Platform.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Madhukranti Portal Complement</span>
            <span>•</span>
            <span>Polygon Amoy / Cryptographic Hash Chained</span>
          </div>
        </div>
      </footer>

      {/* Bottom Mobile Navigation */}
      <BottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenCamera={() => setIsCameraOpen(true)}
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
      />

      {/* Phase 4 Product Detail Modal */}
      {selectedListing && (
        <ProductDetailModal
          isOpen={!!selectedListing}
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onAddToCart={handleAddToCart}
          onVerifyPack={(pId) => {
            setSelectedListing(null);
            setVerifyPackId(pId);
            setCurrentTab('verify-honey');
          }}
        />
      )}

      {/* Phase 4 Cart & Checkout Drawer Modal */}
      <CartDrawerModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOrderPlaced={(orderId) => {
          setCurrentTab('orders');
        }}
      />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapturePhotos}
        multiPhoto={true}
        maxPhotos={4}
      />

      <QRScanner
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      <VoiceTranscriberModal
        isOpen={isVoiceTranscriberOpen}
        onClose={() => setIsVoiceTranscriberOpen(false)}
      />

      {/* Phase 5 Bilingual AI Bee Assistant Chatbot (Madhubot) */}
      <BeeAssistantWidget />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MainContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
