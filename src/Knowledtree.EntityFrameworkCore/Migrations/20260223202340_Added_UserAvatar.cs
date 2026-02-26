using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Knowledtree.Migrations
{
    /// <inheritdoc />
    public partial class Added_UserAvatar : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppUserAvatars",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Content = table.Column<byte[]>(type: "bytea", nullable: false),
                    ContentType = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppUserAvatars", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppUserAvatars_UserId",
                table: "AppUserAvatars",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppUserAvatars");
        }
    }
}
