using BCrypt.Net;

Console.WriteLine("BCrypt Password Hash Generator");
Console.WriteLine("==============================");
Console.WriteLine();

string password = "password123"; // Default test password
string hash = BCrypt.Net.BCrypt.HashPassword(password, BCrypt.Net.BCrypt.GenerateSalt(11));

Console.WriteLine($"Password: {password}");
Console.WriteLine($"Hash: {hash}");
Console.WriteLine();
Console.WriteLine("Copy this SQL to update your database:");
Console.WriteLine();
Console.WriteLine($"USE AuthServiceDB;");
Console.WriteLine($"GO");
Console.WriteLine($"UPDATE [dbo].[Users] SET PasswordHash = '{hash}' WHERE Username = 'admin';");
Console.WriteLine($"UPDATE [dbo].[Users] SET PasswordHash = '{hash}' WHERE Username = 'rider1';");
Console.WriteLine($"UPDATE [dbo].[Users] SET PasswordHash = '{hash}' WHERE Username = 'customer1';");
Console.WriteLine($"GO");
Console.WriteLine();

// Verify it works
bool isValid = BCrypt.Net.BCrypt.Verify(password, hash);
Console.WriteLine($"Verification: {(isValid ? "✓ SUCCESS" : "✗ FAILED")}");
Console.WriteLine();
