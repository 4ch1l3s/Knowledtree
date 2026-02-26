using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Knowledtree.Migrations
{
    /// <inheritdoc />
    public partial class Added_UserAvatar_FK : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddForeignKey(
                name: "FK_AppUserAvatars_AbpUsers_UserId",
                table: "AppUserAvatars",
                column: "UserId",
                principalTable: "AbpUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppUserAvatars_AbpUsers_UserId",
                table: "AppUserAvatars");
        }
    }
}
