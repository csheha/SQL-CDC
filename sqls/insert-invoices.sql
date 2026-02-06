-- Script: insert-invoices.sql
USE InvoiceDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

DECLARE @TotalInvoices INT = 25000;   -- Total invoice headers to insert
DECLARE @LinesPerInvoice INT = 3;     -- Lines per invoice
DECLARE @startTime DATETIME = GETDATE();

PRINT 'Deleting old data...';
DELETE FROM InvoiceLine;
DELETE FROM InvoiceHeader;


-- Step 1: Insert Invoice Headers (Initial batch)

;WITH Numbers AS (
    SELECT TOP (@TotalInvoices)
        ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
    FROM sys.objects a
    CROSS JOIN sys.objects b
    CROSS JOIN sys.objects c
)
INSERT INTO InvoiceHeader (
    InvoiceNumber,
    CustomerCode,
    InvoiceDate,
    TotalAmount
)
SELECT
    CONCAT('INV-', 300000 + n),
    CONCAT('CUST-', RIGHT('000000' + CAST(n AS VARCHAR(6)), 6)),
    DATEADD(DAY, n % 365, '2026-01-01'),
    0
FROM Numbers;

DECLARE @endTime DATETIME = GETDATE();
PRINT 'InvoiceHeader insert completed.';
SELECT 
    DATEDIFF(MS, @startTime, @endTime) AS ElapsedMilliseconds,
    CAST(@TotalInvoices * 1000.0 / DATEDIFF(MS, @startTime, @endTime) AS DECIMAL(10,2)) AS InvoicesPerSecond;

-- Step 2: Insert Invoice Lines (Initial batch)

;WITH LineNumbers AS (
    SELECT TOP (@LinesPerInvoice)
        ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS Num
    FROM sys.objects a
    CROSS JOIN sys.objects b
)
INSERT INTO InvoiceLine (
    InvoiceId,
    ItemCode,
    Qty,
    UnitPrice
)
SELECT
    h.InvoiceId,
    CONCAT('ITEM-', RIGHT('000' + CAST(l.Num AS VARCHAR(3)), 3)) AS ItemCode,
    (ABS(CHECKSUM(NEWID())) % 10) + 1 AS Qty,
    (ABS(CHECKSUM(NEWID())) % 500) + 50 AS UnitPrice
FROM InvoiceHeader h
CROSS JOIN LineNumbers l;

PRINT 'InvoiceLine insert completed.';
DECLARE @finalTime DATETIME = GETDATE();
SELECT 
    DATEDIFF(MS, @endTime, @finalTime) AS LineInsertMilliseconds,
    CAST(@TotalInvoices * @LinesPerInvoice * 1000.0 / DATEDIFF(MS, @endTime, @finalTime) AS DECIMAL(10,2)) AS LinesPerSecond;
