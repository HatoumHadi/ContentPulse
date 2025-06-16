import { storage } from "./storage";

// Analyze URL content and fetch related articles based on extracted keywords
export async function analyzeUrlAndFetchRelated(resourceId: number, targetUrl: string, additionalKeywords?: string | null): Promise<{ success: boolean; extractedKeywords: string; keywords: string }> {
  try {
    console.log(`Starting URL content analysis for: ${targetUrl}`);
    
    // Extract keywords from target URL content
    const extractedKeywords = await extractKeywordsFromUrl(targetUrl);
    
    // Combine extracted keywords with any additional keywords provided
    const allKeywords = additionalKeywords && additionalKeywords.trim()
      ? `${extractedKeywords}, ${additionalKeywords.trim()}`
      : extractedKeywords;
    
    console.log(`Extracted keywords: ${extractedKeywords}`);
    console.log(`Combined keywords for search: ${allKeywords}`);
    
    // Extract domain from target URL for filtering
    let domainFilter = '';
    try {
      const urlObj = new URL(targetUrl);
      domainFilter = urlObj.hostname.replace(/^www\./, '');
      console.log(`Extracted domain filter: ${domainFilter}`);
    } catch (error) {
      console.log('Could not extract domain from URL');
    }

    // Use topic aggregation to find related articles with domain filtering
    const { aggregateTopicContent } = await import('./topic-aggregator');
    await aggregateTopicContent(resourceId, allKeywords, allKeywords, domainFilter);
    
    return { success: true, extractedKeywords: allKeywords, keywords: allKeywords };
    
  } catch (error) {
    console.error('Error in URL content analysis:', error);
    throw error;
  }
}

// Extract keywords from URL content by analyzing the page
async function extractKeywordsFromUrl(url: string): Promise<string> {
  try {
    console.log(`Fetching content from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.log(`Failed to fetch URL (${response.status}), using domain-based keywords`);
      return extractKeywordsFromDomain(url);
    }
    
    const html = await response.text();
    
    // Extract keywords from various HTML elements
    const keywords = new Set<string>();
    
    // Extract from meta keywords
    const metaKeywords = extractMetaKeywords(html);
    metaKeywords.forEach(keyword => keywords.add(keyword));
    
    // Extract from title
    const titleKeywords = extractTitleKeywords(html);
    titleKeywords.forEach(keyword => keywords.add(keyword));
    
    // Extract from meta description
    const descriptionKeywords = extractDescriptionKeywords(html);
    descriptionKeywords.forEach(keyword => keywords.add(keyword));
    
    // Extract from headings
    const headingKeywords = extractHeadingKeywords(html);
    headingKeywords.forEach(keyword => keywords.add(keyword));
    
    // Convert to array and take top keywords
    const keywordArray = Array.from(keywords)
      .filter(keyword => keyword.length > 2 && keyword.length < 30)
      .slice(0, 8);
    
    if (keywordArray.length === 0) {
      console.log('No keywords extracted from content, using domain-based keywords');
      return extractKeywordsFromDomain(url);
    }
    
    return keywordArray.join(', ');
    
  } catch (error) {
    console.error('Error extracting keywords from URL:', error);
    return extractKeywordsFromDomain(url);
  }
}

// Extract keywords from meta keywords tag
function extractMetaKeywords(html: string): string[] {
  const metaKeywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (metaKeywordsMatch) {
    return metaKeywordsMatch[1]
      .split(',')
      .map(keyword => keyword.trim().toLowerCase())
      .filter(keyword => keyword.length > 2);
  }
  return [];
}

// Extract keywords from page title
function extractTitleKeywords(html: string): string[] {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    const title = titleMatch[1].trim();
    return extractKeywordsFromText(title);
  }
  return [];
}

// Extract keywords from meta description
function extractDescriptionKeywords(html: string): string[] {
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (descMatch) {
    const description = descMatch[1].trim();
    return extractKeywordsFromText(description);
  }
  return [];
}

// Extract keywords from headings (h1, h2, h3)
function extractHeadingKeywords(html: string): string[] {
  const headings = [];
  const headingRegex = /<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi;
  let match;
  
  while ((match = headingRegex.exec(html)) !== null) {
    const headingText = match[1].replace(/<[^>]*>/g, '').trim();
    headings.push(...extractKeywordsFromText(headingText));
  }
  
  return headings;
}

// Extract meaningful keywords from text
function extractKeywordsFromText(text: string): string[] {
  // Remove common stop words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'among', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'must', 'shall', 'here', 'there', 'where', 'when',
    'why', 'how', 'what', 'which', 'who', 'whom', 'whose', 'if', 'unless', 'until', 'while',
    'since', 'because', 'although', 'though', 'even', 'still', 'yet', 'so', 'then', 'now',
    'today', 'tomorrow', 'yesterday', 'news', 'article', 'story', 'report', 'latest', 'new'
  ]);
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => 
      word.length > 2 && 
      word.length < 20 && 
      !stopWords.has(word) &&
      !/^\d+$/.test(word)
    )
    .slice(0, 5);
}

// Fallback: extract keywords from domain name
function extractKeywordsFromDomain(url: string): string {
  try {
    const domain = new URL(url).hostname.replace(/^www\./, '');
    const domainParts = domain.split('.');
    
    // Use the main domain name as keyword
    const mainDomain = domainParts[0];
    
    // Map known domains to relevant keywords
    const domainKeywords: Record<string, string> = {
      'bbc': 'news, breaking news, world news',
      'cnn': 'news, politics, world news',
      'techcrunch': 'technology, startups, tech news',
      'reuters': 'news, business, finance',
      'bloomberg': 'business, finance, markets',
      'forbes': 'business, finance, technology',
      'wired': 'technology, science, innovation',
      'theverge': 'technology, gadgets, tech news',
      'almayadeen': 'middle east news, politics, current affairs',
      'aljazeera': 'world news, middle east, politics',
      'guardian': 'news, politics, world affairs',
      'nytimes': 'news, politics, world news',
      'washingtonpost': 'news, politics, current affairs'
    };
    
    return domainKeywords[mainDomain] || `${mainDomain}, news, current affairs`;
    
  } catch (error) {
    console.error('Error extracting domain keywords:', error);
    return 'news, current affairs';
  }
}