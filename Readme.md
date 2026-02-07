# SQL Server-based invoice tracking system ##

# Create the Database
    
            CREATE DATABASE InvoiceDB;

# Use the database

            USE InvoiceDB;
            GO
  
# Table Design (Invoice Header + Lines)
    
            CREATE TABLE InvoiceHeader (
                InvoiceId      INT IDENTITY PRIMARY KEY,
                InvoiceNumber  VARCHAR(50) NOT NULL,
                CustomerCode   VARCHAR(50),
                InvoiceDate    DATE,
                TotalAmount    DECIMAL(12,2),
                LastUpdatedAt  DATETIME2 DEFAULT SYSDATETIME()
            );
            
            
            CREATE TABLE InvoiceLine (
                LineId      INT IDENTITY PRIMARY KEY,
                InvoiceId   INT NOT NULL,
                ItemCode    VARCHAR(50),
                Qty         DECIMAL(10,2),
                UnitPrice  DECIMAL(10,2),
                LineTotal  AS (Qty * UnitPrice) PERSISTED,
                LastUpdatedAt DATETIME2 DEFAULT SYSDATETIME(),
                CONSTRAINT FK_InvoiceLine_Header
                    FOREIGN KEY (InvoiceId) REFERENCES InvoiceHeader(InvoiceId)
            );
    
# Enable Change Tracking on DATBASE
    
    ALTER DATABASE InvoiceDB
    SET CHANGE_TRACKING = ON
    (CHANGE_RETENTION = 3 DAYS, AUTO_CLEANUP = ON);
    
# Enable Change Tracking on Tables
    
    ALTER TABLE InvoiceHeader
    ENABLE CHANGE_TRACKING
    WITH (TRACK_COLUMNS_UPDATED = ON);
    
    ALTER TABLE InvoiceLine
    ENABLE CHANGE_TRACKING
    WITH (TRACK_COLUMNS_UPDATED = ON);

# This table stores the last version number we processed

CREATE TABLE ChangeTrackingSyncState (
    SyncName                   VARCHAR(100) PRIMARY KEY, 
    LastSyncVersion             BIGINT NOT NULL,          
    LastProcessedInvoiceId      INT NULL DEFAULT 0,        
    LastSyncTime                DATETIME2 NOT NULL DEFAULT SYSDATETIME()  
);
   

# Example Usage:
# Before making changes, capture your starting point:
    SELECT CHANGE_TRACKING_CURRENT_VERSION() AS current_version;
    
# INSERT DATA
    INSERT INTO InvoiceHeader (InvoiceNumber, CustomerCode, InvoiceDate, TotalAmount)
VALUES
    ('INV-1001', 'CUST-001', '2026-01-01', 500.00),
    ('INV-1002', 'CUST-002', '2026-01-02', 1200.50),
    ('INV-1003', 'CUST-003', '2026-01-03', 750.75),
    ('INV-1004', 'CUST-004', '2026-01-04', 980.00),
    ('INV-1005', 'CUST-005', '2026-01-05', 650.25),
    ('INV-1006', 'CUST-006', '2026-01-06', 1430.00),
    ('INV-1007', 'CUST-007', '2026-01-07', 880.50),
    ('INV-1008', 'CUST-008', '2026-01-08', 2100.00),
    ('INV-1009', 'CUST-009', '2026-01-09', 540.75),
    ('INV-1010', 'CUST-010', '2026-01-10', 1325.00);
    
    
    INSERT INTO InvoiceLine
        (InvoiceId, ItemCode, Qty, UnitPrice)
    VALUES
    -- Invoice 1
    (1, 'ITEM-001', 10, 50.00),
    (1, 'ITEM-002', 5, 120.00),
    (1, 'ITEM-003', 2, 200.00),
    
    -- Invoice 2
    (2, 'ITEM-004', 4, 80.00),
    (2, 'ITEM-005', 6, 90.00),
    
    -- Invoice 3
    (3, 'ITEM-006', 12, 150.00),
    (3, 'ITEM-007', 3, 420.25),
    (3, 'ITEM-008', 1, 500.00),
    (3, 'ITEM-009', 8, 95.00),
    
    -- Invoice 4
    (4, 'ITEM-010', 3, 50.00),
    
    -- Invoice 5
    (5, 'ITEM-011', 20, 75.00),
    (5, 'ITEM-012', 2, 340.45),
    (5, 'ITEM-013', 6, 110.00),
    
    -- Invoice 6
    (6, 'ITEM-014', 5, 99.00),
    (6, 'ITEM-015', 10, 50.00),
    
    -- Invoice 7
    (7, 'ITEM-016', 25, 200.00),
    (7, 'ITEM-017', 4, 350.00),
    (7, 'ITEM-018', 1, 450.00),
    
    -- Invoice 8
    (8, 'ITEM-019', 6, 120.25),
    (8, 'ITEM-020', 3, 150.00),
    
    -- Invoice 9
    (9, 'ITEM-021', 9, 60.00),
    
    -- Invoice 10
    (10, 'ITEM-022', 7, 180.00),
    (10, 'ITEM-023', 2, 430.30);
    
 -----------------------------------------------------------------------------------------------------   
# Some Changes 
    -- Update header
    UPDATE InvoiceHeader
    SET TotalAmount = 400.00
    WHERE InvoiceId = 1;

    -- Add a new line
    INSERT INTO InvoiceLine (InvoiceId, ItemCode, Qty, UnitPrice)
    VALUES (1, 'ITEM04', 1, 500.00);


    ----------------------------------------------------------------------------------------------------------------------------------------------------------------------
#  Find Changed Invoices
    DECLARE @last_sync_version BIGINT = 100;  -- Replace with your saved version
    
    -- Find all invoices that changed (header OR lines)
    SELECT DISTINCT h.InvoiceId
    FROM CHANGETABLE(CHANGES InvoiceHeader, @last_sync_version) AS CT
    INNER JOIN InvoiceHeader h ON h.InvoiceId = CT.InvoiceId
    
    UNION
    
    SELECT DISTINCT l.InvoiceId
    FROM CHANGETABLE(CHANGES InvoiceLine, @last_sync_version) AS CT
    INNER JOIN InvoiceLine l ON l.LineId = CT.LineId;
    
    
    ----------------------------------------------------------------------------------------------------------------------------------------------------------------------
# Get Complete Invoices as JSON
    DECLARE @last_sync_version BIGINT = 6;  -- Your baseline version
    
    WITH ChangedInvoices AS (
        -- Header changes
        SELECT DISTINCT h.InvoiceId
        FROM CHANGETABLE(CHANGES InvoiceHeader, @last_sync_version) AS CT
        INNER JOIN InvoiceHeader h ON h.InvoiceId = CT.InvoiceId
        
        UNION
        
        -- Line changes
        SELECT DISTINCT l.InvoiceId
        FROM CHANGETABLE(CHANGES InvoiceLine, @last_sync_version) AS CT
        INNER JOIN InvoiceLine l ON l.LineId = CT.LineId
    )
    SELECT
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
    FROM InvoiceHeader h
    WHERE h.InvoiceId IN (SELECT InvoiceId FROM ChangedInvoices)
    FOR JSON PATH;
    
    --------------------------------------------------------------------------------------------------------------------------------------------------
# Get New Version
SELECT CHANGE_TRACKING_CURRENT_VERSION() AS new_version;


