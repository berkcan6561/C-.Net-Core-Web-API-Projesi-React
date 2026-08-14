using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace otel_api.Migrations
{
    /// <inheritdoc />
    public partial class AddRoomJsonb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"ALTER TABLE ""Rooms"" ALTER COLUMN ""ImageUrls"" DROP DEFAULT;");
            migrationBuilder.Sql(@"ALTER TABLE ""Rooms"" ALTER COLUMN ""ImageUrls"" TYPE jsonb USING array_to_json(""ImageUrls"")::jsonb;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<List<string>>(
                name: "ImageUrls",
                table: "Rooms",
                type: "text[]",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "jsonb");
        }
    }
}
