--Create Table-Valued Function (TVF) in SQL Server--

USE InvoiceDB;
GO

-- Create TVF that takes CustomerCode as parameter
CREATE OR ALTER FUNCTION dbo.fn_get_customer_invoices (
    @CustomerCode NVARCHAR(50)
)
RETURNS TABLE 
AS
RETURN
(
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
    JOIN InvoiceLine il ON ih.InvoiceId = il.InvoiceId
    WHERE ih.CustomerCode = @CustomerCode
);
GO