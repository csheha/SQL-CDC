// Import libraries
import express from "express";
import sql from "mssql";

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

// Connect to database once when server starts
let pool;
async function connectDB() {
  if (!pool) {
    pool = await sql.connect(dbConfig);
    console.log("✅ Connected to SQL Server");
  }
  return pool;
}

// API endpoint: GET /api/invoices/changes?sinceVersion=0&limit=10
app.get("/api/invoices/changes", async (req, res) => {
  try {
    // Get parameters from URL
    const sinceVersion = Number(req.query.sinceVersion || 0);
    const limit = Number(req.query.limit || 100);

    console.log(`📥 Request: sinceVersion=${sinceVersion}, limit=${limit}`);

    const pool = await connectDB();

    // 1️⃣ Get current version number
    const versionResult = await pool.request()
      .query`SELECT CHANGE_TRACKING_CURRENT_VERSION() AS toVersion`;
    
    const toVersion = versionResult.recordset[0].toVersion;

    // 2️⃣ Find changed invoices
    const result = await pool.request()
      .input("sinceVersion", sql.BigInt, sinceVersion)
      .input("toVersion", sql.BigInt, toVersion)
      .input("limit", sql.Int, limit)
      .query(`
        WITH ChangedInvoices AS (
            -- Find changed headers
            SELECT DISTINCT h.InvoiceId, CT.SYS_CHANGE_VERSION
            FROM CHANGETABLE(CHANGES InvoiceHeader, @sinceVersion) AS CT
            INNER JOIN InvoiceHeader h ON h.InvoiceId = CT.InvoiceId
            WHERE CT.SYS_CHANGE_VERSION <= @toVersion
            
            UNION
            
            -- Find changed lines
            SELECT DISTINCT l.InvoiceId, CT.SYS_CHANGE_VERSION
            FROM CHANGETABLE(CHANGES InvoiceLine, @sinceVersion) AS CT
            INNER JOIN InvoiceLine l ON l.LineId = CT.LineId
            WHERE CT.SYS_CHANGE_VERSION <= @toVersion
        ),
        Aggregated AS (
            SELECT
                InvoiceId,
                MAX(SYS_CHANGE_VERSION) AS ChangeVersion
            FROM ChangedInvoices
            GROUP BY InvoiceId
        )
        SELECT TOP (@limit)
            a.ChangeVersion,
            h.InvoiceId,
            h.InvoiceNumber,
            h.CustomerCode,
            h.InvoiceDate,
            h.TotalAmount,
            (
                SELECT
                    l.LineId,
                    l.ItemCode,
                    l.Qty,
                    l.UnitPrice,
                    l.LineTotal
                FROM InvoiceLine l
                WHERE l.InvoiceId = h.InvoiceId
                FOR JSON PATH
            ) AS Lines
        FROM Aggregated a
        JOIN InvoiceHeader h ON h.InvoiceId = a.InvoiceId
        ORDER BY a.ChangeVersion
      `);

    // 3️⃣ Format the data
    const data = result.recordset.map(r => ({
      changeVersion: Number(r.ChangeVersion),
      invoiceId: r.InvoiceId,
      invoiceNumber: r.InvoiceNumber,
      customerCode: r.CustomerCode,
      invoiceDate: r.InvoiceDate,
      totalAmount: r.TotalAmount,
      lines: r.Lines ? JSON.parse(r.Lines) : []
    }));

    // 4️⃣ Find the highest version we returned
    const maxVersion = data.length
      ? Math.max(...data.map(d => d.changeVersion))
      : sinceVersion;

    // 5️⃣ Send response
    res.json({
      fromVersion: sinceVersion,       // What you asked for
      toVersion: Number(toVersion),    // Current database version
      nextSinceVersion: maxVersion,    // Use this for next request
      hasMore: data.length === limit,  // true if there might be more data
      count: data.length,
      data: data
    });

    console.log(`✅ Returned ${data.length} changed invoices`);

  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ 
      error: "Server error",
      message: err.message 
    });
  }
});

// Start the server
app.listen(PORT, async () => {
  await connectDB();
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Try: http://localhost:${PORT}/api/invoices/changes?sinceVersion=0`);
});