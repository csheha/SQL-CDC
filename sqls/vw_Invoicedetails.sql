USE InvoiceDB;
GO

-- Create view to join InvoiceHeader and InvoiceLine
CREATE VIEW dbo.vw_invoice_header_line AS 
SELECT 
    ih.InvoiceId, 
    ih.InvoiceNumber, 
    ih.CustomerCode, 
    ih.InvoiceDate, 
    ih.TotalAmount, 
    ih.LastUpdatedAt, 
    il.LineId, 
    il.ItemCode, 
    il.Qty, 
    il.UnitPrice, 
    il.LineTotal 
FROM InvoiceHeader ih 
JOIN InvoiceLine il ON ih.InvoiceId = il.InvoiceId;
GO

PRINT 'View created successfully.';
