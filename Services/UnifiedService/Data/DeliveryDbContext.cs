/*
 * UnifiedService Architecture - Delivery DbContext
 * 
 * Part of UnifiedService on port 5000.
 * Each domain maintains its own database (DeliveryServiceDB) for separation of concerns.
 */
using Microsoft.EntityFrameworkCore;
using DeliveryService.Models;

namespace DeliveryService.Data;

public class DeliveryDbContext : DbContext
{
    public DeliveryDbContext(DbContextOptions<DeliveryDbContext> options) : base(options)
    {
    }

    public DbSet<DeliveryOrder> Orders { get; set; }
    public DbSet<Delivery> Deliveries { get; set; }
    public DbSet<DeliveryStatusHistory> DeliveryStatusHistory { get; set; }
    public DbSet<DeliveryProof> DeliveryProof { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<DeliveryOrder>(entity =>
        {
            entity.HasKey(e => e.OrderId);
            entity.Property(e => e.CustomerName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.CustomerPhone).IsRequired().HasMaxLength(50);
            entity.Property(e => e.DeliveryAddress).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Status).HasMaxLength(50);
        });

        modelBuilder.Entity<Delivery>(entity =>
        {
            entity.HasKey(e => e.DeliveryId);
            entity.HasOne(e => e.Order)
                  .WithMany()
                  .HasForeignKey(e => e.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DeliveryStatusHistory>(entity =>
        {
            entity.HasKey(e => e.HistoryId);
            entity.HasOne(e => e.Delivery)
                  .WithMany()
                  .HasForeignKey(e => e.DeliveryId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DeliveryProof>(entity =>
        {
            entity.HasKey(e => e.ProofId);
            entity.HasOne(e => e.Delivery)
                  .WithMany()
                  .HasForeignKey(e => e.DeliveryId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
