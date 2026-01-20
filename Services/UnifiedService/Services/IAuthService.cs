/*
 * UnifiedService Architecture - Auth Service Interface
 * 
 * Part of UnifiedService on port 5000.
 * Defines authentication service contract.
 */
using AuthService.Models;

namespace AuthService.Services;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
    Task<User?> GetUserByIdAsync(int userId);
    Task<User?> GetUserByUsernameAsync(string username);
}
