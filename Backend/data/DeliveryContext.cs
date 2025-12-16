using Microsoft.EntityFrameworkCore;
using Backend.Models;

namespace Backend.Data
{
    public class DeliveryContext : DbContext
    {
        public DeliveryContext(DbContextOptions<DeliveryContext> options)
            : base(options)
        {
        }

        // The DbSet property tells EF Core to create a 'Deliveries' table in the database.
        public DbSet<Delivery> Deliveries { get; set; } = default!;
    }
}