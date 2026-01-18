// =============================================
// Password Hash Generator Utility
// Run this C# code to generate BCrypt password hashes
// =============================================
// 
// Usage:
// 1. Create a simple C# console app
// 2. Install package: dotnet add package BCrypt.Net-Next
// 3. Copy this code
// 4. Run and use the generated hash in SQL scripts
//

using BCrypt.Net;

Console.WriteLine("BCrypt Password Hash Generator");
Console.WriteLine("==============================");
Console.WriteLine();

string password = "password123"; // Change this to your desired password
string hash = BCrypt.HashPassword(password, BCrypt.GenerateSalt(11));

Console.WriteLine($"Password: {password}");
Console.WriteLine($"Hash: {hash}");
Console.WriteLine();
Console.WriteLine("Use this hash in your SQL INSERT/UPDATE statements:");
Console.WriteLine($"PasswordHash = '{hash}'");
Console.WriteLine();
Console.WriteLine("To verify the hash works:");
bool isValid = BCrypt.Verify(password, hash);
Console.WriteLine($"Verification: {isValid}");
