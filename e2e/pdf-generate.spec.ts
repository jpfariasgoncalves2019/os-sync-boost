import { test, expect } from '@playwright/test';

test('Geração de PDF via menu de opções da OS', async ({ page }) => {
  // Acesse a página principal
  await page.goto('http://localhost:8081/');

  // Aguarda o card da OS estar visível
  const cardOS = page.getByText(/OS-202508-41043/);
  await expect(cardOS).toBeVisible();

  // Clica no botão de opções (três pontos) do card da OS
  const menuButton = cardOS.locator('xpath=../../..').locator('button[aria-label="Mais opções"], button[aria-haspopup]');
  await menuButton.click();

  // Aguarda e clica na opção "Gerar PDF"
  const gerarPDF = page.getByRole('menuitem', { name: /gerar pdf/i });
  await expect(gerarPDF).toBeVisible();
  await gerarPDF.click();

  // Aguarda algum tempo para o PDF ser gerado
  await page.waitForTimeout(2000);

  // Verifica se NÃO aparece o toast de erro
  const erroToast = page.getByText(/erro ao gerar pdf/i);
  await expect(erroToast).toHaveCount(0);
});
