import { storage } from "./storage";

export async function diagnoseRSSIssues(url: string, resourceId?: number) {
  console.log('\n=== RSS DIAGNOSTICS STARTED ===');
  console.log(`Target URL: ${url}`);
  
  const results = {
    originalUrl: url,
    htmlAccessible: false,
    discoveredFeeds: [] as string[],
    feedTests: [] as any[],
    recommendations: [] as string[]
  };

  try {
    // Step 1: Test main URL accessibility
    console.log('\n1. Testing main URL accessibility...');
    const mainResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Article Monitoring/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (mainResponse.ok) {
      results.htmlAccessible = true;
      console.log(`✓ Main URL accessible (${mainResponse.status})`);
      
      // Step 2: Auto-discover RSS feeds
      console.log('\n2. Discovering RSS feeds from HTML...');
      const htmlContent = await mainResponse.text();
      
      const feedLinkRegex = /<link[^>]*(?:type=["']application\/(?:rss\+xml|atom\+xml|xml)["'][^>]*href=["']([^"']+)["']|href=["']([^"']+)["'][^>]*type=["']application\/(?:rss\+xml|atom\+xml|xml)["'])[^>]*>/gi;
      let match;
      while ((match = feedLinkRegex.exec(htmlContent)) !== null) {
        const feedUrl = match[1] || match[2];
        if (feedUrl) {
          const fullUrl = feedUrl.startsWith('http') ? feedUrl : new URL(feedUrl, url).href;
          results.discoveredFeeds.push(fullUrl);
        }
      }
      
      console.log(`Found ${results.discoveredFeeds.length} RSS feeds in HTML`);
      results.discoveredFeeds.forEach(feed => console.log(`  - ${feed}`));
      
    } else {
      console.log(`✗ Main URL not accessible (${mainResponse.status})`);
      results.recommendations.push('Main URL is not accessible - check URL validity');
    }

    // Step 3: Test common RSS feed locations
    console.log('\n3. Testing common RSS feed locations...');
    const domain = new URL(url).origin;
    const commonFeeds = [
      ...results.discoveredFeeds,
      `${domain}/rss`,
      `${domain}/rss.xml`,
      `${domain}/feed`,
      `${domain}/feed.xml`,
      `${domain}/atom.xml`,
      `${domain}/feeds/all.atom.xml`,
      `${domain}/index.xml`,
      `${domain}/blog/feed`,
      `${domain}/news/feed`
    ];

    const seenFeeds = new Set<string>();
    const uniqueFeeds: string[] = [];
    for (const feed of commonFeeds) {
      if (!seenFeeds.has(feed)) {
        seenFeeds.add(feed);
        uniqueFeeds.push(feed);
      }
    }
    
    for (const feedUrl of uniqueFeeds) {
      const feedTest = {
        url: feedUrl,
        accessible: false,
        status: 0,
        contentLength: 0,
        articlesFound: 0,
        error: null as string | null
      };

      try {
        console.log(`Testing: ${feedUrl}`);
        const feedResponse = await fetch(feedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Article Monitoring/1.0)',
            'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml'
          },
          signal: AbortSignal.timeout(10000)
        });

        feedTest.status = feedResponse.status;
        feedTest.accessible = feedResponse.ok;

        if (feedResponse.ok) {
          const rssContent = await feedResponse.text();
          feedTest.contentLength = rssContent.length;
          
          // Parse articles using the RSS parser
          const articles = parseRSSContent(rssContent);
          feedTest.articlesFound = articles.length;
          
          console.log(`  ✓ Accessible (${feedResponse.status}) - ${feedTest.contentLength} chars, ${feedTest.articlesFound} articles`);
          
          if (feedTest.articlesFound > 0 && resourceId) {
            console.log(`  → Saving articles to resource ${resourceId}...`);
            await saveArticlesFromFeed(rssContent, feedUrl, resourceId);
          }
        } else {
          console.log(`  ✗ Not accessible (${feedResponse.status})`);
        }

      } catch (error) {
        feedTest.error = error instanceof Error ? error.message : String(error);
        console.log(`  ✗ Error: ${feedTest.error}`);
      }

      results.feedTests.push(feedTest);
    }

    // Step 4: Generate recommendations
    console.log('\n4. Generating recommendations...');
    
    if (results.discoveredFeeds.length === 0) {
      results.recommendations.push('No RSS feeds found in HTML - website may not provide RSS feeds');
    }
    
    const workingFeeds = results.feedTests.filter(test => test.accessible && test.articlesFound > 0);
    if (workingFeeds.length === 0) {
      results.recommendations.push('No working RSS feeds found - try searching for the website name + "RSS" in a search engine');
      results.recommendations.push('Contact the website to ask if they provide RSS feeds');
      results.recommendations.push('Use keyword-based search instead of URL monitoring for this website');
    } else {
      console.log(`✓ Found ${workingFeeds.length} working RSS feeds!`);
    }

  } catch (error) {
    console.error('Diagnostic error:', error);
    results.recommendations.push(`Diagnostic failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log('\n=== RSS DIAGNOSTICS COMPLETED ===\n');
  return results;
}

function parseRSSContent(rssXml: string) {
  const articles = [];
  
  // Try different RSS/Atom patterns
  const patterns = [
    /<item>([\s\S]*?)<\/item>/gi,
    /<entry>([\s\S]*?)<\/entry>/gi
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(rssXml)) !== null && articles.length < 10) {
      const itemContent = match[1];
      
      const titleMatch = /<title><!\[CDATA\[(.*?)\]\]><\/title>/.exec(itemContent) || 
                        /<title[^>]*>(.*?)<\/title>/.exec(itemContent);
      
      const descMatch = /<description><!\[CDATA\[(.*?)\]\]><\/description>/.exec(itemContent) || 
                       /<description[^>]*>(.*?)<\/description>/.exec(itemContent) ||
                       /<summary[^>]*>(.*?)<\/summary>/.exec(itemContent);
      
      const linkMatch = /<link[^>]*href=["'](.*?)["'][^>]*\/>/.exec(itemContent) ||
                       /<link[^>]*>(.*?)<\/link>/.exec(itemContent);
      
      const pubDateMatch = /<pubDate>(.*?)<\/pubDate>/.exec(itemContent) ||
                          /<published>(.*?)<\/published>/.exec(itemContent);
      
      if (titleMatch && (linkMatch || descMatch)) {
        const title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
        const description = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : '';
        const url = linkMatch ? linkMatch[1].trim() : '';
        
        if (title && title.length > 0) {
          articles.push({
            title,
            description,
            url,
            publishedAt: pubDateMatch ? pubDateMatch[1] : new Date().toISOString(),
            imageUrl: null
          });
        }
      }
    }
    
    if (articles.length > 0) break;
  }
  
  return articles;
}

async function saveArticlesFromFeed(rssContent: string, feedUrl: string, resourceId: number) {
  try {
    const articles = parseRSSContent(rssContent);
    
    for (const article of articles.slice(0, 5)) {
      await storage.createContent({
        resourceId,
        platform: 'website',
        title: article.title,
        description: article.description,
        url: article.url,
        imageUrl: article.imageUrl,
        authorName: new URL(feedUrl).hostname,
        publishedAt: new Date(article.publishedAt || Date.now()),
        engagement: null
      });
    }
    
    console.log(`Saved ${Math.min(articles.length, 5)} articles from ${feedUrl}`);
  } catch (error) {
    console.error('Error saving articles:', error);
  }
}