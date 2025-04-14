using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System.Net;
using System.Threading.Tasks;

namespace SuteraPassword.Middleware
{
    public class IPRestrictionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly string _allowedIp;

        public IPRestrictionMiddleware(RequestDelegate next, IConfiguration configuration)
        {
            _next = next;
            _allowedIp = configuration["AdminSettings:AllowedIp"]; // IP is stored in appsettings.json
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var remoteIp = context.Connection.RemoteIpAddress?.ToString();

            if (remoteIp != _allowedIp)
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsync("403 Forbidden: Unauthorized IP");
                return;
            }

            await _next(context);
        }
    }
}
