// HashGenerator.cs - Standalone BCrypt hash generator utility
using BCrypt.Net;

class HashGenerator
{
    static void Main(string[] args)
    {
        string password = "password123";
        
        // Generate hash with 11 rounds
        string newHash = BCrypt.HashPassword(password, 11);
        
        Console.WriteLine("=== BCrypt Hash Generator ===");
        Console.WriteLine($"Password: {password}");
        Console.WriteLine($"Generated Hash: {newHash}");
        Console.WriteLine($"Hash Length: {newHash.Length} chars");
        
        // Test verification
        bool testVerify = BCrypt.Verify(password, newHash);
        Console.WriteLine($"\nVerification Test: {(testVerify ? "SUCCESS ✓" : "FAILED ✗")}");
        
        Console.WriteLine("\n=== SQL Update Command ===");
        Console.WriteLine($"UPDATE [dbo].[Users] SET PasswordHash = '{newHash}' WHERE Username IN ('admin', 'rider1', 'customer1');");
    }
}
