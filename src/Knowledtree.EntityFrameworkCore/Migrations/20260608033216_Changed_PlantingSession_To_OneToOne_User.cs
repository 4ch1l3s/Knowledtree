using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Knowledtree.Migrations
{
    /// <inheritdoc />
    public partial class Changed_PlantingSession_To_OneToOne_User : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AppPlantingSessions_UserId",
                table: "AppPlantingSessions");

            migrationBuilder.CreateIndex(
                name: "IX_AppPlantingSessions_UserId",
                table: "AppPlantingSessions",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AppPlantingSessions_UserId",
                table: "AppPlantingSessions");

            migrationBuilder.CreateIndex(
                name: "IX_AppPlantingSessions_UserId",
                table: "AppPlantingSessions",
                column: "UserId");
        }
    }
}
