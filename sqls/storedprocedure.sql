USE InvoiceDB;
GO  

CREATE OR ALTER PROCEDURE sp_GetInvoiceChanges
    @SinceVersion BIGINT,
    @Limit INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ToVersion BIGINT;
    SELECT @ToVersion = CHANGE_TRACKING_CURRENT_VERSION();

    ;WITH ChangedInvoices AS (
        -- Add alias 'CT' after CHANGETABLE
        SELECT CT.InvoiceId, CT.SYS_CHANGE_VERSION
        FROM CHANGETABLE(CHANGES InvoiceHeader, @SinceVersion) AS CT
        WHERE CT.SYS_CHANGE_VERSION <= @ToVersion

        UNION ALL

        -- Add alias 'CT' here too (and join to get InvoiceId)
        SELECT l.InvoiceId, CT.SYS_CHANGE_VERSION
        FROM CHANGETABLE(CHANGES InvoiceLine, @SinceVersion) AS CT
        INNER JOIN InvoiceLine l ON l.LineId = CT.LineId
        WHERE CT.SYS_CHANGE_VERSION <= @ToVersion
    ),
    Aggregated AS (
        SELECT
            InvoiceId,
            MAX(SYS_CHANGE_VERSION) AS ChangeVersion
        FROM ChangedInvoices
        GROUP BY InvoiceId
    )
    SELECT TOP (@Limit)
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
        ) AS Lines,
        @ToVersion AS ToVersion
    FROM Aggregated a
    JOIN InvoiceHeader h ON h.InvoiceId = a.InvoiceId
    ORDER BY a.ChangeVersion;
END;
GO