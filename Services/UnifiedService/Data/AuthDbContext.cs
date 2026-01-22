/*
 * Database-First Architecture - Auth DbContext
 * 
 * ARCHITECTURAL RULES ENFORCED:
 * - ALL data access through stored procedures only
 * - DbSet properties kept for EF Core SP result mapping only
 * - NO LINQ queries against DbSets allowed
 * - NO Add/Update/Remove/SaveChanges (except via SP wrappers)
 */
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using AuthService.Models;
using System.Data;
using UnifiedService.Data;

namespace AuthService.Data;

/// <summary>
/// Auth database context - stored procedure execution only.
/// Connects to AuthServiceDB.
/// </summary>
public class AuthDbContext : StoredProcedureDbContext
{
    public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options)
    {
    }

    // DbSets kept for SP result mapping only - DO NOT use for LINQ queries
    public DbSet<User> Users { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId);
            entity.Property(e => e.Username).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Role).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.TokenId);
            entity.Property(e => e.Token).IsRequired().HasMaxLength(500);
            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasOne(e => e.User)
                  .WithMany(u => u.RefreshTokens)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }

    #region Auth Stored Procedure Methods

    /// <summary>
    /// sp_Auth_Login: Authenticate user by username/email.
    /// Returns user if found and active.
    /// </summary>
    public async Task<User?> SpAuthLoginAsync(string identifier)
    {
        var parameters = new[]
        {
            new SqlParameter("@Identifier", SqlDbType.NVarChar, 255) { Value = identifier }
        };

        return await ExecuteSpSingleAsync<User>("dbo.sp_Auth_Login", parameters);
    }

    /// <summary>
    /// sp_Auth_GetUserById: Get user by ID.
    /// </summary>
    public async Task<User?> SpAuthGetUserByIdAsync(int userId)
    {
        var parameters = new[]
        {
            new SqlParameter("@UserId", SqlDbType.Int) { Value = userId }
        };

        return await ExecuteSpSingleAsync<User>("dbo.sp_Auth_GetUserById", parameters);
    }

    /// <summary>
    /// sp_Auth_GetUserByUsername: Get user by username.
    /// </summary>
    public async Task<User?> SpAuthGetUserByUsernameAsync(string username)
    {
        var parameters = new[]
        {
            new SqlParameter("@Username", SqlDbType.NVarChar, 100) { Value = username }
        };

        return await ExecuteSpSingleAsync<User>("dbo.sp_Auth_GetUserByUsername", parameters);
    }

    /// <summary>
    /// sp_Auth_CreateUser: Create new user.
    /// Business rules enforced by database:
    /// - Username must be unique
    /// - Email must be unique
    /// - Role must be valid
    /// </summary>
    public async Task<(User? User, int ResultCode, string ResultMessage)> SpAuthCreateUserAsync(
        string username, string email, string passwordHash, string role)
    {
        var inputParams = new[]
        {
            new SqlParameter("@Username", SqlDbType.NVarChar, 100) { Value = username },
            new SqlParameter("@Email", SqlDbType.NVarChar, 255) { Value = email },
            new SqlParameter("@PasswordHash", SqlDbType.NVarChar, 500) { Value = passwordHash },
            new SqlParameter("@Role", SqlDbType.NVarChar, 50) { Value = role }
        };

        var resultCodeParam = CreateOutputParam("@ResultCode", SqlDbType.Int);
        var resultMessageParam = CreateOutputParam("@ResultMessage", SqlDbType.NVarChar, 500);

        var (data, resultCode, resultMessage) = await ExecuteSpWithResultAsync<User>(
            "dbo.sp_Auth_CreateUser", inputParams, resultCodeParam, resultMessageParam);

        return (data.FirstOrDefault(), resultCode, resultMessage);
    }

    /// <summary>
    /// sp_Auth_SaveRefreshToken: Save refresh token for user.
    /// </summary>
    public async Task<int> SpAuthSaveRefreshTokenAsync(int userId, string token, DateTime expiresAt)
    {
        var parameters = new[]
        {
            new SqlParameter("@UserId", SqlDbType.Int) { Value = userId },
            new SqlParameter("@Token", SqlDbType.NVarChar, 500) { Value = token },
            new SqlParameter("@ExpiresAt", SqlDbType.DateTime2) { Value = expiresAt }
        };

        var result = await ExecuteSpScalarAsync("dbo.sp_Auth_SaveRefreshToken", parameters);
        return result != null ? Convert.ToInt32(result) : 0;
    }

    /// <summary>
    /// sp_Auth_GetRefreshToken: Validate and get refresh token with user info.
    /// </summary>
    public async Task<RefreshTokenWithUser?> SpAuthGetRefreshTokenAsync(string token)
    {
        var parameters = new[]
        {
            new SqlParameter("@Token", SqlDbType.NVarChar, 500) { Value = token }
        };

        return await ExecuteSpSingleAsync<RefreshTokenWithUser>("dbo.sp_Auth_GetRefreshToken", parameters);
    }

    /// <summary>
    /// sp_Auth_RevokeRefreshToken: Delete refresh token.
    /// </summary>
    public async Task<int> SpAuthRevokeRefreshTokenAsync(string token)
    {
        var parameters = new[]
        {
            new SqlParameter("@Token", SqlDbType.NVarChar, 500) { Value = token }
        };

        var result = await ExecuteSpScalarAsync("dbo.sp_Auth_RevokeRefreshToken", parameters);
        return result != null ? Convert.ToInt32(result) : 0;
    }

    #endregion
}

/// <summary>
/// DTO for sp_Auth_GetRefreshToken result which joins token with user data.
/// </summary>
public class RefreshTokenWithUser
{
    public int TokenId { get; set; }
    public int UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
