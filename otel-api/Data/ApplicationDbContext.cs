using Microsoft.EntityFrameworkCore;
using otel_api.Models;

namespace otel_api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<Reservation> Reservations { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<User> Users { get; set; }

      protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);
    
    modelBuilder.Entity<Room>()
        .Property(r => r.ImageUrls)
        .HasColumnType("jsonb");

    // Oda silindiğinde rezervasyonların silinmesini (Cascade Delete) SQL seviyesinde engelle
    modelBuilder.Entity<Reservation>()
        .HasOne(r => r.Room)
        .WithMany()
        .HasForeignKey(r => r.RoomId)
        .OnDelete(DeleteBehavior.Restrict);

    // Müşteri silindiğinde rezervasyonların silinmesini SQL seviyesinde engelle
    modelBuilder.Entity<Reservation>()
        .HasOne(r => r.Customer)
        .WithMany()
        .HasForeignKey(r => r.CustomerId)
        .OnDelete(DeleteBehavior.Restrict);
}
    }
}