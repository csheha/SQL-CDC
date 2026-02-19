-- Setup InvoiceDB for Change Tracking
USE InvoiceDB;
GO

-- Enable Change Tracking on database
IF NOT EXISTS (SELECT * FROM sys.change_tracking_databases WHERE database_id = DB_ID('InvoiceDB'))
BEGIN
    ALTER DATABASE InvoiceDB
    SET CHANGE_TRACKING = ON
    (CHANGE_RETENTION = 2 DAYS, AUTO_CLEANUP = ON);
    PRINT 'Change Tracking enabled on InvoiceDB';
END
ELSE
BEGIN
    PRINT 'Change Tracking already enabled on InvoiceDB';
END
GO

-- Create ChangeTrackingSyncState table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChangeTrackingSyncState')
BEGIN
    CREATE TABLE ChangeTrackingSyncState (
        SyncName VARCHAR(100) PRIMARY KEY,
        LastSyncVersion BIGINT NOT NULL DEFAULT 0,
        LastProcessedInvoiceId INT NOT NULL DEFAULT 0,
        LastSyncTime DATETIME2 DEFAULT SYSDATETIME()
    );
    PRINT 'ChangeTrackingSyncState table created';
END
ELSE
BEGIN
    PRINT 'ChangeTrackingSyncState table already exists';
END
GO

-- Create Invoices table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Invoices')
BEGIN
    CREATE TABLE Invoices (
        InvoiceId INT PRIMARY KEY IDENTITY(1,1),
        InvoiceNumber VARCHAR(50) NOT NULL,
        CustomerCode VARCHAR(50) NOT NULL,
        InvoiceDate DATE NOT NULL,
        TotalAmount DECIMAL(18,2) NOT NULL,
        CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
        UpdatedAt DATETIME2 DEFAULT SYSDATETIME()
    );
    PRINT 'Invoices table created';
    
    -- Enable Change Tracking on Invoices table
    ALTER TABLE Invoices
    ENABLE CHANGE_TRACKING
    WITH (TRACK_COLUMNS_UPDATED = ON);
    PRINT 'Change Tracking enabled on Invoices table';
END
ELSE
BEGIN
    PRINT 'Invoices table already exists';
END
GO

-- Create InvoiceLines table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InvoiceLines')
BEGIN
    CREATE TABLE InvoiceLines (
        LineId INT PRIMARY KEY IDENTITY(1,1),
        InvoiceId INT NOT NULL,
        ProductCode VARCHAR(50) NOT NULL,
        Description VARCHAR(255),
        Quantity INT NOT NULL,
        UnitPrice DECIMAL(18,2) NOT NULL,
        LineTotal DECIMAL(18,2) NOT NULL,
        FOREIGN KEY (InvoiceId) REFERENCES Invoices(InvoiceId)
    );
    PRINT 'InvoiceLines table created';
END
ELSE
BEGIN
    PRINT 'InvoiceLines table already exists';
END
GO

PRINT 'InvoiceDB setup complete!';
GO
