using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Knowledtree.Migrations
{
    /// <inheritdoc />
    public partial class Added_TreePlantingTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppTreePools",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    PoolType = table.Column<int>(type: "integer", nullable: false),
                    CurrencyType = table.Column<int>(type: "integer", nullable: false),
                    Cost = table.Column<int>(type: "integer", nullable: false),
                    CommonRate = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    RareRate = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    GoldRate = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    StartTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    EndTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    ExtraProperties = table.Column<string>(type: "text", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppTreePools", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AppTrees",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Description = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    Rarity = table.Column<int>(type: "integer", nullable: false),
                    ImageKey = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    BaseGoldYield = table.Column<int>(type: "integer", nullable: false),
                    ExtraProperties = table.Column<string>(type: "text", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppTrees", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AppPlantingSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TreePoolId = table.Column<int>(type: "integer", nullable: false),
                    ResultTreeId = table.Column<int>(type: "integer", nullable: true),
                    TagId = table.Column<int>(type: "integer", nullable: true),
                    PlannedDurationMinutes = table.Column<int>(type: "integer", nullable: false),
                    ClientStartTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    ServerStartTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    ClientEndTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ServerEndTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    DuplicateGemReward = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    ExtraProperties = table.Column<string>(type: "text", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uuid", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    LastModifierId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppPlantingSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppPlantingSessions_AbpUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AbpUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AppPlantingSessions_AppTags_TagId",
                        column: x => x.TagId,
                        principalTable: "AppTags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AppPlantingSessions_AppTreePools_TreePoolId",
                        column: x => x.TreePoolId,
                        principalTable: "AppTreePools",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AppPlantingSessions_AppTrees_ResultTreeId",
                        column: x => x.ResultTreeId,
                        principalTable: "AppTrees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AppTreePoolItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TreePoolId = table.Column<int>(type: "integer", nullable: false),
                    TreeId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppTreePoolItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppTreePoolItems_AppTreePools_TreePoolId",
                        column: x => x.TreePoolId,
                        principalTable: "AppTreePools",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AppTreePoolItems_AppTrees_TreeId",
                        column: x => x.TreeId,
                        principalTable: "AppTrees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AppUserTrees",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TreeId = table.Column<int>(type: "integer", nullable: false),
                    FirstObtainedFromPoolId = table.Column<int>(type: "integer", nullable: true),
                    FirstObtainedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    TotalObtainedCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    IsPlanted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    ExtraProperties = table.Column<string>(type: "text", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uuid", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    LastModifierId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppUserTrees", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppUserTrees_AbpUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AbpUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AppUserTrees_AppTreePools_FirstObtainedFromPoolId",
                        column: x => x.FirstObtainedFromPoolId,
                        principalTable: "AppTreePools",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AppUserTrees_AppTrees_TreeId",
                        column: x => x.TreeId,
                        principalTable: "AppTrees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppPlantingSessions_ResultTreeId",
                table: "AppPlantingSessions",
                column: "ResultTreeId");

            migrationBuilder.CreateIndex(
                name: "IX_AppPlantingSessions_Status",
                table: "AppPlantingSessions",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_AppPlantingSessions_TagId",
                table: "AppPlantingSessions",
                column: "TagId");

            migrationBuilder.CreateIndex(
                name: "IX_AppPlantingSessions_TreePoolId",
                table: "AppPlantingSessions",
                column: "TreePoolId");

            migrationBuilder.CreateIndex(
                name: "IX_AppPlantingSessions_UserId",
                table: "AppPlantingSessions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AppTreePoolItems_TreeId",
                table: "AppTreePoolItems",
                column: "TreeId");

            migrationBuilder.CreateIndex(
                name: "IX_AppTreePoolItems_TreePoolId_TreeId",
                table: "AppTreePoolItems",
                columns: new[] { "TreePoolId", "TreeId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AppTreePools_IsActive",
                table: "AppTreePools",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_AppUserTrees_FirstObtainedFromPoolId",
                table: "AppUserTrees",
                column: "FirstObtainedFromPoolId");

            migrationBuilder.CreateIndex(
                name: "IX_AppUserTrees_TreeId",
                table: "AppUserTrees",
                column: "TreeId");

            migrationBuilder.CreateIndex(
                name: "IX_AppUserTrees_UserId_TreeId",
                table: "AppUserTrees",
                columns: new[] { "UserId", "TreeId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppPlantingSessions");

            migrationBuilder.DropTable(
                name: "AppTreePoolItems");

            migrationBuilder.DropTable(
                name: "AppUserTrees");

            migrationBuilder.DropTable(
                name: "AppTreePools");

            migrationBuilder.DropTable(
                name: "AppTrees");
        }
    }
}
