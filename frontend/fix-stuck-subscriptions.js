
// Simple script to fix users who upgraded but are still on free plan
// Run this with: node fix-stuck-subscriptions.js

async function fixStuckSubscriptions() {
  console.log('Fixing stuck subscriptions...');
  
  try {
    // Use the local development URL
    const response = await fetch('http://localhost:3003/api/admin/fix-stuck-subscriptions');
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('Fix results:');
    console.log(`- Fixed ${result.fixed} subscriptions out of ${result.total} accounts`);
    
    if (result.results && result.results.length > 0) {
      console.log('\nDetailed results:');
      result.results.forEach(item => {
        if (item.status === 'fixed') {
          console.log(`✅ Account ${item.account_id}: Fixed subscription to ${item.plan} plan`);
        } else {
          console.log(`❌ Account ${item.account_id}: Error - ${item.error}`);
        }
      });
    } else {
      console.log('\nNo stuck subscriptions were found.');
    }
  } catch (error) {
    console.error('Failed to fix subscriptions:', error);
  }
}

// Run the fix
fixStuckSubscriptions();
