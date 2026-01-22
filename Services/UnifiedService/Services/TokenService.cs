/*
 * UnifiedService Architecture - Token Service
 * 
 * Part of UnifiedService on port 5000.
 * Handles JWT token generation and validation for authentication.
 */
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace AuthService.Services;

public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<TokenService> _logger;

    public TokenService(IConfiguration configuration, ILogger<TokenService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public string GenerateToken(int userId, string username, string role)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey is not configured");
        var issuer = jwtSettings["Issuer"] ?? "AuthService";
        var audience = jwtSettings["Audience"] ?? "DeliveryService";
        var expiryMinutes = int.Parse(jwtSettings["ExpiryInMinutes"] ?? "60");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Name, username),
            new Claim(ClaimTypes.Role, role),
            new Claim(JwtRegisteredClaimNames.Sub, username),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            // Add additional claims for easier access
            new Claim("userId", userId.ToString()),
            new Claim("username", username),
            new Claim("role", role)
        };
        
        _logger.LogInformation("Generated JWT token for UserId={UserId}, Username={Username}, Role={Role}", 
            userId, username, role);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public ClaimsPrincipal? ValidateToken(string token)
    {
        var result = ValidateTokenWithDetails(token);
        return result.Principal;
    }

    public TokenValidationResult ValidateTokenWithDetails(string token)
    {
        try
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey is not configured");
            var issuer = jwtSettings["Issuer"] ?? "AuthService";
            var audience = jwtSettings["Audience"] ?? "DeliveryService";

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var tokenHandler = new JwtSecurityTokenHandler();

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateIssuer = true,
                ValidIssuer = issuer,
                ValidateAudience = true,
                ValidAudience = audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
            return new TokenValidationResult
            {
                IsValid = true,
                Principal = principal,
                IsExpired = false
            };
        }
        catch (SecurityTokenExpiredException ex)
        {
            _logger.LogWarning("Token expired: ValidTo={ValidTo}, CurrentTime={CurrentTime}", 
                ex.Expires, DateTime.UtcNow);
            return new TokenValidationResult
            {
                IsValid = false,
                IsExpired = true,
                ErrorMessage = "Token has expired. Please login again or use refresh token."
            };
        }
        catch (SecurityTokenInvalidSignatureException)
        {
            _logger.LogWarning("Token has invalid signature");
            return new TokenValidationResult
            {
                IsValid = false,
                IsExpired = false,
                ErrorMessage = "Token signature is invalid."
            };
        }
        catch (SecurityTokenInvalidIssuerException)
        {
            _logger.LogWarning("Token has invalid issuer");
            return new TokenValidationResult
            {
                IsValid = false,
                IsExpired = false,
                ErrorMessage = "Token issuer is invalid."
            };
        }
        catch (SecurityTokenInvalidAudienceException)
        {
            _logger.LogWarning("Token has invalid audience");
            return new TokenValidationResult
            {
                IsValid = false,
                IsExpired = false,
                ErrorMessage = "Token audience is invalid."
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Token validation failed: {Message}", ex.Message);
            return new TokenValidationResult
            {
                IsValid = false,
                IsExpired = false,
                ErrorMessage = "Token validation failed."
            };
        }
    }

    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }
}
