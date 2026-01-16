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

    // Note: Orders are stored in OrderServiceDB, not DeliveryServiceDB
    // DeliveryServiceDB only stores Deliveries which reference OrderId
    public DbSet<Delivery> Deliveries { get; set; }
    public DbSet<DeliveryStatusHistory> DeliveryStatusHistory { get; set; }
    public DbSet<DeliveryProof> DeliveryProof { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Note: DeliveryOrder removed - orders are in OrderServiceDB only
        
        modelBuilder.Entity<Delivery>(entity =>
        {
            entity.HasKey(e => e.DeliveryId);
            // Note: Orders are in OrderServiceDB, not DeliveryServiceDB
            // Delivery references OrderId but cannot use foreign key across databases
            // No navigation property configured - orders must be fetched separately from OrderServiceDB
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
