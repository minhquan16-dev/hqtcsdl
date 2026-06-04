-- Đây là setup SQLServer cho macOS vì không có Management Studio trên macOS, TUYỆT ĐỐI KHÔNG SỬA
RESTORE DATABASE JobCrawlDB
FROM DISK = '/var/opt/mssql/backup/JobCrawlDB.bak'
WITH
    MOVE 'JobCrawlDB' TO '/var/opt/mssql/data/JobCrawlDB.mdf',
    MOVE 'JobCrawlDB_log' TO '/var/opt/mssql/data/JobCrawlDB_log.ldf',
    REPLACE,
    RECOVERY;
GO

RESTORE FILELISTONLY
FROM DISK = '/var/opt/mssql/backup/JobDW.bak'

RESTORE DATABASE JobDW
FROM DISK = '/var/opt/mssql/backup/JobDW.bak'
WITH
MOVE 'JobDW' TO '/var/opt/mssql/data/JobDW.mdf',
MOVE 'JobDW_log' TO '/var/opt/mssql/data/JobDW_log.ldf',
REPLACE,
RECOVERY;