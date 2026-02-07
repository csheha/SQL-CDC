-- Create database if not exists
IF DB_ID('superset') IS NULL
BEGIN
    CREATE DATABASE superset;
    PRINT 'Database superset created.';
END
ELSE
BEGIN
    PRINT 'Database superset already exists.';
END
GO