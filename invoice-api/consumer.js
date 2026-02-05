import fetch from "node-fetch";  // First run: npm install node-fetch

const API_URL = "http://localhost:3000/api/invoices/changes";
let currentVersion = 0;  // Start from beginning

async function pollChanges() {
  try {
    console.log(`🔍 Checking for changes since version ${currentVersion}...`);
    
    const response = await fetch(
      `${API_URL}?sinceVersion=${currentVersion}&limit=100`
    );
    
    const result = await response.json();
    
    console.log(`📦 Found ${result.count} changed invoices`);
    
    // Process each invoice
    for (const invoice of result.data) {
      console.log(`  ✓ Invoice ${invoice.invoiceNumber}: $${invoice.totalAmount}`);
      
      // Your business logic here:
      // - Send to another system
      // - Save to file
      // - Send email notification
      // etc.
    }
    
    // Update version ONLY after successful processing
    currentVersion = result.nextSinceVersion;
    console.log(`✅ Updated to version ${currentVersion}\n`);
    
    // If there's more data, fetch again immediately
    if (result.hasMore) {
      console.log("⏭️  More data available, fetching next batch...\n");
      await pollChanges();
    }
    
  } catch (err) {
    console.error("❌ Error:", err.message);
    // Don't update version on failure - will retry from same point
  }
}

// Run immediately
pollChanges();

// Then run every 5 minutes
setInterval(pollChanges, 5 * 60 * 1000);