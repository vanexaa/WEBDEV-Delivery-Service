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

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Rider> Riders { get; set; } = null!; 
        public DbSet<Delivery> Deliveries { get; set; } = null!; 

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>().ToTable("Users");

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Rider>().ToTable("Riders");

            modelBuilder.Entity<Delivery>()
                .HasOne(d => d.User)
                .WithMany()
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.Restrict);
            
            modelBuilder.Entity<Delivery>()
                .HasOne(d => d.Rider)
                .WithMany()
                .HasForeignKey(d => d.RiderId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
