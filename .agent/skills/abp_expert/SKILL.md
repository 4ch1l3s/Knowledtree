---
name: ABP Framework Expert
description: Best practices and conventions for developing with ABP Framework 9.x, based on official ABP.IO documentation and DDD principles.
---

# ABP Framework Expert Skill

This skill guides the agent to follow **official ABP Framework best practices** when modifying or extending this project.

## Official References
- [Module Architecture](https://abp.io/docs/latest/framework/architecture/best-practices/module-architecture)
- [Entity Best Practices](https://abp.io/docs/latest/framework/architecture/best-practices/entities)
- [Repository Best Practices](https://abp.io/docs/latest/framework/architecture/best-practices/repositories)
- [Domain Services Best Practices](https://abp.io/docs/latest/framework/architecture/best-practices/domain-services)
- [Application Services Best Practices](https://abp.io/docs/latest/framework/architecture/best-practices/application-services)
- [DTO Best Practices](https://abp.io/docs/latest/framework/architecture/best-practices/data-transfer-objects)
- [EF Core Integration](https://abp.io/docs/latest/framework/architecture/best-practices/entity-framework-core-integration)

---

## Project Context

| Component | Technology | Location |
|---|---|---|
| Backend | ABP Framework 9.0.4 (.NET 9) | `src/` |
| Admin Frontend | Blazor WebApp | `src/Knowledtree.Blazor.*` |
| Customer Frontend | React Native + TypeScript | `mobile/` |
| Database | PostgreSQL via EF Core | `src/Knowledtree.EntityFrameworkCore/` |
| DB Table Prefix | `App` | `KnowledtreeConsts.DbTablePrefix` |

---

## Solution Layer Map

When creating or modifying code, **always place files in the correct project/layer**:

| Layer | Project | What goes here |
|---|---|---|
| **Domain.Shared** | `Knowledtree.Domain.Shared` | Enums, constants, error codes, localization |
| **Domain** | `Knowledtree.Domain` | Entities, Aggregate Roots, Repository interfaces, Domain Services (Managers) |
| **Application.Contracts** | `Knowledtree.Application.Contracts` | AppService interfaces (`I*AppService`), DTOs, Permissions |
| **Application** | `Knowledtree.Application` | AppService implementations, AutoMapper profiles |
| **EntityFrameworkCore** | `Knowledtree.EntityFrameworkCore` | DbContext, Migrations, Repository implementations |
| **HttpApi** | `Knowledtree.HttpApi` | Custom Controllers (only if auto API is not sufficient) |
| **Web** | `Knowledtree.Web` / `Knowledtree.Blazor.*` | Pages, Menus, UI components |

---

## Best Practices by Building Block

### 1. Entities & Aggregate Roots

**Rules:**
- Use `Guid` as primary key for all aggregate roots. No composite keys.
- Inherit from `AggregateRoot<Guid>` or audited variants (`FullAuditedAggregateRoot<Guid>`, etc.).
- Define a **primary constructor** (public/internal) that validates required fields. Use `Check.NotNullOrWhiteSpace()`.
- Define a **protected parameterless constructor** for ORM compatibility.
- Make all properties and methods **`virtual`**.
- Use **private/protected setters** for properties that need consistency protection. Provide public setter methods (e.g., `SetTitle()`).
- **Reference other aggregate roots only by `Guid` Id**, never by navigation property.
- Initialize sub-collections in the primary constructor.
- Keep aggregates small.

**Example:** See `examples/Entity_AggregateRoot.cs`

### 2. Repositories

**Rules:**
- Define repository interfaces **in the Domain layer** for each aggregate root.
- Inherit interface from `IBasicRepository<TEntity, TKey>` (NOT `IRepository<>` — it exposes `IQueryable`).
- Do NOT define repositories for non-aggregate-root entities.
- Implement repositories **in the EntityFrameworkCore layer**, inheriting `EfCoreRepository<TDbContext, TEntity, TKey>`.
- Use the **DbContext interface** (not class) as the generic parameter.
- Pass `cancellationToken` using `GetCancellationToken()` helper.
- Create `IncludeDetails` extension methods for aggregates with sub-collections.

**Example:** See `examples/Repository.cs`

### 3. Domain Services (Managers)

**Rules:**
- Define in the **Domain layer**.
- Name with **`Manager` suffix** (e.g., `IssueManager`).
- Inherit from `DomainService`.
- Do NOT create interfaces unless needed for testing/mocking.
- Do NOT define GET methods — use repositories directly for reads.
- Only define methods that **mutate state**.
- Use **self-explanatory method names** (e.g., `AssignToAsync`, not `UpdateAsync`).
- Accept **domain objects** as parameters, not DTOs.
- Return **domain objects** only, never DTOs.
- Throw `BusinessException` for validation failures.
- Do NOT access `CurrentUser` — pass user data from the Application layer.

### 4. Application Services

**Rules:**
- Create **one AppService per aggregate root**.
- Define interface in `Application.Contracts` inheriting `IApplicationService`.
- Use `AppService` postfix (e.g., `IBookAppService` / `BookAppService`).
- Inherit implementation from `KnowledtreeAppService` (project base class).
- **All public methods must be `virtual`**. Use `protected virtual` instead of `private`.
- Use **DTOs** for all inputs/outputs — never return entities.
- Use **specifically designed repositories** (e.g., `IBookRepository`), not generic `IRepository<Book>`.
- Do NOT write LINQ/SQL queries in AppService — delegate to repository.
- Do NOT call other AppServices from the same module. Use domain layer or extract shared logic.
- For file handling: accept `byte[]`, not `IFormFile` or `Stream`.

**Example:** See `examples/AppService.cs`

### 5. DTOs

**Rules:**
- Define in `Application.Contracts`.
- Inherit from base DTO classes: `EntityDto<Guid>`, `AuditedEntityDto<Guid>`, `FullAuditedEntityDto<Guid>`, etc.
- For aggregate root DTOs, use **extensible** variants: `ExtensibleAuditedEntityDto<Guid>`.
- Use **public getters and setters**.
- Use **data annotations** for input validation (`[Required]`, `[StringLength]`, etc.).
- Do NOT add logic to DTOs (except `IValidatableObject` when needed).
- Mark DTOs as `[Serializable]`.

**Example:** See `examples/Dto.cs`

### 6. EF Core Integration

**Rules:**
- Add `DbSet<TEntity>` properties to `KnowledtreeDbContext` **only for aggregate roots**.
- Configure entity mapping in `OnModelCreating` using `ConfigureByConvention()`.
- Use `KnowledtreeConsts.DbTablePrefix` ("App") + entity name for table names.
- Set schema to `KnowledtreeConsts.DbSchema` (null).
- Do NOT enable lazy loading.

**Example (in DbContext.OnModelCreating):**
```csharp
builder.Entity<Book>(b =>
{
    b.ToTable(KnowledtreeConsts.DbTablePrefix + "Books", KnowledtreeConsts.DbSchema);
    b.ConfigureByConvention();
    // Additional configuration...
});
```

---

## Step-by-Step: Add a New Entity (End-to-End)

When asked to create a new entity (e.g., "Book"), follow these steps **in order**:

### Step 1: Domain.Shared
- Add any enums or constants related to the entity.
- Add max length constants (e.g., `BookConsts.MaxTitleLength`).

### Step 2: Domain
- Create the Entity/AggregateRoot class (see example).
- Create the Repository interface (`IBookRepository : IBasicRepository<Book, Guid>`).
- (Optional) Create a Domain Service if complex business logic is needed.

### Step 3: Application.Contracts
- Create DTOs: `BookDto`, `CreateUpdateBookDto`.
- Create the AppService interface: `IBookAppService`.
- Add Permissions if needed.

### Step 4: Application
- Implement `BookAppService`.
- Add AutoMapper mappings in `KnowledtreeApplicationAutoMapperProfile`.

### Step 5: EntityFrameworkCore
- Add `DbSet<Book>` to `KnowledtreeDbContext`.
- Configure entity mapping in `OnModelCreating`.
- (Optional) Implement custom repository: `EfCoreBookRepository`.
- Create a new EF Core migration.

### Step 6: HttpApi (usually automatic)
- ABP auto-generates API controllers from AppServices. Only create a manual controller if you need custom routing or file upload endpoints.

### Step 7: Migration
```bash
cd src/Knowledtree.EntityFrameworkCore
dotnet ef migrations add Added_Book
```
Then run `Knowledtree.DbMigrator` project to apply.
