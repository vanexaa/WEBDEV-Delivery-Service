using Microsoft.EntityFrameworkCore;
using Ayawkomagbackend.Models;

namespace Ayawkomagbackend.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // DbSets
        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Rider> Riders { get; set; } = null!;
        public DbSet<Delivery> Deliveries { get; set; } = null!;
        public DbSet<StatusHistory> StatusHistories { get; set; } = null!;
        public DbSet<DeliveryFailure> DeliveryFailures { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Table names
            modelBuilder.Entity<User>().ToTable("Users");
            modelBuilder.Entity<Rider>().ToTable("Riders");
            modelBuilder.Entity<Delivery>().ToTable("Deliveries");
            modelBuilder.Entity<StatusHistory>().ToTable("StatusHistories");
            modelBuilder.Entity<DeliveryFailure>().ToTable("DeliveryFailures");

            // Unique index for User Email
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Delivery -> User relationship
            modelBuilder.Entity<Delivery>()
                .HasOne(d => d.User)
                .WithMany(u => u.Deliveries)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Delivery -> Rider relationship
            modelBuilder.Entity<Delivery>()
                .HasOne(d => d.Rider)
                .WithMany(r => r.Deliveries)
                .HasForeignKey(d => d.RiderId)
                .OnDelete(DeleteBehavior.SetNull);

            // StatusHistory -> Delivery relationship
            modelBuilder.Entity<StatusHistory>()
                .HasOne(sh => sh.Delivery)
                .WithMany(d => d.StatusHistories)
                .HasForeignKey(sh => sh.DeliveryId)
                .OnDelete(DeleteBehavior.Cascade);

            // DeliveryFailure -> Delivery relationship
            modelBuilder.Entity<DeliveryFailure>()
                .HasOne(df => df.Delivery)
                .WithMany(d => d.DeliveryFailures)
                .HasForeignKey(df => df.DeliveryId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
