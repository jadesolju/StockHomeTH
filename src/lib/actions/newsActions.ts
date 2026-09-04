'use server';

import { summarizeArticleWithGeminiServer, type RawArticlePayload } from '../services/geminiServerService';
import { sampleRawArticles } from '../../services/newsFetcher';
import type { StockNewsItem } from '../schemas/newsSchema';

export async function generateAiNewsAction(userApiKey?: string): Promise<StockNewsItem> {
  const articles: RawArticlePayload[] = sampleRawArticles.map((a) => ({
    title: a.title,
    snippet: a.snippet,
    source: a.source,
    category: a.category,
  }));
  const randomArticle = articles[Math.floor(Math.random() * articles.length)];
  return await summarizeArticleWithGeminiServer(randomArticle, userApiKey);
}
