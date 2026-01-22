/*
 * Database-First Architecture - Base DbContext for Stored Procedure Execution
 * 
 * ARCHITECTURAL RULES:
 * 1. EF Core is ONLY used for SP execution and result mapping
 * 2. NO LINQ queries allowed
 * 3. NO change tracking (Add, Update, Remove, SaveChanges)
 * 4. All data access through stored procedures only
 * 5. Business rules come from SP return codes and messages
 */

using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Data;
using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace UnifiedService.Data;

/// <summary>
/// Base DbContext providing stored procedure execution methods.
/// All derived contexts inherit these methods for SP-only data access.
/// </summary>
public abstract class StoredProcedureDbContext : DbContext
{
    private static readonly HttpClient LogClient = new HttpClient();
    private const string LogEndpoint = "http://127.0.0.1:7243/ingest/6277f6d4-cb92-42c5-ab86-65314cd70192";
    protected StoredProcedureDbContext(DbContextOptions options) : base(options)
    {
        // Disable change tracking - we only use SPs
        ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking;
        ChangeTracker.AutoDetectChangesEnabled = false;
    }

    /// <summary>
    /// Execute a stored procedure that returns a result set.
    /// </summary>
    public async Task<List<T>> ExecuteSpAsync<T>(string spName, params SqlParameter[] parameters) where T : class, new()
    {
        var connection = Database.GetDbConnection();
        
        #region agent log
        WriteDbLog("H8", "StoredProcedureDbContext:ExecuteSpAsync:start", "SP execution starting", new { spName, dbName = connection.Database, connectionState = connection.State.ToString() });
        #endregion
        
        await connection.OpenAsync();
        
        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = spName;
            command.CommandType = CommandType.StoredProcedure;
            
            if (parameters != null)
            {
                command.Parameters.AddRange(parameters);
            }

            var results = new List<T>();
            using var reader = await command.ExecuteReaderAsync();
            
            #region agent log
            WriteDbLog("H9", "StoredProcedureDbContext:ExecuteSpAsync:reader", "Reader created", new { hasRows = reader.HasRows, fieldCount = reader.FieldCount });
            #endregion
            
            while (await reader.ReadAsync())
            {
                var item = MapReaderToEntity<T>(reader);
                results.Add(item);
            }
            
            #region agent log
            WriteDbLog("H10", "StoredProcedureDbContext:ExecuteSpAsync:done", "SP execution complete", new { rowCount = results.Count });
            #endregion
            
            return results;
        }
        finally
        {
            await connection.CloseAsync();
        }
    }
    
    #region agent log helper
    private static void WriteDbLog(string hypothesisId, string location, string message, object data)
    {
        try
        {
            var payload = new { sessionId = "debug-session", runId = "run1", hypothesisId, location, message, data, timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() };
            var logPath = @"c:\Users\Ideapad\OneDrive\Desktop\WEBDEV\.cursor\debug.log";
            var logDir = Path.GetDirectoryName(logPath);

            if (!string.IsNullOrWhiteSpace(logDir) && !File.Exists(logDir))
            {
                Directory.CreateDirectory(logDir);
                File.AppendAllText(logPath, JsonSerializer.Serialize(payload) + Environment.NewLine);
                return;
            }

            if (!string.IsNullOrWhiteSpace(logDir) && Directory.Exists(logDir))
            {
                File.AppendAllText(logPath, JsonSerializer.Serialize(payload) + Environment.NewLine);
                return;
            }

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            _ = LogClient.PostAsync(LogEndpoint, content);
        }
        catch { }
    }
    #endregion

    /// <summary>
    /// Execute a stored procedure that returns a single row or null.
    /// </summary>
    public async Task<T?> ExecuteSpSingleAsync<T>(string spName, params SqlParameter[] parameters) where T : class, new()
    {
        var results = await ExecuteSpAsync<T>(spName, parameters);
        return results.FirstOrDefault();
    }

    /// <summary>
    /// Execute a stored procedure with output parameters (for ResultCode/ResultMessage pattern).
    /// Returns the result set and populates output parameters.
    /// </summary>
    public async Task<(List<T> Data, int ResultCode, string ResultMessage)> ExecuteSpWithResultAsync<T>(
        string spName, 
        SqlParameter[] inputParams,
        SqlParameter resultCodeParam,
        SqlParameter resultMessageParam) where T : class, new()
    {
        var connection = Database.GetDbConnection();
        await connection.OpenAsync();
        
        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = spName;
            command.CommandType = CommandType.StoredProcedure;
            
            if (inputParams != null)
            {
                command.Parameters.AddRange(inputParams);
            }
            
            command.Parameters.Add(resultCodeParam);
            command.Parameters.Add(resultMessageParam);

            var results = new List<T>();
            using var reader = await command.ExecuteReaderAsync();
            
            while (await reader.ReadAsync())
            {
                var item = MapReaderToEntity<T>(reader);
                results.Add(item);
            }
            
            // Close reader to access output params
            await reader.CloseAsync();
            
            var resultCode = resultCodeParam.Value != DBNull.Value ? (int)resultCodeParam.Value : 0;
            var resultMessage = resultMessageParam.Value?.ToString() ?? string.Empty;
            
            return (results, resultCode, resultMessage);
        }
        finally
        {
            await connection.CloseAsync();
        }
    }

    /// <summary>
    /// Execute a stored procedure that returns no result set (or just output params).
    /// </summary>
    public async Task<(int ResultCode, string ResultMessage)> ExecuteSpNonQueryAsync(
        string spName,
        SqlParameter[] inputParams,
        SqlParameter resultCodeParam,
        SqlParameter resultMessageParam)
    {
        var connection = Database.GetDbConnection();
        await connection.OpenAsync();
        
        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = spName;
            command.CommandType = CommandType.StoredProcedure;
            
            if (inputParams != null)
            {
                command.Parameters.AddRange(inputParams);
            }
            
            command.Parameters.Add(resultCodeParam);
            command.Parameters.Add(resultMessageParam);

            await command.ExecuteNonQueryAsync();
            
            var resultCode = resultCodeParam.Value != DBNull.Value ? (int)resultCodeParam.Value : 0;
            var resultMessage = resultMessageParam.Value?.ToString() ?? string.Empty;
            
            return (resultCode, resultMessage);
        }
        finally
        {
            await connection.CloseAsync();
        }
    }

    /// <summary>
    /// Execute a stored procedure that returns a scalar value.
    /// </summary>
    public async Task<object?> ExecuteSpScalarAsync(string spName, params SqlParameter[] parameters)
    {
        var connection = Database.GetDbConnection();
        await connection.OpenAsync();
        
        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = spName;
            command.CommandType = CommandType.StoredProcedure;
            
            if (parameters != null)
            {
                command.Parameters.AddRange(parameters);
            }

            return await command.ExecuteScalarAsync();
        }
        finally
        {
            await connection.CloseAsync();
        }
    }

    /// <summary>
    /// Map SqlDataReader row to entity using reflection.
    /// </summary>
    private static T MapReaderToEntity<T>(IDataReader reader) where T : class, new()
    {
        var entity = new T();
        var properties = typeof(T).GetProperties();
        
        for (int i = 0; i < reader.FieldCount; i++)
        {
            var columnName = reader.GetName(i);
            var value = reader.GetValue(i);
            
            if (value == DBNull.Value)
                continue;
            
            var property = properties.FirstOrDefault(p => 
                p.Name.Equals(columnName, StringComparison.OrdinalIgnoreCase));
            
            if (property != null && property.CanWrite)
            {
                try
                {
                    var targetType = Nullable.GetUnderlyingType(property.PropertyType) ?? property.PropertyType;
                    var convertedValue = Convert.ChangeType(value, targetType);
                    property.SetValue(entity, convertedValue);
                }
                catch
                {
                    // Skip properties that can't be converted
                }
            }
        }
        
        return entity;
    }

    /// <summary>
    /// Helper to create SqlParameter with proper null handling.
    /// </summary>
    protected static SqlParameter CreateParam(string name, object? value, SqlDbType dbType)
    {
        return new SqlParameter(name, dbType)
        {
            Value = value ?? DBNull.Value
        };
    }

    /// <summary>
    /// Helper to create output SqlParameter.
    /// </summary>
    protected static SqlParameter CreateOutputParam(string name, SqlDbType dbType, int size = 0)
    {
        var param = new SqlParameter(name, dbType)
        {
            Direction = ParameterDirection.Output
        };
        if (size > 0) param.Size = size;
        return param;
    }
}
