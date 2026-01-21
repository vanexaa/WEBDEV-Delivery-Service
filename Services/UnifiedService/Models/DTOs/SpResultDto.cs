/*
 * Database-First Architecture - Stored Procedure Result DTOs
 * 
 * These DTOs represent the standardized output from stored procedures.
 * All business rules, validation, and state decisions come from the database.
 * The service layer only interprets these results.
 */

namespace UnifiedService.Models.DTOs;

/// <summary>
/// Generic result wrapper for stored procedure outputs.
/// All SPs return ResultCode and ResultMessage for business rule feedback.
/// </summary>
public class SpResult
{
    public int ResultCode { get; set; }
    public string ResultMessage { get; set; } = string.Empty;
    
    public bool IsSuccess => ResultCode == 0;
    public bool IsError => ResultCode < 0;
}

/// <summary>
/// Generic result with typed data payload from stored procedure.
/// </summary>
public class SpResult<T> : SpResult
{
    public T? Data { get; set; }
}

/// <summary>
/// Result for list-returning stored procedures.
/// </summary>
public class SpListResult<T> : SpResult
{
    public List<T> Data { get; set; } = new();
    public int Count => Data.Count;
}
