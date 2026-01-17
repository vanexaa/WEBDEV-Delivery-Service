/*
 * UnifiedService Architecture - Auth Controller
 * 
 * This controller is part of the UnifiedService running on port 5000.
 * Benefits: Single port for all services, simpler deployment, easier debugging.
 * 
 * All authentication endpoints are accessible at: http://localhost:5000/api/auth/*
 */

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using AuthService.Models;
using AuthService.Services;
using RiderService.Services;

namespace AuthService.Controllers;

/// <summary>
/// Controller for authentication operations including login, token validation, and user information.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ITokenService _tokenService;
    private readonly IRiderService _riderService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IAuthService authService,
        ITokenService tokenService,
        IRiderService riderService,
        ILogger<AuthController> logger)
    {
        _authService = authService ?? throw new ArgumentNullException(nameof(authService));
        _tokenService = tokenService ?? throw new ArgumentNullException(nameof(tokenService));
        _riderService = riderService ?? throw new ArgumentNullException(nameof(riderService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Authenticate user and receive JWT token
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult> Login([FromBody] LoginRequest request)
    {
        if (request == null)
        {
            _logger.LogWarning("Login called with null request");
            return BadRequest(new { message = "Request body is required" });
        }

        _logger.LogInformation("Login request received for username/email: {Username}", request.Username);

        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Username and password are required" });
        }

        try
        {
            var response = await _authService.LoginAsync(request);
            if (response == null)
            {
                _logger.LogWarning("Login failed for username: {Username}", request.Username);
                return Unauthorized(new { message = "Invalid username or password" });
            }

            _logger.LogInformation("User {Username} logged in successfully - UserId={UserId}, Role={Role}", 
                request.Username, response.User.UserId, response.User.Role);
            
            // If user is a rider, fetch and include riderId in response
            if (response.User.Role == "Rider" || response.User.Role == "rider")
            {
                try
                {
                    _logger.LogInformation("Attempting to fetch riderId for UserId={UserId} during login", response.User.UserId);
                    var rider = await _riderService.GetRiderByUserIdAsync(response.User.UserId);
                    if (rider != null)
                    {
                        response.User.RiderId = rider.RiderId;
                        _logger.LogInformation("RiderId={RiderId} included in login response for UserId={UserId}", 
                            rider.RiderId, response.User.UserId);
                    }
                    else
                    {
                        _logger.LogWarning("Rider record not found for UserId={UserId} during login. Rider profile may need to be created.", response.User.UserId);
                        // Continue without riderId - frontend will need to handle this case
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error fetching riderId during login for UserId={UserId}: {Error}", response.User.UserId, ex.Message);
                    // Continue without riderId - frontend can fetch it separately
                }
            }
            
            // Log token generation for debugging
            _logger.LogDebug("Generated token for UserId={UserId}, Role={Role}, RiderId={RiderId}", 
                response.User.UserId, response.User.Role, response.User.RiderId);

            var origin = Request.Headers["Origin"].FirstOrDefault();
            var isCrossSite = !string.IsNullOrWhiteSpace(origin) &&
                              !origin.Contains(Request.Host.Host, StringComparison.OrdinalIgnoreCase);
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps || isCrossSite,
                SameSite = isCrossSite ? SameSiteMode.None : SameSiteMode.Lax,
                Expires = response.ExpiresAt
            };
            Response.Cookies.Append("authToken", response.Token, cookieOptions);
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for username: {Username}", request.Username);
            return StatusCode(500, new { message = "An error occurred during login" });
        }
    }

    /// <summary>
    /// Get current authenticated user information
    /// </summary>
    [HttpGet("me")]
    public async Task<ActionResult> GetCurrentUser()
    {
        try
        {
            var token = ExtractTokenFromHeader();
            if (string.IsNullOrEmpty(token))
            {
                return Unauthorized(new { message = "Token is required" });
            }

            var principal = _tokenService.ValidateToken(token);
            if (principal == null)
            {
                return Unauthorized(new { message = "Invalid or expired token" });
            }

            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid token claims" });
            }

            var user = await _authService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            return Ok(new UserDto
            {
                UserId = user.UserId,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current user");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Validate JWT token
    /// </summary>
    [HttpGet("validate")]
    public ActionResult ValidateToken()
    {
        try
        {
            var token = ExtractTokenFromHeader();
            if (string.IsNullOrEmpty(token))
            {
                return Ok(new { isValid = false, message = "Token is required" });
            }

            var principal = _tokenService.ValidateToken(token);
            if (principal == null)
            {
                return Ok(new { isValid = false, message = "Invalid or expired token" });
            }

            var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var username = principal.FindFirst(ClaimTypes.Name)?.Value;
            var role = principal.FindFirst(ClaimTypes.Role)?.Value;

            return Ok(new
            {
                isValid = true,
                userId = userId,
                username = username,
                role = role
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating token");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    private string? ExtractTokenFromHeader()
    {
        var authHeader = Request.Headers["Authorization"].FirstOrDefault();
        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return Request.Cookies.TryGetValue("authToken", out var cookieToken) ? cookieToken : null;
        }

        return authHeader.Substring("Bearer ".Length).Trim();
    }
}
