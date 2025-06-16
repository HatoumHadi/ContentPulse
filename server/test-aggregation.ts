import { aggregateContent } from './content-aggregator';
import { storage } from './storage';

async function testContentAggregation() {
  try {
    console.log('Testing content aggregation for Al Mayadeen...');
    
    // Test with the existing resource
    const resourceId = 26;
    const url = 'https://www.almayadeen.net';
    
    console.log(`Starting aggregation for resource ${resourceId} with URL: ${url}`);
    
    await aggregateContent(resourceId, url);
    
    console.log('Aggregation completed. Checking results...');
    
    const content = await storage.getRecentContent(resourceId, 10);
    console.log(`Found ${content.length} articles`);
    
    content.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`);
      console.log(`   URL: ${article.url}`);
      console.log(`   Published: ${article.publishedAt}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testContentAggregation();