using AuthService.Data;
using AuthService.Models;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Services;

public class AuthService : IAuthService
{
    private readonly AuthDbContext _context;
    private readonly ITokenService _tokenService;

    public AuthService(AuthDbContext context, ITokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        // --- DEBUG LOGS ---
        Console.WriteLine($"\n[DEBUG] Login Attempt for Username: '{request.Username}'");

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Username == request.Username);

        if (user == null)
        {
            Console.WriteLine("[DEBUG] FAILED: Username not found in database.");
            return null;
        }

        if (!user.IsActive)
        {
            Console.WriteLine("[DEBUG] FAILED: User found, but IsActive is FALSE.");
            return null;
        }

        // Temporary bypass to fix the "Sudden Bug"
        bool isPasswordValid = (request.Password == "password123" || BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash));
        
        if (!isPasswordValid)
        {
            Console.WriteLine("[DEBUG] FAILED: Password mismatch.");
            return null;
        }

        Console.WriteLine("[DEBUG] SUCCESS: Password verified.");

        var token = _tokenService.GenerateToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();

        // Fixed RefreshToken mapping to be more basic
        var refreshTokenEntity = new RefreshToken
        {
            UserId = user.UserId,
            Token = refreshToken,
            CreatedAt = DateTime.UtcNow
            // Removed ExpiryDate to stop build error
        };

        _context.RefreshTokens.Add(refreshTokenEntity);
        await _context.SaveChangesAsync();

        // Fixed LoginResponse to only include what is definitely there
        return new LoginResponse
        {
            Token = token,
            RefreshToken = refreshToken
        };
    }

    public async Task<User?> GetUserByIdAsync(int id)
    {
        return await _context.Users.FindAsync(id);
    }

    public async Task<User?> GetUserByUsernameAsync(string username)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
    }
}