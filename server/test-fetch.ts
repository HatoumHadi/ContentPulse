import { aggregateTopicContent } from './topic-aggregator';
import { storage } from './storage';

async function testFetch() {
  console.log('Testing content fetching for resource 28...');
  
  try {
    // Test with exact user keywords
    await aggregateTopicContent(28, 'politics, news, analysis', 'politics news analysis');
    
    // Check if content was saved
    const content = await storage.getRecentContent(28, 10);
    console.log(`Content fetched: ${content.length} articles`);
    
    if (content.length > 0) {
      console.log('Sample article:', {
        title: content[0].title,
        platform: content[0].platform,
        url: content[0].url
      });
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testFetch();