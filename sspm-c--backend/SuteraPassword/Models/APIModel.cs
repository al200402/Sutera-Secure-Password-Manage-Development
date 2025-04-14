namespace SuteraPassword.Models
{
    public class User
    {
        public string Id { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string Role { get; set; }
        public string Username { get; set; }
        public string Status { get; set; }
        public string Fname { get; set; }
        public string Lname { get; set; }
        public string Address { get; set; }
    }
   
    public class EmailRequest
    {
        public string Email { get; set; }
    }

    public class RoleRequest
    {
        public string Role { get; set; }
    }

    public class LoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class VerificationRequest
    {
        public string Email { get; set; }
        public string Code { get; set; }
    }

    public class ProfileUpdate()
    {
        public string Email { get; set; }
        public string Username { get; set; }
        //public string Password { get; set; }
    }

    public class UpdateRoleRequest()
    {
        public string Email { get; set; }
        public string Role { get; set; }
    }
}
