import { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { MarketTickerBar } from './components/MarketTickerBar';
import { SegmentedControl } from './components/SegmentedControl';
import { DigestHeaderBanner } from './components/DigestHeaderBanner';
import { FilterBar } from './components/FilterBar';
import { NewsCard } from './components/NewsCard';
import { NewsDetailSheet } from './components/NewsDetailSheet';
import { AudioPlayerWidget } from './components/AudioPlayerWidget';
import { ApiKeyModal } from './components/ApiKeyModal';

// Components
import { StockMarketExplorer } from './components/StockMarketExplorer';
import { AuthModal, type UserAuthData } from './components/AuthModal';

import { mockMarketIndices } from './data/mockMarketData';
import { mockDailyDigestSummary, mockWeeklyDigestSummary } from './data/mockNewsData';
import type { StockNewsItem, MarketRegion, TimeframeType, NewsCategory, SentimentType } from './types/stockNews';

import { storageService } from './services/storageService';
import { newsFetcher } from './services/newsFetcher';
import { aiSummarizer } from './services/aiSummarizer';

import './styles/glass-ios.css';

const AUTH_USER_KEY = 'stock_home_current_user';

export function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeView, setActiveView] = useState<'explorer' | 'news'>('explorer');
  
  const [timeframe, setTimeframe] = useState<TimeframeType>('daily');
  const [region, setRegion] = useState<MarketRegion>('all');
  const [category, setCategory] = useState<NewsCategory>('all');
  const [sentiment, setSentiment] = useState<'all' | SentimentType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Storage & AI Generator States
  const [newsList, setNewsList] = useState<StockNewsItem[]>([]);
  const [apiKey, setApiKey] = useState<string>('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

  // Auth States
  const [currentUser, setCurrentUser] = useState<UserAuthData | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'preview'>('login');

  const [selectedNewsDetail, setSelectedNewsDetail] = useState<StockNewsItem | null>(null);
  const [playingAudioItem, setPlayingAudioItem] = useState<StockNewsItem | null>(null);

  // Load Initial Data on Mount
  useEffect(() => {
    const loadedNews = storageService.loadNewsItems();
    setNewsList(loadedNews);
    const loadedKey = storageService.loadApiKey();
    setApiKey(loadedKey);

    try {
      const storedUser = localStorage.getItem(AUTH_USER_KEY);
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to load user session', e);
    }
  }, []);

  // Toggle Theme Handler
  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Auth Handlers
  const handleOpenAuthModal = (tab: 'login' | 'preview' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const handleLoginSuccess = (user: UserAuthData) => {
    setCurrentUser(user);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_USER_KEY);
  };

  // Bookmark Toggle Handler
  const handleToggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = newsList.map((item) =>
      item.id === id ? { ...item, isBookmarked: !item.isBookmarked } : item
    );
    setNewsList(updated);
    storageService.saveNewsItems(updated);

    if (selectedNewsDetail && selectedNewsDetail.id === id) {
      setSelectedNewsDetail((prev) => (prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null));
    }
  };

  // Refresh Trigger Handler
  const handleRefresh = () => {
    setIsRefreshing(true);
    const reloaded = storageService.loadNewsItems();
    setNewsList(reloaded);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  // Save API Key Handler
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    storageService.saveApiKey(key);
  };

  // AI News Generator Handler
  const handleGenerateAiNews = async () => {
    setIsGeneratingAi(true);
    try {
      const rawArticles = await newsFetcher.fetchLatestRawArticles();
      const randomArticle = rawArticles[Math.floor(Math.random() * rawArticles.length)];
      const generatedNews = await aiSummarizer.summarizeArticleWithGemini(randomArticle, apiKey);
      const updatedList = storageService.addNewNewsItem(generatedNews);
      setNewsList(updatedList);
    } catch (err) {
      console.error('Failed to generate AI news:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Active Executive Summary
  const currentDigestSummary = timeframe === 'daily' ? mockDailyDigestSummary : mockWeeklyDigestSummary;

  // Filtered News Items
  const filteredNews = useMemo(() => {
    return newsList.filter((item) => {
      if (item.timeframe !== timeframe) return false;
      if (region !== 'all' && item.region !== region) return false;
      if (category !== 'all' && item.category !== category) return false;
      if (sentiment !== 'all' && item.sentiment !== sentiment) return false;
      if (showBookmarkedOnly && !item.isBookmarked) return false;

      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesSummary = item.summary.toLowerCase().includes(query);
        const matchesTickers = item.tickers.some((t) => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesSummary && !matchesTickers) return false;
      }

      return true;
    });
  }, [newsList, timeframe, region, category, sentiment, showBookmarkedOnly, searchQuery]);

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '100px' }}>
      
      {/* Header Navigation Bar */}
      <Header
        theme={theme}
        onToggleTheme={handleToggleTheme}
        showBookmarkedOnly={showBookmarkedOnly}
        onToggleBookmarkedOnly={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onGenerateAiSummary={handleGenerateAiNews}
        isGeneratingAi={isGeneratingAi}
        hasApiKey={apiKey.length > 5}
        activeView={activeView}
        onSelectView={setActiveView}
        currentUser={currentUser}
        onOpenAuthModal={handleOpenAuthModal}
        onLogout={handleLogout}
      />

      <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* VIEW 1: Ultra-Professional Stock Market Explorer (SET & US) */}
        {activeView === 'explorer' && (
          <StockMarketExplorer
            onRequestPreview={() => handleOpenAuthModal('preview')}
          />
        )}

        {/* VIEW 2: AI Financial News Feed */}
        {activeView === 'news' && (
          <>
            {/* Real-time Market Indices Ticker Bar */}
            <MarketTickerBar indices={mockMarketIndices} activeRegion={region} />

            {/* Timeframe & Region Controls */}
            <SegmentedControl
              timeframe={timeframe}
              onChangeTimeframe={setTimeframe}
              region={region}
              onChangeRegion={setRegion}
            />

            {/* Executive Digest Summary Header Banner */}
            <DigestHeaderBanner summary={currentDigestSummary} />

            {/* Category, Sentiment & Search Filter Bar */}
            <FilterBar
              selectedCategory={category}
              onSelectCategory={setCategory}
              selectedSentiment={sentiment}
              onSelectSentiment={setSentiment}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            {/* News Feed Grid Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {timeframe === 'daily' ? '📰 ข่าวสรุปการเงินประจำวันล่าสุด' : '🗓️ ข่าวสรุปการเงินประจำสัปดาห์ล่าสุด'}
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                พบทั้งหมด {filteredNews.length} รายการ
              </span>
            </div>

            {/* News Feed Cards List */}
            {filteredNews.length > 0 ? (
              <div>
                {filteredNews.map((news) => (
                  <NewsCard
                    key={news.id}
                    item={news}
                    onSelectNews={setSelectedNewsDetail}
                    onPlayAudio={setPlayingAudioItem}
                    onToggleBookmark={handleToggleBookmark}
                    isPlayingThisAudio={playingAudioItem?.id === news.id}
                  />
                ))}
              </div>
            ) : (
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center', margin: '20px 0' }}>
                <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                  ไม่พบรายการข่าวสรุปที่ตรงกับเงื่อนไขการกรอง
                </p>
                <button
                  onClick={() => {
                    setCategory('all');
                    setSentiment('all');
                    setSearchQuery('');
                    setShowBookmarkedOnly(false);
                  }}
                  style={{
                    marginTop: '12px',
                    background: 'var(--accent-blue-gradient)',
                    color: '#fff',
                    border: 'none',
                    padding: '9px 20px',
                    borderRadius: '100px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ล้างการกรองทั้งหมด
                </button>
              </div>
            )}
          </>
        )}

      </main>

      {/* iOS News Detail Sheet Overlay */}
      <NewsDetailSheet
        item={selectedNewsDetail}
        onClose={() => setSelectedNewsDetail(null)}
        onPlayAudio={setPlayingAudioItem}
        onToggleBookmark={handleToggleBookmark}
        isPlayingThisAudio={playingAudioItem?.id === selectedNewsDetail?.id}
      />

      {/* Floating Audio Player Widget */}
      <AudioPlayerWidget
        item={playingAudioItem}
        onClose={() => setPlayingAudioItem(null)}
      />

      {/* Gemini API Key Settings Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        currentApiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />

      {/* Multi-Provider Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialTab={authModalTab}
      />

    </div>
  );
}

export default App;
