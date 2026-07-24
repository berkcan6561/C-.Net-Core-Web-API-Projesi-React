using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace otel_api.Migrations
{
    /// <inheritdoc />
    public partial class AddRoomImages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AvatarUrl",
                table: "Customers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ReceivePromotionalEmails",
                table: "Customers",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvatarUrl",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "ReceivePromotionalEmails",
                table: "Customers");
        }
    }
}
