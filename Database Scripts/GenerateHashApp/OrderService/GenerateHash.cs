using BCrypt.Net;

// Generate a new BCrypt hash for "password123" 
// This can be used to update your database if the existing hash fails verification

string password = "password123";

// Generate with 11 salt rounds (same as existing hash format $2a$11$...)
string newHash = BCrypt.HashPassword(password, 11);

Console.WriteLine("=== BCrypt Hash Generator ===");
Console.WriteLine($"Password: {password}");
Console.WriteLine($"Generated Hash: {newHash}");
Console.WriteLine($"Hash Length: {newHash.Length}");

// Test if this hash can verify the password
bool testVerify = BCrypt.Verify(password, newHash);
Console.WriteLine($"Verification Test: {testVerify}");

Console.WriteLine("\n=== Use this SQL command to update your database ===");
Console.WriteLine($"UPDATE [dbo].[Users] SET PasswordHash = '{newHash}' WHERE Username IN ('admin', 'rider1', 'customer1');");
