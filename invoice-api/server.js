import express from "express";
import sql from "mssql";
import { BSON } from "bson";
import fs from "fs";
import path from "path";

// Database connection settings
const dbConfig = {
  server: "localhost",  
  user: "sa",                       
  password: "StrongPass@123",                    
  database: "InvoiceDB",               
  port: 1433,
  options: {
    encrypt: true,                             
    trustServerCertificate: true
  }
};

// Create web server
const app = express();
const PORT = 3000;

// Output folder configuration
const OUTPUT_DIR = "../invoices-output/processed";
const ERROR_DIR = "../invoices-output/error";

// Create folders if they don't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(ERROR_DIR)) {
  fs.mkdirSync(ERROR_DIR, { recursive: true });
}

// Connect to database once when server starts
let pool;
async function connectDB() {
  if (!pool) {
    pool = await sql.connect(dbConfig);
    console.log("✅ Connected to SQL Server");
  }
  return pool;
}

// Helper function to format duration
function formatDuration(ms) {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

// Function to save invoice as BSON file
function saveInvoiceAsBSON(invoice) {
  try {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').split('.')[0];
    const filename = `${invoice.invoiceNumber}_v${invoice.changeVersion}_${timestamp}.bson`;
    const filepath = path.join(OUTPUT_DIR, filename);

    // Convert to BSON
    const bsonData = BSON.serialize(invoice);

    // Write to file
    fs.writeFileSync(filepath, bsonData);

    return { success: true, filename, filepath };

  } catch (err) {
    console.error(`  ❌ Failed to save ${invoice.invoiceNumber}:`, err.message);
    return { success: false, error: err.message };
  }
}

// Main endpoint - WITH PERFORMANCE TRACKING
app.get("/api/invoices/changes", async (req, res) => {
  const requestStartTime = Date.now();
  const timings = {};
  
  try {
    const syncName = req.query.syncName || "DefaultConsumer";
    const limit = Number(req.query.limit || 1000);

    console.log(`\n${'='.repeat(70)}`);
    console.log(`⏰ ${new Date().toISOString()}`);
    console.log(`📥 Consumer: ${syncName}, Limit: ${limit}`);
    console.log(`${'='.repeat(70)}`);

    const pool = await connectDB();

    //1. Get last position
    let stepStart = Date.now();
    const stateResult = await pool.request()
      .input("syncName", sql.VarChar(100), syncName)
      .query(`
        SELECT LastSyncVersion, LastProcessedInvoiceId
        FROM ChangeTrackingSyncState 
        WHERE SyncName = @syncName
      `);
    timings.readState = Date.now() - stepStart;

    let sinceVersion = 0;
    let lastInvoiceId = 0;
    
    if (stateResult.recordset.length === 0) {
      stepStart = Date.now();
      await pool.request()
        .input("syncName", sql.VarChar(100), syncName)
        .query(`
          INSERT INTO ChangeTrackingSyncState (SyncName, LastSyncVersion, LastProcessedInvoiceId)
          VALUES (@syncName, 0, 0)
        `);
      timings.createState = Date.now() - stepStart;
      console.log(`🆕 Created new consumer: ${syncName} (${formatDuration(timings.createState)})`);
    } else {
      sinceVersion = Number(stateResult.recordset[0].LastSyncVersion || 0);
      lastInvoiceId = Number(stateResult.recordset[0].LastProcessedInvoiceId || 0);
    }

    console.log(`Position: Version ${sinceVersion}, InvoiceId ${lastInvoiceId} (${formatDuration(timings.readState)})`);

    // 2. Find changed invoices using stored procedure
    stepStart = Date.now();
    console.log(`Querying database via stored procedure...`);

    // Use sinceVersion - 1 for CHANGETABLE to include records at sinceVersion
    const changeTableVersion = sinceVersion > 0 ? sinceVersion - 1 : 0;

    const result = await pool.request()
      .input("sinceVersion", sql.BigInt, changeTableVersion)
      .input("limit", sql.Int, limit)
      .execute('sp_GetInvoiceChanges');

    // Extract toVersion from the first row (stored proc returns it)
    const toVersion = result.recordset.length > 0 
      ? result.recordset[0].ToVersion 
      : await pool.request().query`SELECT CHANGE_TRACKING_CURRENT_VERSION() AS toVersion`.then(r => r.recordset[0].toVersion);

    timings.queryDatabase = Date.now() - stepStart;
    console.log(`✅ Stored procedure completed: Found ${result.recordset.length} potential invoices (${formatDuration(timings.queryDatabase)})`);
    console.log(`Current Version: ${toVersion}`);

    // 3. Parse JSON data and filter by position
    stepStart = Date.now();

    // First, parse all data from stored procedure
    const rawData = result.recordset.map(r => ({
      changeVersion: Number(r.ChangeVersion),
      invoiceId: r.InvoiceId,
      invoiceNumber: r.InvoiceNumber,
      customerCode: r.CustomerCode,
      invoiceDate: r.InvoiceDate,
      totalAmount: r.TotalAmount,
      lines: r.Lines ? JSON.parse(r.Lines) : []
    }));

    // Then filter out already-processed invoices
    const data = rawData.filter(invoice => 
      (invoice.changeVersion > sinceVersion) || 
      (invoice.changeVersion === sinceVersion && invoice.invoiceId > lastInvoiceId)
    );

    timings.parseData = Date.now() - stepStart;
    console.log(`📦 Data parsed and filtered: ${data.length} new invoices from ${rawData.length} total (${formatDuration(timings.parseData)})`);

    // Debug output (optional - you can remove this later)
    if (data.length > 0) {
      console.log('📋 Sample invoice:', JSON.stringify(data[0], null, 2));
    }

    // 4. Save as BSON files
    if (data.length > 0) {
      stepStart = Date.now();
      console.log(`💾 Saving ${data.length} BSON files...`);
      
      const saveResults = [];
      let savedCount = 0;
      let lastProgressTime = Date.now();
      
      for (let i = 0; i < data.length; i++) {
        const invoice = data[i];
        const result = saveInvoiceAsBSON(invoice);
        saveResults.push({
          invoiceNumber: invoice.invoiceNumber,
          ...result
        });
        
        if (result.success) savedCount++;
        
        // Progress indicator every 100 files or every 2 seconds
        if ((savedCount % 100 === 0 || Date.now() - lastProgressTime > 2000) && savedCount > 0) {
          const elapsed = Date.now() - stepStart;
          const rate = savedCount / (elapsed / 1000);
          const remaining = data.length - savedCount;
          const eta = remaining / rate;
          
          console.log(`  ⏳ Progress: ${savedCount}/${data.length} (${(savedCount/data.length*100).toFixed(1)}%) | Rate: ${rate.toFixed(0)} files/s | ETA: ${formatDuration(eta * 1000)}`);
          lastProgressTime = Date.now();
        }
      }

      timings.saveBSON = Date.now() - stepStart;
      
      const successCount = saveResults.filter(r => r.success).length;
      const failCount = saveResults.filter(r => !r.success).length;
      
      // Calculate average file size safely
      let avgFileSize = 0;
      try {
        const bsonFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.bson'));
        if (bsonFiles.length > 0) {
          const sampleSize = Math.min(10, bsonFiles.length);
          const totalSize = bsonFiles.slice(0, sampleSize)
            .reduce((sum, f) => sum + fs.statSync(path.join(OUTPUT_DIR, f)).size, 0);
          avgFileSize = totalSize / sampleSize;
        }
      } catch (err) {
        console.warn('  ⚠️  Could not calculate average file size');
      }

      console.log(`✅ BSON files saved: ${successCount} succeeded, ${failCount} failed (${formatDuration(timings.saveBSON)})`);
      console.log(`📊 Save rate: ${(successCount / (timings.saveBSON / 1000)).toFixed(0)} files/s`);
      if (avgFileSize > 0) {
        console.log(`📏 Avg file size: ${(avgFileSize / 1024).toFixed(2)} KB`);
      }

      // 5. Update position
      if (successCount > 0) {
        stepStart = Date.now();

        // Always update to the last successfully processed row
        const lastRow = data[data.length - 1];
        const newVersion = lastRow.changeVersion;
        const newInvoiceId = lastRow.invoiceId;

        await pool.request()
          .input("syncName", sql.VarChar(100), syncName)
          .input("newVersion", sql.BigInt, newVersion)
          .input("newInvoiceId", sql.Int, newInvoiceId)
          .query(`
            UPDATE ChangeTrackingSyncState
            SET LastSyncVersion = @newVersion,
                LastProcessedInvoiceId = @newInvoiceId,
                LastSyncTime = SYSDATETIME()
            WHERE SyncName = @syncName
          `);

        timings.updateState = Date.now() - stepStart;

        console.log(
          ` Position updated: Version ${newVersion}, InvoiceId ${newInvoiceId} (${formatDuration(timings.updateState)})`
        );

        // 6. ️ Performance summary
        const totalTime = Date.now() - requestStartTime;
        timings.total = totalTime;
        
        console.log(`\n${'─'.repeat(70)}`);
        console.log(`  PERFORMANCE SUMMARY`);
        console.log(`${'─'.repeat(70)}`);
        console.log(`  Read State:       ${formatDuration(timings.readState).padStart(10)} (${(timings.readState/totalTime*100).toFixed(1)}%)`);
        //console.log(`  Get Version:      ${formatDuration(timings.getVersion).padStart(10)} (${(timings.getVersion/totalTime*100).toFixed(1)}%)`);
        console.log(`  Query Database:   ${formatDuration(timings.queryDatabase).padStart(10)} (${(timings.queryDatabase/totalTime*100).toFixed(1)}%)`);
        console.log(`  Parse Data:       ${formatDuration(timings.parseData).padStart(10)} (${(timings.parseData/totalTime*100).toFixed(1)}%)`);
        console.log(`  Save BSON:        ${formatDuration(timings.saveBSON).padStart(10)} (${(timings.saveBSON/totalTime*100).toFixed(1)}%)`);
        console.log(`  Update State:     ${formatDuration(timings.updateState).padStart(10)} (${(timings.updateState/totalTime*100).toFixed(1)}%)`);
        console.log(`  ${'─'.repeat(68)}`);
        console.log(`  TOTAL:            ${formatDuration(totalTime).padStart(10)}`);
        console.log(`${'─'.repeat(70)}`);
        console.log(`  Throughput:       ${(successCount / (totalTime / 1000)).toFixed(2)} invoices/s`);
        console.log(`${'='.repeat(70)}\n`);

        res.json({
          consumer: syncName,
          fromVersion: sinceVersion,
          toVersion: Number(toVersion),
          processedUpTo: newVersion,
          lastInvoiceId: newInvoiceId,
          hasMore: data.length === limit,
          count: data.length,
          saved: successCount,
          failed: failCount,
          performance: {
            totalTimeMs: totalTime,
            readStateMs: timings.readState,
           // getVersionMs: timings.getVersion,
            queryDatabaseMs: timings.queryDatabase,
            parseDataMs: timings.parseData,
            saveBSONMs: timings.saveBSON,
            updateStateMs: timings.updateState,
            throughput: {
              invoicesPerSecond: (successCount / (totalTime / 1000)).toFixed(2),
              filesPerSecond: (successCount / (timings.saveBSON / 1000)).toFixed(2)
            }
          }
        });
      } else {
        // No files were saved successfully
        const totalTime = Date.now() - requestStartTime;
        console.log(` No files saved successfully`);
        console.log(` Total time: ${formatDuration(totalTime)}\n`);
        
        res.json({
          consumer: syncName,
          fromVersion: sinceVersion,
          toVersion: Number(toVersion),
          processedUpTo: sinceVersion,
          lastInvoiceId: lastInvoiceId,
          hasMore: false,
          count: data.length,
          saved: 0,
          failed: failCount,
          performance: {
            totalTimeMs: totalTime,
            readStateMs: timings.readState,
           // getVersionMs: timings.getVersion,
            queryDatabaseMs: timings.queryDatabase,
            parseDataMs: timings.parseData,
            saveBSONMs: timings.saveBSON
          }
        });
      }
    } else {
      // No changes found
      const totalTime = Date.now() - requestStartTime;
      console.log(` No changes found`);
      console.log(` Total time: ${formatDuration(totalTime)}\n`);
      
      res.json({
        consumer: syncName,
        fromVersion: sinceVersion,
        toVersion: Number(toVersion),
        processedUpTo: sinceVersion,
        lastInvoiceId: lastInvoiceId,
        hasMore: false,
        count: 0,
        saved: 0,
        failed: 0,
        performance: {
          totalTimeMs: totalTime,
          readStateMs: timings.readState,
          //getVersionMs: timings.getVersion,
          queryDatabaseMs: timings.queryDatabase
        }
      });
    }

  } catch (err) {
    const totalTime = Date.now() - requestStartTime;
    console.error(`\n ERROR after ${formatDuration(totalTime)}:`, err.message);
    console.error(err.stack);
    
    res.status(500).json({ 
      error: "Server error",
      message: err.message,
      performance: {
        totalTimeMs: totalTime,
        ...timings
      }
    });
  }
});

// Endpoint to list saved BSON files
app.get("/api/files", (req, res) => {
  const startTime = Date.now();
  
  try {
    const files = fs.readdirSync(OUTPUT_DIR)
      .filter(f => f.endsWith('.bson'))
      .map(f => {
        const stats = fs.statSync(path.join(OUTPUT_DIR, f));
        return {
          filename: f,
          size: stats.size,
          created: stats.birthtime
        };
      })
      .sort((a, b) => b.created - a.created);

    const duration = Date.now() - startTime;
    console.log(`📋 Listed ${files.length} files (${formatDuration(duration)})`);

    res.json({
      folder: OUTPUT_DIR,
      count: files.length,
      files: files,
      performance: {
        durationMs: duration
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to read a BSON file
app.get("/api/files/:filename", (req, res) => {
  const startTime = Date.now();
  
  try {
    const filepath = path.join(OUTPUT_DIR, req.params.filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const bsonData = fs.readFileSync(filepath);
    const invoice = BSON.deserialize(bsonData);
    
    const duration = Date.now() - startTime;
    console.log(`📄 Read ${req.params.filename} (${formatDuration(duration)})`);

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset consumer endpoint
app.post("/api/consumers/:name/reset", async (req, res) => {
  const startTime = Date.now();
  
  try {
    const syncName = req.params.name;
    const pool = await connectDB();
    
    await pool.request()
      .input("syncName", sql.VarChar(100), syncName)
      .query(`
        UPDATE ChangeTrackingSyncState
        SET LastSyncVersion = 0,
            LastProcessedInvoiceId = 0,
            LastSyncTime = SYSDATETIME()
        WHERE SyncName = @syncName
      `);
    
    const duration = Date.now() - startTime;
    console.log(`🔄 Reset ${syncName} (${formatDuration(duration)})`);
    
    res.json({ 
      message: `Reset ${syncName} to version 0`,
      durationMs: duration
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, async () => {
  await connectDB();
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`${'='.repeat(70)}`);
  console.log(`📡 API Endpoints:`);
  console.log(`   GET  /api/invoices/changes?syncName=MyApp&limit=1000`);
  console.log(`   GET  /api/files`);
  console.log(`   GET  /api/files/:filename`);
  console.log(`   POST /api/consumers/:name/reset`);
  console.log(`${'='.repeat(70)}`);
  console.log(`📂 BSON Output: ${OUTPUT_DIR}`);
  console.log(`${'='.repeat(70)}\n`);
});
