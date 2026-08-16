using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Knowledtree.Migrations
{
    /// <inheritdoc />
    public partial class Added_DailyMissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppDailyMissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    MissionType = table.Column<int>(type: "integer", nullable: false),
                    TargetValue = table.Column<int>(type: "integer", nullable: false),
                    RewardType = table.Column<int>(type: "integer", nullable: false),
                    RewardAmount = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    ExtraProperties = table.Column<string>(type: "text", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uuid", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    LastModifierId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppDailyMissions", x => x.Id);
                    table.CheckConstraint("CK_DailyMission_RewardAmount_Positive", "\"RewardAmount\" > 0");
                    table.CheckConstraint("CK_DailyMission_RewardType", "\"RewardType\" IN (0, 1)");
                    table.CheckConstraint("CK_DailyMission_TargetValue_Positive", "\"TargetValue\" > 0");
                });

            migrationBuilder.CreateTable(
                name: "AppUserDailyMissions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    DailyMissionId = table.Column<int>(type: "integer", nullable: true),
                    MissionDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Slot = table.Column<int>(type: "integer", nullable: false),
                    MissionName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    MissionDescription = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    MissionType = table.Column<int>(type: "integer", nullable: false),
                    TargetValue = table.Column<int>(type: "integer", nullable: false),
                    RewardType = table.Column<int>(type: "integer", nullable: false),
                    RewardAmount = table.Column<int>(type: "integer", nullable: false),
                    Progress = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    IsCompleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    IsClaimed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ClaimedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ExtraProperties = table.Column<string>(type: "text", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uuid", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    LastModifierId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppUserDailyMissions", x => x.Id);
                    table.CheckConstraint("CK_UserDailyMission_Progress_NonNegative", "\"Progress\" >= 0");
                    table.CheckConstraint("CK_UserDailyMission_RewardAmount_Positive", "\"RewardAmount\" > 0");
                    table.CheckConstraint("CK_UserDailyMission_RewardType", "\"RewardType\" IN (0, 1)");
                    table.CheckConstraint("CK_UserDailyMission_Slot", "\"Slot\" BETWEEN 1 AND 3");
                    table.CheckConstraint("CK_UserDailyMission_TargetValue_Positive", "\"TargetValue\" > 0");
                    table.ForeignKey(
                        name: "FK_AppUserDailyMissions_AbpUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AbpUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AppUserDailyMissions_AppDailyMissions_DailyMissionId",
                        column: x => x.DailyMissionId,
                        principalTable: "AppDailyMissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppDailyMissions_IsActive_RewardType",
                table: "AppDailyMissions",
                columns: new[] { "IsActive", "RewardType" });

            migrationBuilder.CreateIndex(
                name: "IX_AppUserDailyMissions_DailyMissionId",
                table: "AppUserDailyMissions",
                column: "DailyMissionId");

            migrationBuilder.CreateIndex(
                name: "IX_AppUserDailyMissions_UserId_MissionDate",
                table: "AppUserDailyMissions",
                columns: new[] { "UserId", "MissionDate" });

            migrationBuilder.CreateIndex(
                name: "IX_AppUserDailyMissions_UserId_MissionDate_Slot",
                table: "AppUserDailyMissions",
                columns: new[] { "UserId", "MissionDate", "Slot" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppUserDailyMissions");

            migrationBuilder.DropTable(
                name: "AppDailyMissions");
        }
    }
}
