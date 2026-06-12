using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Knowledtree.Migrations
{
    /// <inheritdoc />
    public partial class Added_UserSeedPackages_And_PlantingSessionHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AppPlantingSessions_UserId",
                table: "AppPlantingSessions");

            migrationBuilder.CreateTable(
                name: "AppUserSeedPackages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TreePoolId = table.Column<int>(type: "integer", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    ExtraProperties = table.Column<string>(type: "text", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uuid", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    LastModifierId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppUserSeedPackages", x => x.Id);
                    table.CheckConstraint("CK_UserSeedPackage_Quantity_NonNegative", "\"Quantity\" >= 0");
                    table.ForeignKey(
                        name: "FK_AppUserSeedPackages_AbpUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AbpUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AppUserSeedPackages_AppTreePools_TreePoolId",
                        column: x => x.TreePoolId,
                        principalTable: "AppTreePools",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppPlantingSessions_UserId",
                table: "AppPlantingSessions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AppUserSeedPackages_TreePoolId",
                table: "AppUserSeedPackages",
                column: "TreePoolId");

            migrationBuilder.CreateIndex(
                name: "IX_AppUserSeedPackages_UserId_TreePoolId",
                table: "AppUserSeedPackages",
                columns: new[] { "UserId", "TreePoolId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppUserSeedPackages");

            migrationBuilder.DropIndex(
                name: "IX_AppPlantingSessions_UserId",
                table: "AppPlantingSessions");

            migrationBuilder.CreateIndex(
                name: "IX_AppPlantingSessions_UserId",
                table: "AppPlantingSessions",
                column: "UserId",
                unique: true);
        }
    }
}
