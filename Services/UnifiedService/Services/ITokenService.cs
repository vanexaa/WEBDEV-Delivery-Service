/*
 * UnifiedService Architecture - Token Service Interface
 * 
 * Part of UnifiedService on port 5000.
 * Defines JWT token service contract.
 */
using System.Security.Claims;

namespace AuthService.Services;

/// <summary>
/// Token validation result with detailed error information.
/// </summary>
public class TokenValidationResult
{
    public bool IsValid { get; set; }
    public ClaimsPrincipal? Principal { get; set; }
    public string? ErrorMessage { get; set; }
    public bool IsExpired { get; set; }
}

public interface ITokenService
{
    string GenerateToken(int userId, string username, string role);
    ClaimsPrincipal? ValidateToken(string token);
    TokenValidationResult ValidateTokenWithDetails(string token);
    string GenerateRefreshToken();
}
