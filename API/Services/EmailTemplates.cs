namespace API.Services;

public static class EmailTemplates
{
    private const string Footer = """

        —
        SPK Akademi
        destek@spkakademi.com
        """;
    private static string Subject(string title) => $"[SPK Akademi] {title}";

    public static (string Subject, string Body) AccessRequestCreated(string planName) =>
        (
            Subject("Erişim talebiniz alındı"),
            $"""
            Merhaba,

            "{planName}" için beta erişim talebiniz alındı ve inceleme kuyruğuna eklendi.
            Sonuç hakkında e-posta ile bilgilendirileceksiniz.
            {Footer}
            """);

    public static (string Subject, string Body) AccessRequestApproved(string planName) =>
        (
            Subject("Erişim talebiniz onaylandı"),
            $"""
            Merhaba,

            Erişim talebiniz onaylandı.
            "{planName}" lisansına artık öğrenci panelinden erişebilirsiniz.
            {Footer}
            """);

    public static (string Subject, string Body) AccessRequestRejected(string planName, string? adminNote) =>
        (
            Subject("Erişim talebiniz hakkında bilgilendirme"),
            $"""
            Merhaba,

            Erişim talebiniz şu anda onaylanamadı.
            Plan: {planName}
            {(string.IsNullOrWhiteSpace(adminNote) ? "" : $"Not: {adminNote}")}
            {Footer}
            """);

    public static (string Subject, string Body) PasswordReset(string resetLink) =>
        (
            Subject("Şifre sıfırlama bağlantısı"),
            $"""
            Merhaba,

            Şifrenizi yenilemek için aşağıdaki bağlantıyı kullanın:
            {resetLink}

            Bu isteği siz başlatmadıysanız bu mesaji yok sayabilirsiniz.
            {Footer}
            """);
}
