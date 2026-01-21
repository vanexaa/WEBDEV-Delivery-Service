/*
 * UnifiedService Architecture - Auth Service Implementation
 * 
 * Part of UnifiedService on port 5000.
 * Handles user authentication and authorization.
 */
using Microsoft.EntityFrameworkCore;
using AuthService.Data;
using AuthService.Models;
using BCrypt.Net;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace AuthService.Services;

public class AuthService : IAuthService
{
    private static readonly HttpClient LogClient = new HttpClient();
    private const string LogEndpoint = "http://127.0.0.1:7243/ingest/6277f6d4-cb92-42c5-ab86-65314cd70192";
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

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        try
        {
            var identifier = request.Username?.Trim();
            if (string.IsNullOrWhiteSpace(identifier))
            {
                _logger.LogWarning("Login attempt with empty username/email identifier");
                #region agent log
                WriteDebugLog(
                    "H1",
                    "AuthService.cs:LoginAsync:missing-identifier",
                    "Login attempt missing identifier",
                    new { hasIdentifier = false });
                #endregion
                return null;
            }

            #region agent log
            // H1: Capture exact username being searched
            var totalUserCount = await _context.Users.CountAsync();
            var allUsernames = await _context.Users.Select(u => u.Username).ToListAsync();
            WriteDebugLog(
                "H1",
                "AuthService.cs:LoginAsync:entry",
                "Login attempt received",
                new { 
                    identifierLength = identifier.Length,
                    identifierValue = identifier,
                    totalUserCount,
                    existingUsernames = string.Join(",", allUsernames)
                });
            #endregion

            var user = await _context.Users
                .FirstOrDefaultAsync(u =>
                    u.Username == identifier || u.Email == identifier);

            _logger.LogInformation("Login lookup for {Identifier}: user {UserStatus}",
                identifier,
                user == null ? "NOT FOUND" : "FOUND");

            #region agent log
            WriteDebugLog(
                "H2",
                "AuthService.cs:LoginAsync:user-lookup",
                "User lookup result",
                new { 
                    userFound = user != null, 
                    isActive = user?.IsActive,
                    searchedFor = identifier,
                    foundUserId = user?.UserId
                });
            #endregion

            if (user == null)
            {
                _logger.LogWarning("Login attempt with invalid username: {Username}", request.Username);
                return null;
            }

            if (!user.IsActive)
            {
                _logger.LogWarning("Login attempt for inactive user: {Username}", user.Username);
                #region agent log
                WriteDebugLog(
                    "H2",
                    "AuthService.cs:LoginAsync:inactive",
                    "User is inactive",
                    new { userId = user.UserId });
                #endregion
                return null;
            }

            // Verify password using BCrypt
            var passwordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
            _logger.LogInformation("Password verification for {Identifier}: {PasswordStatus}",
                identifier,
                passwordValid ? "PASSED" : "FAILED");

            #region agent log
            WriteDebugLog(
                "H3",
                "AuthService.cs:LoginAsync:password-check",
                "Password verification result",
                new { passwordValid, userId = user.UserId });
            #endregion

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

            // Save refresh token
            var refreshTokenEntity = new RefreshToken
            {
                UserId = user.UserId,
                Token = refreshToken,
                ExpiresAt = refreshTokenExpiry,
                CreatedAt = DateTime.UtcNow
            };

            _context.RefreshTokens.Add(refreshTokenEntity);
            await _context.SaveChangesAsync();

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
            #region agent log
            WriteDebugLog(
                "H4",
                "AuthService.cs:LoginAsync:exception",
                "Login exception",
                new { exceptionType = ex.GetType().Name });
            #endregion
            return null;
        }
    }

    public async Task<User?> GetUserByIdAsync(int userId)
    {
        return await _context.Users.FindAsync(userId);
    }

    public async Task<User?> GetUserByUsernameAsync(string username)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Username == username);
    }

    private static void WriteDebugLog(string hypothesisId, string location, string message, object data)
    {
        try
        {
            var payload = new
            {
                sessionId = "debug-session",
                runId = "run1",
                hypothesisId,
                location,
                message,
                data,
                timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            };
            var logPath = @"c:\Users\Ideapad\OneDrive\Desktop\WEBDEV\.cursor\debug.log";
            var logDir = Path.GetDirectoryName(logPath);

            // Ensure directory exists
            if (!string.IsNullOrWhiteSpace(logDir) && !Directory.Exists(logDir))
            {
                Directory.CreateDirectory(logDir);
            }

            // Always try file write first
            File.AppendAllText(logPath, JsonSerializer.Serialize(payload) + Environment.NewLine);
        }
        catch
        {
            // Fallback to HTTP if file write fails
            try
            {
                var payload = new
                {
                    sessionId = "debug-session",
                    runId = "run1",
                    hypothesisId,
                    location,
                    message,
                    data,
                    timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                };
                var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                _ = LogClient.PostAsync(LogEndpoint, content);
            }
            catch
            {
                // Swallow logging errors to avoid breaking auth flow.
            }
        }
    }
}
