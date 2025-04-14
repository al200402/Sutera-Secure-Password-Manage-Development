using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using Google.Apis.Auth;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.Extensions.Configuration;
using BCrypt.Net;
using System.Security.Claims;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Net.NetworkInformation;
using System.Net.Mail;
using System.Net;
using Microsoft.AspNetCore.Authorization;
using System.Collections.Concurrent;
using SuteraPassword.Models;
using Newtonsoft.Json.Linq;
using System.Data;


namespace UserManagementAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SSPM : ControllerBase
    {
        private readonly ILogger<SSPM> _logger;
        private readonly IConfiguration _configuration;
        private readonly IMongoCollection<BsonDocument> _usersCollection;
        private readonly IMongoCollection<BsonDocument> _passwordCollection;
        private static readonly string mongoConnectionString = Environment.GetEnvironmentVariable("MONGO_CONNECTION");
        private static ConcurrentDictionary<string, (string Code, DateTime Expiry)> otpStore = new ConcurrentDictionary<string, (string, DateTime)>();
        private const int OtpExpiryMinutes = 5;


        public SSPM(ILogger<SSPM> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
            try
            {
                var mongoClient = new MongoClient(mongoConnectionString);

                var database = mongoClient.GetDatabase("SSPM"); // Use your actual database name here

                _usersCollection = database.GetCollection<BsonDocument>("Users");
                _passwordCollection = database.GetCollection<BsonDocument>("Password");
                _logger.LogInformation("Database Connect Succesfully");


            }
            catch (Exception ex)
            {
                _logger.LogInformation($"Error: {ex.Message}");
            }
        }

        #region SignIn Page

        [HttpPost("check-email")]
        public async Task<IActionResult> CheckEmail([FromBody] EmailRequest request)
        {
            var filter = Builders<BsonDocument>.Filter.Eq("email", request.Email);
            var userRecords = await _usersCollection.Find(filter).ToListAsync();

            if (userRecords.Count == 0)
            {
                return NotFound(new { Message = "Email not found. Please contact an administrator.", Code = 404 });
            }

            string status = userRecords[0]["status"].AsString;

            if (status == "inactive")
            {
                return BadRequest(new { Message = "Account inactive. Please verify using Google.", Code = 400 });
            }

            return Ok(new { Message = "Account found and active.", Code = 200 });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {

            // Input validation
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { Message = "Email and password are required.", Code = 400 });
            }

            var filter = Builders<BsonDocument>.Filter.Eq("email", request.Email);
            var userRecords = await _usersCollection.Find(filter).ToListAsync();

            if (userRecords.Count == 0)
            {
                return NotFound(new { Message = "Email not found. Please contact an administrator.", Code = 404 });
            }

            string password = userRecords[0]["password"].AsString.Trim();

            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password.Trim(), password);
            if (!isPasswordValid)
            {
                return Unauthorized(new { Message = "Invalid password.", Code = 401 });
            }

            string status = userRecords[0]["status"].AsString;

            if (status != "active")
            {
                return BadRequest(new { Message = "Account inactive. Please verify using Google.", Code = 400 });
            }

            string role = userRecords[0]["role"].AsString;
            string username = userRecords[0]["username"].AsString;

            // ✅ IP Restriction Logic for Admin
            // Access HttpContext directly
            var remoteIp = HttpContext.Connection.RemoteIpAddress?.ToString();
            _logger.LogInformation($"Detected IP: {remoteIp}");

            // Handle localhost IP cases
            if (remoteIp == "::1")
            {
                remoteIp = "127.0.0.1"; // Force IPv4 format for localhost
            }

            string allowedAdminIp = _configuration["AdminSettings:AllowedIp"];  // Read from appsettings.json


            if (role == "Admin" && remoteIp != allowedAdminIp)
            {
                return BadRequest(new { Message = "Forbidden: Unauthorized Devices", Code = 403 });
            }

            // Generate JWT token
            var token = GenerateJwtToken(request.Email, role);

            //User Statitistic
            // Calculate total users
            var totalUsersCount = await _usersCollection.CountDocumentsAsync(new BsonDocument());

            // Calculate total active users
            var activeUsersFilter = Builders<BsonDocument>.Filter.Eq("status", "active");
            var totalActiveUsersCount = await _usersCollection.CountDocumentsAsync(activeUsersFilter);

            // Calculate total inactive users
            var inactiveUsersFilter = Builders<BsonDocument>.Filter.Eq("status", "inactive");
            var totalInactiveUsersCount = await _usersCollection.CountDocumentsAsync(inactiveUsersFilter);

            // Superuser
            var superUserFilter = Builders<BsonDocument>.Filter.Eq("role", "Superuser");
            var totalSuperUsersCount = await _usersCollection.CountDocumentsAsync(superUserFilter);
            var activeSuperUsers = await _usersCollection.CountDocumentsAsync(Builders<BsonDocument>.Filter.And(
                                            superUserFilter,
                                            activeUsersFilter));
            var inactiveSuperUsers = totalSuperUsersCount - activeSuperUsers;

            // Users (Regular Users)
            var userFilter = Builders<BsonDocument>.Filter.Eq("role", "User");
            var totalRegularUsersCount = await _usersCollection.CountDocumentsAsync(userFilter);
            var activeRegularUsers = await _usersCollection.CountDocumentsAsync(Builders<BsonDocument>.Filter.And(
                                            userFilter,
                                            activeUsersFilter));
            var inactiveRegularUsers = totalRegularUsersCount - activeRegularUsers;


            // Admins
            var adminFilter = Builders<BsonDocument>.Filter.Eq("role", "Admin");
            var totalAdminUsersCount = await _usersCollection.CountDocumentsAsync(adminFilter);
            var activeAdminUsers = await _usersCollection.CountDocumentsAsync(Builders<BsonDocument>.Filter.And(
                                            adminFilter,
                                            activeUsersFilter));
            var inactiveAdminUsers = totalAdminUsersCount - activeAdminUsers;

            //// Calculate total Superusers
            //var superUserFilter = Builders<BsonDocument>.Filter.Eq("role", "Superuser");
            //var totalSuperUsersCount = await _usersCollection.CountDocumentsAsync(superUserFilter);

            //// Calculate total Users
            //var userFilter = Builders<BsonDocument>.Filter.Eq("role", "User");
            //var totalRegularUsersCount = await _usersCollection.CountDocumentsAsync(userFilter);

            // Return the results in a structured list
            var result = new
            {
                TotalUsers = totalUsersCount,
                ActiveUsers = totalActiveUsersCount,
                InactiveUsers = totalInactiveUsersCount,
                SuperUsers = totalSuperUsersCount,
                ActiveSuperUsers = activeSuperUsers,
                InactiveSuperUsers = inactiveSuperUsers,
                RegularUsers = totalRegularUsersCount,
                ActiveRegularUsers = activeRegularUsers,
                InactiveRegularUsers = inactiveRegularUsers,
                AdminUsers = totalAdminUsersCount,
                ActiveAdminUsers = activeAdminUsers,
                InactiveAdminUsers = inactiveAdminUsers
            };

            // Return token
            return Ok(new { Message = "Login successful.", Code = 200, Token = token, Role = role, data=result, Username=username });
        }

        [HttpPost("create-password")]
        public async Task<IActionResult> CreatePassword([FromBody] LoginRequest request)
        {
            // Input validation
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { Message = "Password are required.", Code = 400 });
            }

            var filter = Builders<BsonDocument>.Filter.Eq("email", request.Email);
            var userRecords = await _usersCollection.Find(filter).ToListAsync();

            if (userRecords.Count == 0)
            {
                return NotFound(new { Message = "Email not exist", Code = 404 });
            }

            try
            {
                // Hash password jika ada password baru
                string hashedPassword = userRecords[0]["status"].AsString; // Simpan password lama sebagai default
                if (!string.IsNullOrEmpty(request.Password))
                {
                    hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);
                }

                // Update fields yang diperlukan
                var update = Builders<BsonDocument>.Update // Update status
                    .Set("password", hashedPassword)
                    .Set("status","active");

                // Apply update ke database
                await _usersCollection.UpdateOneAsync(filter, update);

                return Ok(new { message = "Password successfully updated." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Password update failed.", error = ex.Message });
            }


        }

        #endregion

        #region User Function

        [Authorize]
        [HttpPost("add-user")]
        public async Task<IActionResult> AddSupervisor([FromBody] UpdateRoleRequest request)
        {
            try
            {

                var filter = Builders<BsonDocument>.Filter.Eq("email", request.Email);
                var userRecords = await _usersCollection.Find(filter).ToListAsync();

                if (userRecords.Count != 0)
                {
                    return Conflict(new { Message = "User already exists.", Code = 409 });
                }

                // Create a new user using BsonDocument
                var supervisor = new BsonDocument
            {
                { "_id", ObjectId.GenerateNewId() },
                { "email", request.Email.Trim().ToLower() },
                { "password", string.Empty },  // Password to be set later
                { "role", request.Role },
                { "username", string.Empty },
                { "status", "inactive" }
            };


                await _usersCollection.InsertOneAsync(supervisor);
                return Ok(new { Message = "User added successfully.", Code = 200 });
            }
            catch (Exception ex)
            {
                _logger.LogInformation("Error:", ex.Message);
                return StatusCode(500, new { Error = ex.Message, Code = 500 });
            }
        }

        [Authorize]
        [HttpPost("user-statistic")]
        public async Task<IActionResult> UserStatistic()
        {
            try
            {
                //User Statitistic
                // Calculate total users
                var totalUsersCount = await _usersCollection.CountDocumentsAsync(new BsonDocument());

                // Calculate total active users
                var activeUsersFilter = Builders<BsonDocument>.Filter.Eq("status", "active");
                var totalActiveUsersCount = await _usersCollection.CountDocumentsAsync(activeUsersFilter);

                // Calculate total inactive users
                var inactiveUsersFilter = Builders<BsonDocument>.Filter.Eq("status", "inactive");
                var totalInactiveUsersCount = await _usersCollection.CountDocumentsAsync(inactiveUsersFilter);

                // Superuser
                var superUserFilter = Builders<BsonDocument>.Filter.Eq("role", "Superuser");
                var totalSuperUsersCount = await _usersCollection.CountDocumentsAsync(superUserFilter);
                var activeSuperUsers = await _usersCollection.CountDocumentsAsync(Builders<BsonDocument>.Filter.And(
                                                superUserFilter,
                                                activeUsersFilter));
                var inactiveSuperUsers = totalSuperUsersCount - activeSuperUsers;

                // Users (Regular Users)
                var userFilter = Builders<BsonDocument>.Filter.Eq("role", "User");
                var totalRegularUsersCount = await _usersCollection.CountDocumentsAsync(userFilter);
                var activeRegularUsers = await _usersCollection.CountDocumentsAsync(Builders<BsonDocument>.Filter.And(
                                                userFilter,
                                                activeUsersFilter));
                var inactiveRegularUsers = totalRegularUsersCount - activeRegularUsers;


                // Admins
                var adminFilter = Builders<BsonDocument>.Filter.Eq("role", "Admin");
                var totalAdminUsersCount = await _usersCollection.CountDocumentsAsync(adminFilter);
                var activeAdminUsers = await _usersCollection.CountDocumentsAsync(Builders<BsonDocument>.Filter.And(
                                                adminFilter,
                                                activeUsersFilter));
                var inactiveAdminUsers = totalAdminUsersCount - activeAdminUsers;

                // Return the results in a structured list
                var result = new
                {
                    TotalUsers = totalUsersCount,
                    ActiveUsers = totalActiveUsersCount,
                    InactiveUsers = totalInactiveUsersCount,
                    SuperUsers = totalSuperUsersCount,
                    ActiveSuperUsers = activeSuperUsers,
                    InactiveSuperUsers = inactiveSuperUsers,
                    RegularUsers = totalRegularUsersCount,
                    ActiveRegularUsers = activeRegularUsers,
                    InactiveRegularUsers = inactiveRegularUsers,
                    AdminUsers = totalAdminUsersCount,
                    ActiveAdminUsers = activeAdminUsers,
                    InactiveAdminUsers = inactiveAdminUsers
                };

                // Return token
                return Ok(new { Message = "Fetch statistic successful.", data = result });
            }
            catch (Exception ex)
            {
                _logger.LogInformation("Error:", ex.Message);
                return StatusCode(500, new { Error = ex.Message, Code = 500 });
            }
        }

        [Authorize]
        [HttpPost("user-list")]
        public async Task<IActionResult> ListUser([FromBody] RoleRequest request)
        {
            try
            {
                string role = request.Role;

                if (string.IsNullOrEmpty(role))
                {
                    return BadRequest(new { Error = "Role is required", Code = 400 });
                }

                if (role == "Admin")
                {

                    // Filter based on the role provided
                    var filter = Builders<BsonDocument>.Filter.Or(
                            Builders<BsonDocument>.Filter.Eq("role", "Superuser"),
                            Builders<BsonDocument>.Filter.Eq("role", "User")
                        );
                    // Retrieve the list of users based on the role
                    var users = await _usersCollection.Find(filter).ToListAsync();

                    // Convert BSON documents to JSON format
                    var userList = new List<object>();
                    foreach (var user in users)
                    {
                        userList.Add(user.ToDictionary());
                    }

                    return Ok(new { Users = userList, Code = 200 });
                }
                else
                {
                    // Filter based on the role provided
                    var filter = Builders<BsonDocument>.Filter.Eq("role", "User");

                    // Retrieve the list of users based on the role
                    var users = await _usersCollection.Find(filter).ToListAsync();

                    // Convert BSON documents to JSON format
                    var userList = new List<object>();
                    foreach (var user in users)
                    {
                        userList.Add(user.ToDictionary());
                    }

                    return Ok(new { Users = userList, Code = 200 });
                }

            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message, Code = 500 });
            }

        }

        [Authorize]
        [HttpDelete("delete-user")]
        public async Task<IActionResult> DeleteUser([FromBody] EmailRequest request)
        {
            try
            {

                var filter = Builders<BsonDocument>.Filter.Eq("email", request.Email);

                // Delete user from the database
                var result = await _usersCollection.DeleteOneAsync(filter);

                if (result.DeletedCount > 0)
                {
                    return Ok(new { Message = "User deleted successfully.", Code = 200 });
                }
                else
                {
                    return NotFound(new { Message = "User not found.", Code = 404 });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message, Code = 500 });
            }
        }

        [Authorize]
        [HttpPost("profile-update")]
         public async Task<IActionResult> UpdateProfile([FromBody] ProfileUpdate request)
         {
             // Cari user berdasarkan email
             var filter = Builders<BsonDocument>.Filter.Eq("email", request.Email);
            var userRecords = await _usersCollection.Find(filter).ToListAsync();
             if (userRecords.Count == 0)
            {
                return NotFound(new { Message = "Email not found. Please contact an administrator.", Code = 404 });
            }

             try
             {
                 // Hash password jika ada password baru
                 /*string hashedPassword = userRecords[0]["status"].AsString; // Simpan password lama sebagai default
                 if (!string.IsNullOrEmpty(request.Password))
                 {
                     hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);
                 }*/

                 // Update fields yang diperlukan
                 var update = Builders<BsonDocument>.Update // Update first name
                     .Set("username", request.Username); // Update username

                 // Apply update ke database
                 await _usersCollection.UpdateOneAsync(filter, update);

                 return Ok(new { message = "Profile successfully updated." });
             }
             catch (Exception ex)
             {
                 return BadRequest(new { message = "Profile update failed.", error = ex.Message });
             }
         }

        [Authorize]
        [HttpGet("get-user-role")]
        public async Task<IActionResult> GetUserRole([FromQuery] string email)
        {
            var filter = Builders<BsonDocument>.Filter.Eq("email", email);
            var user = await _usersCollection.Find(filter).FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound(new { Message = "User not found", Code = 404 });
            }

            return Ok(new { Role = user["role"].AsString });
        }

        [Authorize]
        [HttpPost("update-role")]
        public async Task<IActionResult> UpdateUserRole([FromBody] UpdateRoleRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Role))
            {
                return BadRequest(new { Message = "Email and Role are required", Code = 400 });
            }

            var filter = Builders<BsonDocument>.Filter.Eq("email", request.Email);
            var update = Builders<BsonDocument>.Update.Set("role", request.Role);

            var result = await _usersCollection.UpdateOneAsync(filter, update);

            if (result.ModifiedCount == 0)
            {
                return BadRequest(new { Message = "No changes were made", Code = 400 });
            }

            return Ok(new { Message = "User role updated successfully", Code = 200 });
        }

        [Authorize]
        [HttpPost("stored-password")]
        public async Task<IActionResult> StoredPassword([FromBody] LoginRequest request)
        {
            // Input validation
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { Message = "Email and password are required.", Code = 400 });
            }            

            // Create a new document to store
            var newPasswordDocument = new BsonDocument
            {
                { "email", request.Email.Trim() },
                { "password", request.Password }
            };

            // Insert the document into MongoDB
            await _passwordCollection.InsertOneAsync(newPasswordDocument);

            return Ok(new { Message = "Password stored successfully.", Code = 200 });
        }

        [Authorize]
        [HttpPost("list-password")]
        public async Task<IActionResult> ListPassword([FromBody] EmailRequest request)
        {
            // Input validation
            if (string.IsNullOrEmpty(request.Email) )
            {
                return BadRequest(new { Message = "Email are required.", Code = 400 });
            }


            // Find password records for the given email
            var filter = Builders<BsonDocument>.Filter.Eq("email", request.Email.Trim());
            var userPasswords = await _passwordCollection.Find(filter).ToListAsync();

            // Check if no records are found
            if (userPasswords.Count == 0)
            {
                return NotFound(new { Message = "No passwords found for the provided email.", Code = 404 });
            }

            // Extract and format password details
            var passwordList = userPasswords.Select(doc => new
            {
                Password = doc["password"].AsString 
            }).ToList();

            // Return the password list
            return Ok(new { Message = "Passwords retrieved successfully.", Code = 200, Data = passwordList });
        }



        #endregion

        #region Google Verification

        [HttpPost("send-verification-code")]
        public async Task<IActionResult> SendVerificationCode([FromBody] EmailRequest request)
        {
            var filter = Builders<BsonDocument>.Filter.Eq("email", request.Email);
            var userRecords = await _usersCollection.Find(filter).ToListAsync();

            if (userRecords.Count == 0)
            {
                return NotFound(new { Message = "Email not found. Please contact admin.", Code = 404 });
            }

            string otpCode = new Random().Next(100000, 999999).ToString();
            DateTime expiryTime = DateTime.UtcNow.AddMinutes(OtpExpiryMinutes); // Set expiration

            otpStore[request.Email] = (otpCode, expiryTime);

            string from = "aliffmuhammad515@gmail.com";
            string pass = "majt hdyo pttq gdhd";
            string subject = "Your OTP Code";
            string body = $"Your verification code is: {otpCode}";

            try
            {
                using (var smtp = new SmtpClient("smtp.gmail.com"))
                {
                    smtp.EnableSsl = true;
                    smtp.Port = 587;
                    smtp.Credentials = new NetworkCredential(from, pass);
                    smtp.DeliveryMethod = SmtpDeliveryMethod.Network;

                    using (var message = new MailMessage(from, request.Email, subject, body))
                    {
                        await smtp.SendMailAsync(message);
                    }
                }
                return Ok(new { Message = "Verification code sent successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Failed to send email.", Error = ex.Message });
            }
        }

        [HttpPost("verify-code")]
        public async Task<IActionResult> VerifyCode([FromBody] VerificationRequest request)
        {
            var filter = Builders<BsonDocument>.Filter.Eq("email", request.Email);
            var userRecords = await _usersCollection.Find(filter).ToListAsync();

            if (userRecords.Count == 0)
            {
                return NotFound(new { Message = "Email not found.", Code = 404 });
            }

            if (otpStore.TryGetValue(request.Email, out var otpData))
            {
                if (DateTime.UtcNow > otpData.Expiry)
                {
                    otpStore.TryRemove(request.Email, out _); // Remove expired OTP
                    return BadRequest(new { Message = "Verification code expired." });
                }

                if (otpData.Code == request.Code)
                {
                    otpStore.TryRemove(request.Email, out _);
                    return Ok(new { Message = "Code verified successfully." });
                }
                else
                {
                    return BadRequest(new { Message = "Invalid verification code." });
                }
            }
            else
            {
                return BadRequest(new { Message = "No verification code found for this email." });
            }

        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] EmailRequest request)
        {
            var filter = Builders<BsonDocument>.Filter.Eq("email", request.Email);
            var userRecords = await _usersCollection.Find(filter).ToListAsync();

            if (userRecords.Count == 0)
            {
                return NotFound(new { Message = "Email not found. Please contact admin.", Code = 404 });
            }

            string otpCode = new Random().Next(100000, 999999).ToString();
            DateTime expiryTime = DateTime.UtcNow.AddMinutes(OtpExpiryMinutes); // Set expiration

            otpStore[request.Email] = (otpCode, expiryTime);

            string from = "aliffmuhammad515@gmail.com";
            string pass = "majt hdyo pttq gdhd";
            string subject = "Reset Your Password";
            string body = $"Your reset password code is: {otpCode}";

            try
            {
                using (var smtp = new SmtpClient("smtp.gmail.com"))
                {
                    smtp.EnableSsl = true;
                    smtp.Port = 587;
                    smtp.Credentials = new NetworkCredential(from, pass);
                    smtp.DeliveryMethod = SmtpDeliveryMethod.Network;

                    using (var message = new MailMessage(from, request.Email, subject, body))
                    {
                        await smtp.SendMailAsync(message);
                    }
                }
                return Ok(new { Message = "Password code sent successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Failed to send email.", Error = ex.Message });
            }

        }

        #endregion

        #region Function
        // ✅ Function to Generate JWT Token
        private string GenerateJwtToken(string email, string role)
        {
            var secretKey = _configuration["JwtSettings:SecretKey"];
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim("role", role)
            };

            var token = new JwtSecurityToken(
                issuer: "http://localhost:5028",
                audience: "http://localhost:8000",
                claims: claims,
                expires: DateTime.Now.AddHours(2), // Token valid for 2 hours
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        #endregion
    }
    
}
