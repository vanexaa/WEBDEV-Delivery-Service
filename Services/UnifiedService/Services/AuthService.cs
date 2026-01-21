/*
 * Database-First Architecture - Auth Service Implementation
 * 
 * ARCHITECTURAL RULES ENFORCED:
 * - ALL data access through stored procedures only
 * - NO LINQ queries against DbSets
 * - NO Add/Update/Remove/SaveChanges (except via SP wrappers)
 * - Service layer only executes SPs and interprets results
 */
using AuthService.Data;
using AuthService.Models;
using BCrypt.Net;

namespace AuthService.Services;

/// <summary>
/// Auth service - executes stored procedures for authentication operations.
/// All business rules (user validation, token management) enforced by database.
/// </summary>
public class AuthService : IAuthService
{
    private readonly AuthDbContext _context;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        AuthDbContext context,
        ITokenService tokenService,
        IConfiguration configuration,
        ILogger<AuthService> logger)
    {
        _context = context;
        _tokenService = tokenService;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Login user via sp_Auth_Login stored procedure.
    /// Password verification done in service layer (BCrypt).
    /// </summary>
    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        try
        {
            var identifier = request.Username?.Trim();
            if (string.IsNullOrWhiteSpace(identifier))
            {
                _logger.LogWarning("Login attempt with empty username/email identifier");
                return null;
            }

            // Get user via stored procedure
            var user = await _context.SpAuthLoginAsync(identifier);

            _logger.LogInformation("Login lookup for {Identifier}: user {UserStatus}",
                identifier,
                user == null ? "NOT FOUND" : "FOUND");

            if (user == null)
            {
                _logger.LogWarning("Login attempt with invalid username: {Username}", request.Username);
                return null;
            }

            if (!user.IsActive)
            {
                _logger.LogWarning("Login attempt for inactive user: {Username}", user.Username);
                return null;
            }

            // Verify password using BCrypt (done in service layer, not DB)
            var passwordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
            _logger.LogInformation("Password verification for {Identifier}: {PasswordStatus}",
                identifier,
                passwordValid ? "PASSED" : "FAILED");

            if (!passwordValid)
            {
                _logger.LogWarning("Login attempt with invalid password for user: {Username}", request.Username);
                return null;
            }

            // Generate JWT token
            var token = _tokenService.GenerateToken(user.UserId, user.Username, user.Role);

            // Generate refresh token
            var refreshToken = _tokenService.GenerateRefreshToken();
            var refreshTokenExpiry = DateTime.UtcNow.AddDays(7); // Refresh token valid for 7 days

            // Save refresh token via stored procedure
            await _context.SpAuthSaveRefreshTokenAsync(user.UserId, refreshToken, refreshTokenExpiry);

            // Calculate token expiry
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var expiryMinutes = int.Parse(jwtSettings["ExpiryInMinutes"] ?? "60");
            var expiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes);

            _logger.LogInformation("User {Username} logged in successfully", user.Username);

            return new LoginResponse
            {
                Token = token,
                RefreshToken = refreshToken,
                ExpiresAt = expiresAt,
                User = new UserDto
                {
                    UserId = user.UserId,
                    Username = user.Username,
                    Email = user.Email,
                    Role = user.Role
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for username: {Username}", request.Username);
            return null;
        }
    }

    /// <summary>
    /// Get user by ID via sp_Auth_GetUserById stored procedure.
    /// </summary>
    public async Task<User?> GetUserByIdAsync(int userId)
    {
        return await _context.SpAuthGetUserByIdAsync(userId);
    }

    /// <summary>
    /// Get user by username via sp_Auth_GetUserByUsername stored procedure.
    /// </summary>
    public async Task<User?> GetUserByUsernameAsync(string username)
    {
        return await _context.SpAuthGetUserByUsernameAsync(username);
    }
}
