using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Configuration;

namespace otel_api.Services
{
    public class EmailService
    {
        private readonly IConfiguration _config;
        public EmailService(IConfiguration config) => _config = config;

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            try
            {
                var emailSettings = _config.GetSection("EmailSettings");
                
                var email = new MimeMessage();
                email.From.Add(new MailboxAddress(emailSettings["SenderName"] ?? "The Luna Suites", emailSettings["SenderEmail"]!));
                email.To.Add(new MailboxAddress("", toEmail));
                email.Subject = subject;

                // HTML destekli mail gövdesi
                var builder = new BodyBuilder { HtmlBody = body };
                email.Body = builder.ToMessageBody();

                using var smtp = new SmtpClient();
                await smtp.ConnectAsync(emailSettings["SmtpServer"]!, int.Parse(emailSettings["SmtpPort"]!), SecureSocketOptions.StartTls);
                await smtp.AuthenticateAsync(emailSettings["SenderEmail"]!, emailSettings["SenderPassword"]!);
                await smtp.SendAsync(email);
                await smtp.DisconnectAsync(true);
            }
            catch (Exception ex)
            {
                // Hata günlüğü tutulabilir, ancak çağıran kodu çökertmesini engelliyoruz
                Console.WriteLine($"E-posta gönderimi başarısız: {ex.Message}");
            }
        }
    }
}
