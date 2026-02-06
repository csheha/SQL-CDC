-- setup-invoice-db.sql with logs

-- Ensure required settings
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- Create database if not exists
IF DB_ID('InvoiceDB') IS NULL
BEGIN
    CREATE DATABASE InvoiceDB;
    PRINT 'Database InvoiceDB created.';
END
ELSE
BEGIN
    PRINT 'Database InvoiceDB already exists.';
END
GO

USE InvoiceDB;
GO

-- Invoice Header Table
IF OBJECT_ID('InvoiceHeader') IS NULL
BEGIN
    CREATE TABLE InvoiceHeader (
        InvoiceId      INT IDENTITY PRIMARY KEY,
        InvoiceNumber  VARCHAR(50) NOT NULL,
        CustomerCode   VARCHAR(50),
        InvoiceDate    DATE,
        TotalAmount    DECIMAL(12,2),
        LastUpdatedAt  DATETIME2 DEFAULT SYSDATETIME()
    );
    PRINT 'InvoiceHeader table created.';
END
ELSE
BEGIN
    PRINT 'InvoiceHeader table already exists.';
END
GO

-- Invoice Line Table
IF OBJECT_ID('InvoiceLine') IS NULL
BEGIN
    CREATE TABLE InvoiceLine (
        LineId      INT IDENTITY PRIMARY KEY,
        InvoiceId   INT NOT NULL,
        ItemCode    VARCHAR(50),
        Qty         DECIMAL(10,2),
        UnitPrice   DECIMAL(10,2),
        LineTotal   AS (Qty * UnitPrice) PERSISTED,
        LastUpdatedAt DATETIME2 DEFAULT SYSDATETIME(),
        CONSTRAINT FK_InvoiceLine_Header
            FOREIGN KEY (InvoiceId) REFERENCES InvoiceHeader(InvoiceId)
    );
    PRINT 'InvoiceLine table created.';
END
ELSE
BEGIN
    PRINT 'InvoiceLine table already exists.';
END
GO

-- Enable Change Tracking on DB
IF NOT EXISTS (
    SELECT 1 FROM sys.change_tracking_databases 
    WHERE database_id = DB_ID('InvoiceDB')
)
BEGIN
    ALTER DATABASE InvoiceDB
    SET CHANGE_TRACKING = ON
    (CHANGE_RETENTION = 3 DAYS, AUTO_CLEANUP = ON);
    PRINT 'Change Tracking enabled on database.';
    -- wait a moment to ensure DB change tracking is applied
    WAITFOR DELAY '00:00:01';
END
ELSE
BEGIN
    PRINT 'Change Tracking already enabled on database.';
END
GO

-- Enable Change Tracking on Tables (with check)
IF NOT EXISTS (
    SELECT 1 
    FROM sys.change_tracking_tables 
    WHERE object_id = OBJECT_ID('InvoiceHeader')
)
BEGIN
    ALTER TABLE InvoiceHeader
    ENABLE CHANGE_TRACKING
    WITH (TRACK_COLUMNS_UPDATED = ON);
    PRINT 'Change Tracking enabled on InvoiceHeader.';
END
ELSE
BEGIN
    PRINT 'Change Tracking already enabled on InvoiceHeader.';
END
GO

IF NOT EXISTS (
    SELECT 1 
    FROM sys.change_tracking_tables 
    WHERE object_id = OBJECT_ID('InvoiceLine')
)
BEGIN
    ALTER TABLE InvoiceLine
    ENABLE CHANGE_TRACKING
    WITH (TRACK_COLUMNS_UPDATED = ON);
    PRINT 'Change Tracking enabled on InvoiceLine.';
END
ELSE
BEGIN
    PRINT 'Change Tracking already enabled on InvoiceLine.';
END
GO

-- Sync State Table
IF OBJECT_ID('ChangeTrackingSyncState') IS NULL
BEGIN
    CREATE TABLE ChangeTrackingSyncState (
        SyncName              VARCHAR(100) PRIMARY KEY,
        LastSyncVersion       BIGINT NOT NULL,
        LastProcessedInvoiceId INT DEFAULT 0,
        LastSyncTime          DATETIME2 DEFAULT SYSDATETIME()
    );
    PRINT 'ChangeTrackingSyncState table created.';
END
ELSE
BEGIN
    PRINT 'ChangeTrackingSyncState table already exists.';
END
GO

PRINT 'Setup completed.';
GO
