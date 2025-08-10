export function formatPhoneNumber(value: string) {
  // Remove todos os caracteres não numéricos
  const cleaned = value.replace(/\D/g, '');
  
  // Aplica a máscara (XX) XXXXX-XXXX
  if (cleaned.length <= 11) {
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    }
    if (cleaned.length > 7) {
      formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return formatted;
  }
  return value;
}

export function normalizePhoneNumber(value: string) {
  // Remove todos os caracteres não numéricos
  const cleaned = value.replace(/\D/g, '');
  
  // Converte para formato E.164 (+55XXXXXXXXXXX)
  if (cleaned.length === 10) {
    // Adiciona 9 para celular e código do país
    return `+55${cleaned.slice(0, 2)}9${cleaned.slice(2)}`;
  } else if (cleaned.length === 11) {
    // Adiciona apenas código do país
    return `+55${cleaned}`;
  } else if (cleaned.length === 13 && cleaned.startsWith('55')) {
    // Já tem código do país, adiciona apenas +
    return `+${cleaned}`;
  }
  return value;
}

export function validatePhoneE164(phone: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}
