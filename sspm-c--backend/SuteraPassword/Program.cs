using Microsoft.AspNetCore.Authentication.JwtBearer; // ✅ Import JWT Authentication
using Microsoft.IdentityModel.Tokens; // ✅ Import Token Validation
using System.Text;
using SuteraPassword.Middleware;

var builder = WebApplication.CreateBuilder(args);


// Add configuration to DI container
builder.Services.AddSingleton<IConfiguration>(builder.Configuration);

// ✅ Access JWT settings from configuration
var jwtSettings = builder.Configuration.GetSection("JwtSettings");

// ✅ Add Authentication Service
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"], // 🔹 Read from appsettings.json
            ValidAudience = jwtSettings["Audience"], // 🔹 Read from appsettings.json
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings["SecretKey"])) // 🔹 Read key from appsettings.json
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy => policy.WithOrigins("http://localhost:8000", "http://127.0.0.1:5500")
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials());
});

var app = builder.Build();

app.UseCors("AllowFrontend");
app.UseHttpsRedirection();
app.UseAuthentication(); // ✅ Ensure authentication middleware is used
app.UseAuthorization();
app.MapControllers();

app.UseWhen(context => context.Request.Path.StartsWithSegments("/api/admin"), appBuilder =>
{
    appBuilder.UseMiddleware<IPRestrictionMiddleware>();
});

app.Run();
