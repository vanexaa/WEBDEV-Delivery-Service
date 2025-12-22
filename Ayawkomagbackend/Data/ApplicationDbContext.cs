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
        public DbSet<Feedback> Feedbacks { get; set; } = null!;
        public DbSet<DeliveryAssignment> DeliveryAssignments { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ---------------------------
            // Table names
            // ---------------------------
            modelBuilder.Entity<User>().ToTable("Users");
            modelBuilder.Entity<Rider>().ToTable("Riders");
            modelBuilder.Entity<Delivery>().ToTable("Deliveries");
            modelBuilder.Entity<StatusHistory>().ToTable("StatusHistories");
            modelBuilder.Entity<DeliveryFailure>().ToTable("DeliveryFailures");
            modelBuilder.Entity<Feedback>().ToTable("Feedbacks");
            modelBuilder.Entity<DeliveryAssignment>().ToTable("DeliveryAssignments");

            // ---------------------------
            // Indexes
            // ---------------------------
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // ---------------------------
            // Delivery relationships
            // ---------------------------
            modelBuilder.Entity<Delivery>()
                .HasOne(d => d.User)
                .WithMany(u => u.Deliveries)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Delivery>()
                .HasOne(d => d.Rider)
                .WithMany(r => r.Deliveries)
                .HasForeignKey(d => d.RiderId)
                .OnDelete(DeleteBehavior.SetNull);

            // ---------------------------
            // StatusHistory -> Delivery
            // ---------------------------
            modelBuilder.Entity<StatusHistory>()
                .HasOne(sh => sh.Delivery)
                .WithMany(d => d.StatusHistories)
                .HasForeignKey(sh => sh.DeliveryId)
                .OnDelete(DeleteBehavior.Cascade);

            // ---------------------------
            // DeliveryFailure -> Delivery
            // ---------------------------
            modelBuilder.Entity<DeliveryFailure>()
                .HasOne(df => df.Delivery)
                .WithMany(d => d.DeliveryFailures)
                .HasForeignKey(df => df.DeliveryId)
                .OnDelete(DeleteBehavior.Cascade);

            // ---------------------------
            // Feedback relationships
            // ---------------------------
            modelBuilder.Entity<Feedback>()
                .HasOne(f => f.Delivery)
                .WithMany(d => d.Feedbacks)
                .HasForeignKey(f => f.DeliveryId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Feedback>()
                .HasOne(f => f.Rider)
                .WithMany(r => r.Feedbacks)
                .HasForeignKey(f => f.RiderId)
                .OnDelete(DeleteBehavior.Cascade);

            // ---------------------------
            // DeliveryAssignment relationships
            // ---------------------------
            modelBuilder.Entity<DeliveryAssignment>()
                .HasOne(da => da.Delivery)
                .WithMany(d => d.Assignments)
                .HasForeignKey(da => da.DeliveryId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DeliveryAssignment>()
                .HasOne(da => da.Rider)
                .WithMany(r => r.Assignments)
                .HasForeignKey(da => da.RiderId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
