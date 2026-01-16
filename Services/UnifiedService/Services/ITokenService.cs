/*
 * UnifiedService Architecture - Token Service Interface
 * 
 * Part of UnifiedService on port 5000.
 * Defines JWT token service contract.
 */
using System.Security.Claims;

namespace AuthService.Services;

public interface ITokenService
{
    string GenerateToken(int userId, string username, string role);
    ClaimsPrincipal? ValidateToken(string token);
    string GenerateRefreshToken();
}
