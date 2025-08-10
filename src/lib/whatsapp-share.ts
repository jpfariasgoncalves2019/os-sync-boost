export async function shareViaWhatsApp(
  file?: Blob | null, 
  fileName?: string, 
  phoneNumber?: string, 
  message?: string
): Promise<boolean> {
  try {
    // Detect platform
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const whatsappBaseUrl = isMobile ? "whatsapp://send" : "https://web.whatsapp.com/send";

    // Download file if provided
    if (file && fileName) {
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    // Validar e formatar número
    let cleanPhone = phoneNumber ? phoneNumber.replace(/[^\d]/g, '') : '';
    if (cleanPhone.length < 10 || cleanPhone.length > 13) {
      // Número inválido ou não informado: abrir WhatsApp sem número
      window.open(whatsappBaseUrl, "_blank");
      alert("Selecione o contato desejado e envie o PDF manualmente. Número de telefone inválido ou não cadastrado no WhatsApp.");
      return false;
    }

    // Mensagem padrão
    const whatsappMessage = encodeURIComponent(message || "Documento anexado. Por favor, envie o arquivo baixado.");
    // Monta URL
    const whatsappUrl = isMobile
      ? `whatsapp://send?phone=${cleanPhone}&text=${whatsappMessage}`
      : `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${whatsappMessage}`;

    window.open(whatsappUrl, "_blank");
    return true;
  } catch (error) {
    console.error("Erro ao compartilhar via WhatsApp:", error);
    alert("Erro ao abrir WhatsApp. Tente novamente ou envie manualmente.");
    return false;
  }
}

// Check if WhatsApp is likely installed (mobile detection)
export function isWhatsAppLikelyAvailable(): boolean {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}